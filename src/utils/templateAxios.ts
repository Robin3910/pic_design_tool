/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 新后端模板API请求工具 (48080端口)
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import app_config, { LocalStorageKey } from '@/config'
import { 
  getCurrentToken,
  handle401Error 
} from '@/utils/tokenRefreshManager'

// API基础配置（从统一配置中获取）
const API_BASE_URL = app_config.API_BASE_URL

// 创建axios实例
const templateAxios: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'tenant-id': '1' // 默认租户ID
  }
})

// 设置请求头的工具函数
function setAuthHeader(config: InternalAxiosRequestConfig, token?: string) {
  const accessToken = token || localStorage.getItem(LocalStorageKey.tokenKey)
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`
  }
}

// 请求拦截器（只负责设置 token，不进行主动刷新）
templateAxios.interceptors.request.use(
  (config) => {
    // 只设置当前的 token，不进行主动刷新
    // 如果 token 过期，后端会返回 401，由响应拦截器处理
    setAuthHeader(config)
    
    // 确保tenant-id存在
    if (!config.headers['tenant-id']) {
      config.headers['tenant-id'] = '1'
    }
    
    console.log('Template API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
      params: config.params
    })
    
    return config
  },
  (error) => {
    console.error('Template API Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
templateAxios.interceptors.response.use(
  async (response: AxiosResponse) => {
    console.log('Template API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })
    
    // 检查业务状态码
    if (response.data.code !== 0) {
      // 如果是401错误（未授权/Token过期），需要触发token刷新
      // 但是，如果是重试请求，不应该再次触发刷新（避免无限循环）
      if (response.data.code === 401 && !response.config._isRetryRequest) {
        console.warn('检测到401错误（Token过期），开始刷新Token:', {
          url: response.config.url,
          msg: response.data.msg
        })
        
        const config = response.config
        if (!config) {
          console.error('Token refresh failed: config is missing')
          const error = new Error(response.data.msg || '请求失败')
          ;(error as any).code = response.data.code
          return Promise.reject(error)
        }
        
        try {
          // 使用共享的 token 刷新管理器处理 401 错误
          const { handle401Error } = await import('@/utils/tokenRefreshManager')
          console.log('调用 handle401Error 刷新Token...')
          const retryResponse = await handle401Error(config, templateAxios)
          
          // 确保返回的是完整的 AxiosResponse 格式
          if (retryResponse && retryResponse.config) {
            console.log('Token刷新成功，重试请求成功:', {
              url: retryResponse.config.url,
              status: retryResponse.status,
              code: retryResponse.data?.code
            })
            return retryResponse
          } else {
            // 如果返回格式不正确，记录错误并拒绝
            console.error('Token刷新后返回的响应格式不正确:', retryResponse)
            const error = new Error('Token刷新后响应格式错误')
            ;(error as any).code = 401
            return Promise.reject(error)
          }
        } catch (refreshError: any) {
          // 刷新token失败，已跳转登录
          console.error('Token刷新失败，已跳转登录:', {
            message: refreshError?.message,
            error: refreshError
          })
          const error = new Error(refreshError?.message || '登录状态已过期，请重新登录')
          ;(error as any).code = 401
          return Promise.reject(error)
        }
      }
      
      // 其他业务错误，直接 reject
      console.warn('业务错误:', {
        url: response.config.url,
        code: response.data.code,
        msg: response.data.msg
      })
      const error = new Error(response.data.msg || '请求失败')
      ;(error as any).code = response.data.code
      return Promise.reject(error)
    }
    
    return response
  },
  async (error) => {
    console.error('Template API Response Error:', error)
    
    const { response, config } = error
    
    // 处理业务错误码
    if (response && response.data) {
      const code = response.data.code
      const msg = response.data.msg || response.data.message
      
      // 如果是401错误（未授权/Token过期）
      // 但是，如果是重试请求，不应该再次触发刷新（避免无限循环）
      if ((code === 401 || response.status === 401) && !config?._isRetryRequest) {
        console.warn('错误处理分支：检测到401错误（Token过期），开始刷新Token:', {
          url: config?.url,
          code,
          status: response.status,
          msg
        })
        
        // 如果没有config（请求配置丢失），直接拒绝
        if (!config) {
          console.error('Token refresh failed: config is missing', error)
          return Promise.reject(error)
        }
        
        try {
          // 使用共享的 token 刷新管理器处理 401 错误
          const { handle401Error } = await import('@/utils/tokenRefreshManager')
          console.log('错误处理分支：调用 handle401Error 刷新Token...')
          const retryResponse = await handle401Error(config, templateAxios)
          
          // 确保返回的是完整的 AxiosResponse 格式
          if (retryResponse && retryResponse.config) {
            console.log('错误处理分支：Token刷新成功，重试请求成功:', {
              url: retryResponse.config.url,
              status: retryResponse.status,
              code: retryResponse.data?.code
            })
            return retryResponse
          } else {
            // 如果返回格式不正确，记录错误并拒绝
            console.error('错误处理分支：Token刷新后返回的响应格式不正确:', retryResponse)
            const error = new Error('Token刷新后响应格式错误')
            ;(error as any).code = 401
            return Promise.reject(error)
          }
        } catch (refreshError: any) {
          // 刷新token失败，已跳转登录
          console.error('错误处理分支：Token刷新失败，已跳转登录:', {
            message: refreshError?.message,
            error: refreshError
          })
          const error = new Error(refreshError?.message || '登录状态已过期，请重新登录')
          ;(error as any).code = 401
          return Promise.reject(error)
        }
      }
      
      // 检查是否需要忽略的错误提示
      const { ignoreMsgs } = await import('@/utils/tokenRefreshManager')
      if (msg && ignoreMsgs.includes(msg)) {
        // 忽略的错误，直接 reject，不显示提示
        return Promise.reject('error')
      }
    }
    
    // 如果是HTTP 401错误（未授权/Token过期），且未在业务错误码中处理
    // 但是，如果是重试请求，不应该再次触发刷新（避免无限循环）
    if (response && response.status === 401 && (!response.data || response.data.code !== 401) && !config?._isRetryRequest) {
      console.warn('错误处理分支：检测到HTTP 401错误（Token过期），开始刷新Token:', {
        url: config?.url,
        status: response.status
      })
      
      // 如果没有config（请求配置丢失），直接拒绝
      if (!config) {
        console.error('Token refresh failed: config is missing', error)
        return Promise.reject(error)
      }
      
      try {
        // 使用共享的 token 刷新管理器处理 401 错误
        const { handle401Error } = await import('@/utils/tokenRefreshManager')
        console.log('错误处理分支：调用 handle401Error 刷新Token...')
        const retryResponse = await handle401Error(config, templateAxios)
        console.log('错误处理分支：Token刷新成功，重试请求成功:', {
          url: retryResponse.config?.url || retryResponse.url,
          status: retryResponse.status || retryResponse.code,
          code: retryResponse.data?.code
        })
        return retryResponse
      } catch (refreshError: any) {
        // 刷新token失败，已跳转登录
        console.error('错误处理分支：Token刷新失败，已跳转登录:', refreshError)
        const error = new Error(refreshError?.message || '登录状态已过期，请重新登录')
        ;(error as any).code = 401
        return Promise.reject(error)
      }
    }
    
    // 处理其他HTTP错误
    if (error.response) {
      const { status, data } = error.response
      let message = `HTTP ${status}: ${error.message}`
      
      if (data && data.msg) {
        message = data.msg
      } else if (data && data.message) {
        message = data.message
      }
      
      const customError = new Error(message)
      ;(customError as any).status = status
      ;(customError as any).code = data?.code
      return Promise.reject(customError)
    }
    
    // 处理网络错误
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('请求超时，请检查网络连接'))
    }
    
    if (error.message === 'Network Error') {
      return Promise.reject(new Error('网络错误，请检查网络连接'))
    }
    
    return Promise.reject(error)
  }
)

// 封装常用请求方法
export const templateRequest = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return templateAxios.get(url, config).then(res => res.data)
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return templateAxios.post(url, data, config).then(res => res.data)
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return templateAxios.put(url, data, config).then(res => res.data)
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return templateAxios.delete(url, config).then(res => res.data)
  }
}

// 导出axios实例和请求工具
export { templateAxios }
export default templateRequest
