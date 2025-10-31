/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 认证相关API接口
 */

import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { LocalStorageKey } from '@/config'

// 新后端API配置
const API_BASE_URL = 'http://localhost:48080/admin-api'

// 创建认证专用的axios实例
const authAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'tenant-id': '1'
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
authAxios.interceptors.request.use(
  (config) => {
    // 添加token
    setAuthHeader(config)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
authAxios.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
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
            resolve(authAxios(config))
          })
        })
      }
      
      // 开始刷新token
      isRefreshing = true
      const refreshToken = localStorage.getItem(LocalStorageKey.refreshTokenKey)
      
      if (!refreshToken) {
        // 没有refreshToken，跳转登录
        clearTokens()
        redirectToLogin()
        isRefreshing = false
        return Promise.reject(error)
      }
      
      try {
        // 调用刷新token接口
        const refreshRes = await axios.post(`${API_BASE_URL}/system/auth/refresh-token`, null, {
          params: { refreshToken }
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
          return authAxios(config)
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
    
    return Promise.reject(error)
  }
)

// API响应类型定义
interface ApiResponse<T = any> {
  code: number
  data: T
  msg?: string
}

// 登录接口
export const login = async (username: string, password: string): Promise<ApiResponse> => {
  try {
    const response = await authAxios.post('/system/auth/login', {
      username,
      password
    })
    const apiResponse = response as unknown as ApiResponse
    // 保存token信息
    if (apiResponse.code === 0 && apiResponse.data) {
      const { accessToken, refreshToken, expiresTime } = apiResponse.data
      if (accessToken) {
        saveTokens(accessToken, refreshToken || '', expiresTime)
      }
    }
    return apiResponse
  } catch (error: any) {
    throw new Error(error.response?.data?.msg || '登录失败')
  }
}

// 注册接口
export const register = async (username: string, password: string, email?: string): Promise<ApiResponse> => {
  try {
    const response = await authAxios.post('/system/auth/register', {
      username,
      password,
      email
    })
    return response as unknown as ApiResponse
  } catch (error: any) {
    throw new Error(error.response?.data?.msg || '注册失败')
  }
}

// 获取用户信息
export const getUserInfo = async (): Promise<ApiResponse> => {
  try {
    const response = await authAxios.get('/system/auth/get-permission-info')
    return response as unknown as ApiResponse
  } catch (error: any) {
    throw new Error(error.response?.data?.msg || '获取用户信息失败')
  }
}

// 登出接口
export const logout = async (): Promise<ApiResponse> => {
  try {
    await authAxios.post('/system/auth/logout')
    clearTokens()
    return { code: 0, data: null }
  } catch (error: any) {
    // 即使登出失败，也清除本地token
    clearTokens()
    throw new Error(error.response?.data?.msg || '登出失败')
  }
}

// 刷新token（手动调用，通常由拦截器自动调用）
export const refreshToken = async (): Promise<ApiResponse> => {
  const refreshTokenValue = localStorage.getItem(LocalStorageKey.refreshTokenKey)
  if (!refreshTokenValue) {
    throw new Error('刷新令牌不存在')
  }
  
  try {
    const response = await axios.post(`${API_BASE_URL}/system/auth/refresh-token`, null, {
      params: { refreshToken: refreshTokenValue }
    })
    const apiResponse = response.data as ApiResponse
    if (apiResponse.code === 0 && apiResponse.data) {
      const { accessToken, refreshToken: newRefreshToken, expiresTime } = apiResponse.data
      saveTokens(accessToken, newRefreshToken || refreshTokenValue, expiresTime)
    }
    return apiResponse
  } catch (error: any) {
    clearTokens()
    throw new Error(error.response?.data?.msg || '刷新token失败')
  }
}

export default {
  login,
  register,
  getUserInfo,
  logout,
  refreshToken
}
