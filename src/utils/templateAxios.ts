/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 新后端模板API请求工具 (48080端口)
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { LocalStorageKey } from '@/config'

// API基础配置
const API_BASE_URL = 'http://localhost:48080/admin-api'

// 创建axios实例
const templateAxios: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'tenant-id': '1' // 默认租户ID
  }
})

// Token刷新相关状态
let isRefreshing = false
let requests: Array<(token: string) => void> = []

// 清除token的工具函数
function clearTokens() {
  localStorage.removeItem(LocalStorageKey.tokenKey)
  localStorage.removeItem(LocalStorageKey.refreshTokenKey)
  localStorage.removeItem(LocalStorageKey.expiresTimeKey)
}

// 跳转到登录页
function redirectToLogin() {
  window.location.href = '/login'
}

// 设置请求头的工具函数
function setAuthHeader(config: InternalAxiosRequestConfig, token?: string) {
  const accessToken = token || localStorage.getItem(LocalStorageKey.tokenKey)
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`
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

// 请求拦截器
templateAxios.interceptors.request.use(
  (config) => {
    // 获取token
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
  (response: AxiosResponse) => {
    console.log('Template API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })
    
    // 检查业务状态码
    if (response.data.code !== 0) {
      const error = new Error(response.data.msg || '请求失败')
      ;(error as any).code = response.data.code
      return Promise.reject(error)
    }
    
    return response
  },
  async (error) => {
    console.error('Template API Response Error:', error)
    
    const { response, config } = error
    
    // 如果是401错误（未授权/Token过期）
    if (response && response.status === 401) {
      // 如果是刷新token的接口失败，直接跳转登录
      if (config.url && config.url.includes('/refresh-token')) {
        clearTokens()
        redirectToLogin()
        return Promise.reject(error)
      }
      
      // 如果正在刷新token，将请求加入队列
      if (isRefreshing) {
        return new Promise((resolve) => {
          requests.push((token: string) => {
            setAuthHeader(config as InternalAxiosRequestConfig, token)
            resolve(templateAxios(config))
          })
        })
      }
      
      // 开始刷新token
      isRefreshing = true
      const refreshTokenValue = localStorage.getItem(LocalStorageKey.refreshTokenKey)
      
      if (!refreshTokenValue) {
        // 没有refreshToken，跳转登录
        clearTokens()
        redirectToLogin()
        isRefreshing = false
        return Promise.reject(error)
      }
      
      try {
        // 调用刷新token接口
        const refreshRes = await axios.post(`${API_BASE_URL}/system/auth/refresh-token`, null, {
          params: { refreshToken: refreshTokenValue }
        })
        
        if (refreshRes.data.code === 0) {
          // 保存新的token
          const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresTime } = refreshRes.data.data
          saveTokens(newAccessToken, newRefreshToken, expiresTime)
          
          // 更新请求头
          setAuthHeader(config as InternalAxiosRequestConfig, newAccessToken)
          
          // 执行队列中的请求
          requests.forEach(cb => cb(newAccessToken))
          requests = []
          
          // 重试原请求
          return templateAxios(config)
        } else {
          // 刷新token失败（业务错误码）
          throw new Error(refreshRes.data.msg || '刷新token失败')
        }
      } catch (refreshError: any) {
        // 刷新token失败，跳转登录
        clearTokens()
        
        // 执行队列中的请求（但会失败）
        requests.forEach(cb => cb(''))
        requests = []
        
        redirectToLogin()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
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
