/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: Token 刷新管理器 - 统一管理所有 axios 实例的 token 刷新逻辑
 * 参考文档逻辑：https://www.dashingdog.cn/article/11
 */

import axios from 'axios'
import { ElMessageBox } from 'element-plus'
import { LocalStorageKey } from '@/config'
import { useAuthStore } from '@/store'

// API基础配置
const API_BASE_URL = 'http://localhost:48080/admin-api'

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

// Token刷新相关状态（全局共享）
// 请求队列：刷新期间，其他请求会被加入队列，等待刷新完成
let requestList: Array<() => void> = []
// 是否正在刷新中
let isRefreshing = false
// 是否正在显示重新登录对话框（防止重复弹窗）
const isRelogin = { show: false }

// 清除token的工具函数
function clearTokens() {
  localStorage.removeItem(LocalStorageKey.tokenKey)
  localStorage.removeItem(LocalStorageKey.refreshTokenKey)
  localStorage.removeItem(LocalStorageKey.expiresTimeKey)
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
  const refreshTokenValue = getRefreshToken()
  if (!refreshTokenValue) {
    return null
  }

  try {
    console.log('Calling refresh token API')
    // 调用刷新token接口（使用URL参数，匹配后端 @RequestParam）
    // 注意：刷新接口本身不需要 token，已在白名单中
    axios.defaults.headers.common['tenant-id'] = '1'
    const refreshRes = await axios.post(
      `${API_BASE_URL}${REFRESH_TOKEN_URL}?refreshToken=${refreshTokenValue}`,
      null,
      {
        headers: {
          'Content-Type': 'application/json',
          'tenant-id': '1'
          // 注意：不设置 Authorization 头，刷新接口不需要 token
        }
      }
    )

    if (refreshRes.data && refreshRes.data.code === 0) {
      const { accessToken, refreshToken: newRefreshToken, expiresTime } = refreshRes.data.data
      if (!accessToken) {
        throw new Error('刷新token返回的accessToken为空')
      }

      console.log('Token refresh successful')
      return {
        accessToken,
        refreshToken: newRefreshToken || refreshTokenValue,
        expiresTime
      }
    } else {
      // 刷新token失败（业务错误码）
      const errorMsg = refreshRes.data?.msg || refreshRes.data?.message || '刷新token失败'
      throw new Error(errorMsg)
    }
  } catch (error: any) {
    console.error('Token refresh error:', error)
    throw error
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
  // 如果是刷新token的接口或登录接口返回401，直接跳转登录（避免循环依赖）
  if (config?.url && isRefreshOrLoginUrl(config.url)) {
    console.warn('Refresh token or login endpoint returned 401, redirecting to login')
    clearTokens()
    handleAuthorized()
    return Promise.reject('登录状态已过期')
  }

  // 如果未认证，并且未进行刷新令牌，说明可能是访问令牌过期了
  if (!isRefreshing) {
    isRefreshing = true
    
    // 1. 如果获取不到刷新令牌，则只能执行登出操作
    if (!getRefreshToken()) {
      return handleAuthorized()
    }
    
    // 2. 进行刷新访问令牌
    try {
      const refreshTokenRes = await refreshToken()
      
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
        
        // 更新请求头
        config.headers!.Authorization = 'Bearer ' + getAccessToken()
        
        // 回放队列的请求
        requestList.forEach((cb: any) => {
          cb()
        })
        requestList = []
        
        // 重试当前请求
        return service(config)
      } else {
        // 刷新失败，执行登出
        return handleAuthorized()
      }
    } catch (e) {
      // 为什么需要 catch 异常呢？刷新失败时，请求因为 Promise.reject 触发异常。
      // 2.2 刷新失败，只回放队列的请求（不回放当前请求，避免递归）
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
    return new Promise((resolve) => {
      requestList.push(() => {
        config.headers!.Authorization = 'Bearer ' + getAccessToken() // 让每个请求携带自定义token
        resolve(service(config))
      })
    })
  }
}

// 导出工具函数和配置
export { clearTokens, redirectToLogin, saveTokens, handleAuthorized }
export { ignoreMsgs, whiteList }

