/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: Token 刷新管理器 - 统一管理所有 axios 实例的 token 刷新逻辑
 * 参考文档逻辑：https://www.dashingdog.cn/article/11
 */

import axios from 'axios'
import { ElMessageBox } from 'element-plus'
import app_config, { LocalStorageKey } from '@/config'
import { useAuthStore } from '@/store'

// API基础配置（从统一配置中获取）
const API_BASE_URL = app_config.API_BASE_URL

// 刷新接口白名单（这些接口不需要 token，也不会触发刷新）
const REFRESH_TOKEN_URL = '/system/auth/refresh-token'
const LOGIN_URL = '/system/auth/login'

// 请求白名单，无须token的接口
const whiteList: string[] = [REFRESH_TOKEN_URL, LOGIN_URL]

// 需要忽略的提示。忽略后，自动 Promise.reject('error')
// 刷新令牌被删除时，不用提示
// 使用刷新令牌，刷新获取新的访问令牌时，结果因为过期失败，此时需要忽略。否则，会导致继续 401，无法跳转到登出界面
const ignoreMsgs = [
  '无效的刷新令牌',
  '刷新令牌已过期',
  '刷新令牌无效'
]

// 为刷新接口单独创建 axios 实例，避免全局拦截器篡改请求体或响应结构
const refreshAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'tenant-id': '1'
  }
})

// Token刷新相关状态（全局共享）
// 请求队列：刷新期间，其他请求会被加入队列，等待刷新完成
let requestList: Array<() => void> = []
// 是否正在刷新中
let isRefreshing = false
// 是否正在显示重新登录对话框（防止重复弹窗）
const isRelogin = { show: false }
// 是否已经检测到无refreshToken（避免重复尝试）
let hasNoRefreshToken = false
// 主动刷新定时器
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

// 停止主动刷新定时器（提前声明，供clearTokens使用）
function stopAutoRefreshInternal(): void {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
    console.log('Token主动刷新机制已停止')
  }
}

// 清除token的工具函数
function clearTokens() {
  localStorage.removeItem(LocalStorageKey.tokenKey)
  localStorage.removeItem(LocalStorageKey.refreshTokenKey)
  localStorage.removeItem(LocalStorageKey.expiresTimeKey)
  // 停止主动刷新定时器
  stopAutoRefreshInternal()
  // 重置无refreshToken标志
  hasNoRefreshToken = false
}

// 跳转到登录页（带 redirect 参数）
function redirectToLogin(redirectPath?: string) {
  if (redirectPath) {
    window.location.href = `/login?redirect=${encodeURIComponent(redirectPath)}`
  } else {
    // 尝试从当前路径获取 redirect 参数
    const currentPath = window.location.pathname + window.location.search
    if (currentPath !== '/login') {
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
    } else {
      window.location.href = '/login'
    }
  }
}

// 保存token的工具函数
function saveTokens(accessToken: string, refreshToken: string, expiresTime?: string) {
  localStorage.setItem(LocalStorageKey.tokenKey, accessToken)
  localStorage.setItem(LocalStorageKey.refreshTokenKey, refreshToken)
  if (expiresTime) {
    localStorage.setItem(LocalStorageKey.expiresTimeKey, expiresTime)
  }
}

// 解析过期时间（支持时间戳和 ISO 8601 格式）
// 支持格式：
// 1. 时间戳（毫秒）："1699123456789"
// 2. 时间戳（秒）："1699123456"（小于13位，自动转换为毫秒）
// 3. ISO 8601 格式（带时区）："2024-12-19T10:30:00Z" 或 "2024-12-19T10:30:00+08:00"
// 4. ISO 8601 格式（不带时区，后端 LocalDateTime 序列化）："2024-12-19T10:30:00"
function parseExpiresTime(expiresTime: string): number | null {
  if (!expiresTime) {
    return null
  }

  try {
    // 先尝试作为时间戳（毫秒）解析
    const timestamp = parseInt(expiresTime, 10)
    if (!isNaN(timestamp) && timestamp > 0) {
      // 如果是秒级时间戳（小于 13 位），转换为毫秒
      if (timestamp < 1000000000000) {
        return timestamp * 1000
      }
      return timestamp
    }
    
    // 尝试作为 ISO 8601 格式解析
    // JavaScript 的 Date 构造函数可以解析多种 ISO 8601 格式：
    // - "2024-12-19T10:30:00"（不带时区，会被解释为本地时间）
    // - "2024-12-19T10:30:00Z"（UTC）
    // - "2024-12-19T10:30:00+08:00"（带时区）
    const date = new Date(expiresTime)
    if (!isNaN(date.getTime()) && date.getTime() > 0) {
      return date.getTime()
    }
    
    return null
  } catch (error) {
    console.warn('Failed to parse expiresTime:', error, expiresTime)
    return null
  }
}

// 检查 token 是否已过期（用于调试或手动检查）
export function isTokenExpired(): boolean {
  const expiresTime = localStorage.getItem(LocalStorageKey.expiresTimeKey)
  if (!expiresTime) {
    return true
  }

  const expiresTimestamp = parseExpiresTime(expiresTime)
  if (expiresTimestamp === null) {
    // 解析失败时，保守策略：认为已过期，让后端验证
    return false
  }

  const now = Date.now()
  return now >= expiresTimestamp
}

// 获取当前 token（用于请求拦截器）
export function getCurrentToken(): string | null {
  return localStorage.getItem(LocalStorageKey.tokenKey)
}

// 获取 refreshToken
function getRefreshToken(): string | null {
  return localStorage.getItem(LocalStorageKey.refreshTokenKey)
}

// 获取 accessToken
function getAccessToken(): string | null {
  return localStorage.getItem(LocalStorageKey.tokenKey)
}

// 刷新 token（核心逻辑）
// 调用后端接口刷新 token
export async function refreshToken(): Promise<{ accessToken: string; refreshToken: string; expiresTime?: string } | null> {
  console.log('refreshToken函数被调用')
  const refreshTokenValue = getRefreshToken()
  console.log('获取refreshToken值:', {
    hasValue: !!refreshTokenValue,
    valueLength: refreshTokenValue?.length,
    valuePreview: refreshTokenValue ? refreshTokenValue.substring(0, 20) + '...' : 'null'
  })
  
  if (!refreshTokenValue) {
    console.warn('refreshToken值为空，返回null')
    return null
  }

  try {
    console.log('开始刷新Token，refreshToken值:', refreshTokenValue.substring(0, 20) + '...')
    
    // 获取当前的access token（即使过期，后端可能也需要它来识别用户）
    const currentAccessToken = getAccessToken()
    
    // 使用 application/x-www-form-urlencoded 形式提交 refreshToken
    const formData = new URLSearchParams()
    formData.set('refreshToken', refreshTokenValue)

    console.log('使用表单数据刷新Token:', {
      url: REFRESH_TOKEN_URL,
      payload: formData.toString()
    })

    const refreshRes = await refreshAxios.post(
      REFRESH_TOKEN_URL,
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...(currentAccessToken ? { Authorization: `Bearer ${currentAccessToken}` } : {})
        },
        params: undefined
      }
    )

    // 兼容存在全局响应拦截器时直接返回数据体的情况
    const responseData = (refreshRes && typeof refreshRes === 'object' && 'data' in refreshRes)
      ? (refreshRes as any).data
      : refreshRes

    if (!responseData || typeof responseData !== 'object') {
      console.error('刷新Token接口返回的数据格式错误:', refreshRes)
      throw new Error('刷新Token接口返回的数据格式错误')
    }

    const resultCode = (responseData as any).code
    const resultMsg = (responseData as any).msg || (responseData as any).message
    const resultData = (responseData as any).data

    console.log('刷新Token接口响应:', {
      resultCode,
      hasData: !!resultData,
      resultMsg
    })

    if (resultCode === 0) {
      if (!resultData || typeof resultData !== 'object') {
        console.error('刷新token返回的data格式错误:', responseData)
        throw new Error('刷新token返回的数据格式错误')
      }
      
      // 安全解构：确保解构的对象存在
      const tokenData = resultData
      const accessToken = tokenData?.accessToken
      const newRefreshToken = tokenData?.refreshToken
      const expiresTime = tokenData?.expiresTime
      
      if (!accessToken || typeof accessToken !== 'string') {
        console.error('刷新token返回的accessToken为空或格式错误:', { accessToken, tokenData })
        throw new Error('刷新token返回的accessToken为空')
      }

      console.log('Token刷新成功:', {
        accessToken: accessToken.substring(0, 20) + '...',
        hasRefreshToken: !!newRefreshToken,
        expiresTime
      })
      return {
        accessToken,
        refreshToken: (newRefreshToken && typeof newRefreshToken === 'string') ? newRefreshToken : refreshTokenValue,
        expiresTime: expiresTime && typeof expiresTime === 'string' ? expiresTime : undefined
      }
    } else {
      // 刷新token失败（业务错误码）
      const errorMsg = resultMsg || '刷新token失败'
      console.error('刷新Token失败（业务错误）:', {
        resultCode,
        errorMsg,
        responseData
      })
      throw new Error(errorMsg)
    }
  } catch (error: any) {
    // 详细记录错误信息，便于调试
    // 安全地访问 error 对象的属性，避免解构 undefined 或 null
    const errorMessage = error?.message || String(error) || '未知错误'
    const errorResponse = error?.response
    const errorResponseData = errorResponse?.data
    const errorStatus = errorResponse?.status
    const errorUrl = error?.config?.url
    const errorCode = error?.code
    
    const errorInfo = {
      message: errorMessage,
      response: errorResponseData,
      status: errorStatus,
      url: errorUrl,
      code: errorCode,
      refreshTokenValue: refreshTokenValue ? refreshTokenValue.substring(0, 20) + '...' : 'null',
      // 添加更详细的错误信息
      fullError: error,
      responseHeaders: errorResponse?.headers,
      requestConfig: error?.config
    }
    console.error('Token刷新异常（所有方式都失败）:', errorInfo)
    console.error('详细错误对象:', error)
    
    // 如果是网络错误或超时，提供更明确的错误信息
    if (errorCode === 'ECONNABORTED' || errorMessage?.includes('timeout')) {
      throw new Error('刷新Token请求超时，请检查网络连接')
    }
    
    if (errorMessage === 'Network Error' || errorCode === 'ERR_NETWORK') {
      throw new Error('刷新Token网络错误，请检查网络连接')
    }
    
    // 如果是401错误，说明refreshToken也过期了
    if (errorStatus === 401 || errorResponseData?.code === 401) {
      const errorMsg = errorResponseData?.msg || errorResponseData?.message || '刷新令牌已过期'
      throw new Error(errorMsg)
    }
    
    // 如果是业务错误，使用后端返回的错误信息
    if (errorResponseData?.msg || errorResponseData?.message) {
      throw new Error(errorResponseData?.msg || errorResponseData?.message)
    }
    
    // 如果错误信息是 "Cannot convert undefined or null to object"，提供更友好的提示
    if (errorMessage?.includes('Cannot convert undefined or null to object')) {
      throw new Error('刷新Token时数据格式错误，请重新登录')
    }
    
    // 如果 error 本身是一个 Error 对象，直接抛出；否则包装成 Error
    if (error instanceof Error) {
    throw error
    } else {
      throw new Error(errorMessage)
    }
  }
}

// 检查是否为刷新 token 接口或登录接口
function isRefreshOrLoginUrl(url: string): boolean {
  if (!url) return false
  return url.includes(REFRESH_TOKEN_URL) || url.includes(LOGIN_URL)
}

// 处理认证失败（显示确认对话框并跳转登录）
function handleAuthorized(): Promise<never> {
  // 如果已经到登录页面则不进行弹窗提示
  if (window.location.href.includes('/login')) {
    return Promise.reject('登录状态已过期')
  }
  
  // 防止重复弹窗
  if (isRelogin.show) {
    return Promise.reject('登录状态已过期')
  }
  
  isRelogin.show = true
  
  // 获取当前路径作为 redirect 参数
  const currentPath = window.location.pathname + window.location.search
  const redirectPath = currentPath !== '/login' ? currentPath : '/'
  
  ElMessageBox.confirm(
    '登录状态已过期，请重新登录',
    '提示',
    {
      showCancelButton: false,
      closeOnClickModal: false,
      showClose: false,
      closeOnPressEscape: false,
      confirmButtonText: '重新登录',
      type: 'warning'
    }
  ).then(() => {
    // 清除认证状态
    try {
      const authStore = useAuthStore()
      authStore.clearAuth()
    } catch (error) {
      console.warn('Failed to clear auth store:', error)
    }
    
    clearTokens()
    isRelogin.show = false
    
    // 刷新页面后走路由守卫，自动跳转到登录页
    window.location.href = window.location.href
  }).catch(() => {
    // 用户取消，但还是要跳转（参考文档行为）
    isRelogin.show = false
    clearTokens()
    redirectToLogin(redirectPath)
  })
  
  return Promise.reject('登录状态已过期')
}

// 处理 401 错误并刷新 token（被动刷新机制）
// 参考文档逻辑：https://www.dashingdog.cn/article/11
export async function handle401Error(config: any, service: any): Promise<any> {
  // 详细检查 localStorage 中的 token 状态
  const accessToken = getAccessToken()
  const refreshTokenValue = getRefreshToken()
  const expiresTime = localStorage.getItem(LocalStorageKey.expiresTimeKey)
  
  // 减少详细日志输出，只在调试时启用
  // console.log('handle401Error被调用:', {
  //   url: config?.url,
  //   method: config?.method,
  //   isRefreshing,
  //   hasAccessToken: !!accessToken,
  //   hasRefreshToken: !!refreshTokenValue,
  //   accessTokenLength: accessToken?.length,
  //   refreshTokenLength: refreshTokenValue?.length,
  //   expiresTime,
  //   localStorageKeys: Object.keys(localStorage).filter(key => 
  //     key.includes('token') || key.includes('Token') || key.includes('auth') || key.includes('Auth')
  //   )
  // })

  // 如果是刷新token的接口或登录接口返回401，直接跳转登录（避免循环依赖）
  if (config?.url && isRefreshOrLoginUrl(config.url)) {
    console.warn('刷新token或登录接口返回401，直接跳转登录')
    clearTokens()
    handleAuthorized()
    return Promise.reject('登录状态已过期')
  }

  // 如果已经检测到无refreshToken，直接跳转登录（避免重复尝试）
  if (hasNoRefreshToken) {
    console.log('已检测到无refreshToken，直接跳转登录，跳过刷新流程')
    return handleAuthorized()
  }

  // 如果未认证，并且未进行刷新令牌，说明可能是访问令牌过期了
  if (!isRefreshing) {
    // 静默处理，减少控制台日志
    // console.log('开始刷新Token流程...')
    isRefreshing = true
    
    // 1. 如果获取不到刷新令牌，则只能执行登出操作
    if (!refreshTokenValue) {
      // 静默处理，减少控制台日志
      // console.warn('无法获取refreshToken，用户未登录，直接跳转登录页')
      hasNoRefreshToken = true
      isRefreshing = false
      return handleAuthorized()
    }
    
    // 2. 进行刷新访问令牌
    try {
      console.log('准备调用 refreshToken() 函数...')
      const refreshTokenRes = await refreshToken()
      console.log('refreshToken() 调用完成，结果:', {
        hasResult: !!refreshTokenRes,
        hasAccessToken: !!refreshTokenRes?.accessToken,
        hasRefreshToken: !!refreshTokenRes?.refreshToken,
        result: refreshTokenRes
      })
      
      // 2.1 刷新成功，则回放队列的请求 + 当前请求
      if (refreshTokenRes) {
        saveTokens(refreshTokenRes.accessToken, refreshTokenRes.refreshToken, refreshTokenRes.expiresTime)
        
        // 同步更新Store的token状态
        try {
          const authStore = useAuthStore()
          authStore.token = refreshTokenRes.accessToken
        } catch (storeError) {
          console.warn('Failed to update auth store token:', storeError)
        }
        
        // 确保headers对象存在
        if (!config.headers) {
          config.headers = {}
        }
        // 更新请求头，使用新刷新的token
        config.headers.Authorization = 'Bearer ' + refreshTokenRes.accessToken
        
        console.log('Token刷新成功，准备重试请求:', {
          url: config.url,
          method: config.method,
          newToken: refreshTokenRes.accessToken.substring(0, 20) + '...'
        })
        
        // 回放队列的请求
        requestList.forEach((cb: any) => {
          cb()
        })
        requestList = []
        
        // 重试当前请求（使用新的token）
        // 标记这是一个重试请求，避免响应拦截器再次处理401
        config._retry = true
        config._isRetryRequest = true
        
        try {
          const retryResponse = await service(config)
          console.log('重试请求成功:', {
            url: config.url,
            status: retryResponse?.status || retryResponse?.code,
            isAxiosResponse: retryResponse?.config !== undefined,
            hasData: !!retryResponse?.data,
            dataCode: retryResponse?.data?.code
          })
          
          // 确保返回的是完整的 AxiosResponse 格式
          // templateAxios 返回的是 AxiosResponse，响应拦截器会处理
          return retryResponse
        } catch (retryError: any) {
          console.error('重试请求失败:', {
            url: config.url,
            error: retryError?.message,
            status: retryError?.response?.status,
            code: retryError?.code || retryError?.response?.data?.code,
            responseData: retryError?.response?.data,
            isRetryRequest: config._isRetryRequest
          })
          
          // 如果重试仍然失败，可能是token无效或其他问题
          if (retryError?.response?.status === 401 || retryError?.code === 401 || retryError?.response?.data?.code === 401) {
            // 再次401，说明刷新后的token也无效，需要重新登录
            console.error('重试后仍然401，刷新后的token无效，需要重新登录')
            isRefreshing = false // 重置刷新状态
            return handleAuthorized()
          }
          throw retryError
        }
      } else {
        // 刷新失败，执行登出
        console.error('refreshToken() 返回 null，刷新失败，执行登出')
        return handleAuthorized()
      }
    } catch (e: any) {
      // 为什么需要 catch 异常呢？刷新失败时，请求因为 Promise.reject 触发异常。
      // 2.2 刷新失败，只回放队列的请求（不回放当前请求，避免递归）
      const errorMsg = e?.message || String(e) || '未知错误'
      
      // 如果是刷新令牌相关的错误，标记为无refreshToken
      if (errorMsg.includes('刷新令牌') || errorMsg.includes('无效的刷新令牌') || 
          errorMsg.includes('刷新令牌已过期') || errorMsg.includes('刷新令牌无效')) {
        console.warn('刷新令牌无效或过期，标记为无refreshToken状态')
        hasNoRefreshToken = true
      }
      
      console.error('Token刷新流程异常:', {
        error: errorMsg,
        errorType: e?.constructor?.name,
        response: e?.response?.data,
        status: e?.response?.status,
        code: e?.code
      })
      
      requestList.forEach((cb: any) => {
        cb()
      })
      requestList = []
      
      // 提示是否要登出。即不回放当前请求！不然会形成递归
      return handleAuthorized()
    } finally {
      isRefreshing = false
    }
  } else {
    // 添加到队列，等待刷新获取到新的令牌
    return new Promise((resolve, reject) => {
      requestList.push(() => {
        // 确保headers对象存在
        if (!config.headers) {
          config.headers = {}
        }
        // 使用最新刷新的token
        const currentToken = getAccessToken()
        if (currentToken) {
          config.headers.Authorization = 'Bearer ' + currentToken
        }
        // 重试请求
        // 标记这是重试请求，避免响应拦截器再次处理401
        config._retry = true
        config._isRetryRequest = true
        
        service(config)
          .then((response: any) => {
            console.log('队列请求重试成功:', {
              url: config.url,
              status: response?.status || response?.code,
              dataCode: response?.data?.code
            })
            resolve(response)
          })
          .catch((error: any) => {
            console.error('队列请求重试失败:', {
              url: config.url,
              error: error?.message,
              status: error?.response?.status,
              code: error?.code || error?.response?.data?.code,
              responseData: error?.response?.data
            })
            reject(error)
          })
      })
    })
  }
}

// 主动刷新Token（在Token即将过期前刷新）
// 检查Token是否即将过期，如果是则主动刷新
async function checkAndRefreshTokenIfNeeded(): Promise<void> {
  // 如果正在刷新中，跳过
  if (isRefreshing) {
    return
  }

  const expiresTime = localStorage.getItem(LocalStorageKey.expiresTimeKey)
  if (!expiresTime) {
    return
  }

  const expiresTimestamp = parseExpiresTime(expiresTime)
  if (expiresTimestamp === null) {
    return
  }

  const now = Date.now()
  const timeUntilExpiry = expiresTimestamp - now

  // 如果Token在5分钟内过期，主动刷新
  // 5分钟 = 5 * 60 * 1000 毫秒
  const refreshThreshold = 5 * 60 * 1000

  if (timeUntilExpiry > 0 && timeUntilExpiry < refreshThreshold) {
    console.log('Token即将过期，主动刷新...', {
      timeUntilExpiry: Math.floor(timeUntilExpiry / 1000),
      seconds: '秒'
    })
    
    try {
      const refreshTokenRes = await refreshToken()
      if (refreshTokenRes) {
        saveTokens(refreshTokenRes.accessToken, refreshTokenRes.refreshToken, refreshTokenRes.expiresTime)
        
        // 同步更新Store的token状态
        try {
          const authStore = useAuthStore()
          authStore.token = refreshTokenRes.accessToken
        } catch (storeError) {
          console.warn('Failed to update auth store token:', storeError)
        }
        
        console.log('Token主动刷新成功')
      }
    } catch (error: any) {
      console.error('Token主动刷新失败:', {
        error: error?.message,
        response: error?.response?.data
      })
      // 主动刷新失败不影响当前使用，等待被动刷新处理
    }
  }
}

// 启动主动刷新定时器
// 每5分钟检查一次Token是否即将过期
export function startAutoRefresh(): void {
  // 先清除旧的定时器
  stopAutoRefreshInternal()

  // 立即检查一次
  checkAndRefreshTokenIfNeeded()

  // 每5分钟检查一次
  autoRefreshTimer = setInterval(() => {
    checkAndRefreshTokenIfNeeded()
  }, 5 * 60 * 1000) // 5分钟

  console.log('Token主动刷新机制已启动（每5分钟检查一次）')
}

// 停止主动刷新定时器（导出函数）
export function stopAutoRefresh(): void {
  stopAutoRefreshInternal()
}

// 导出工具函数和配置
export { clearTokens, redirectToLogin, saveTokens, handleAuthorized }
export { ignoreMsgs, whiteList }

