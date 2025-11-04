/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 认证相关API接口
 */

import axios, { AxiosRequestConfig } from 'axios'
import { LocalStorageKey } from '@/config'
import { 
  refreshTokenIfNeeded, 
  handle401Error, 
  saveTokens,
  clearTokens 
} from '@/utils/tokenRefreshManager'

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

// 设置请求头的工具函数
function setAuthHeader(config: AxiosRequestConfig | any, token?: string) {
  const accessToken = token || localStorage.getItem(LocalStorageKey.tokenKey)
  if (accessToken && config.headers) {
    config.headers['Authorization'] = `Bearer ${accessToken}`
  }
}

// 请求拦截器
authAxios.interceptors.request.use(
  async (config) => {
    // 在发送请求前，检查 token 是否即将过期，如果是则主动刷新
    const token = await refreshTokenIfNeeded()
    if (token) {
      setAuthHeader(config, token)
    } else {
      // 如果刷新失败或没有 token，仍然尝试使用现有的 token
      setAuthHeader(config)
    }
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
      // 如果没有config（请求配置丢失），直接拒绝
      if (!config) {
        console.error('Token refresh failed: config is missing', error)
        return Promise.reject(error)
      }
      
      try {
        // 使用共享的 token 刷新管理器处理 401 错误
        const newToken = await handle401Error(config)
        
        if (newToken) {
          // 更新请求头并重试原请求
          const retryConfig = {
            ...config,
            headers: {
              ...config.headers,
              'Authorization': `Bearer ${newToken}`
            }
          }
          return authAxios(retryConfig)
        } else {
          // 刷新失败，已跳转登录，直接拒绝
          return Promise.reject(error)
        }
      } catch (refreshError: any) {
        // 刷新token失败，已跳转登录
        return Promise.reject(refreshError)
      }
    }
    
    // 处理其他HTTP错误
    if (response) {
      const { status, data } = response
      console.error('API request error:', {
        status,
        url: config?.url,
        message: data?.msg || data?.message || error.message
      })
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
    // 处理各种错误情况
    let errorMessage = '登录失败'
    
    if (error.response) {
      // HTTP错误响应（如500, 400等）
      const status = error.response.status
      const data = error.response.data
      
      if (data?.msg) {
        errorMessage = data.msg
      } else if (data?.message) {
        errorMessage = data.message
      } else if (status === 500) {
        errorMessage = '服务器内部错误，请稍后重试或联系管理员'
      } else if (status === 404) {
        errorMessage = '登录接口不存在，请检查API配置'
      } else if (status === 401) {
        errorMessage = '用户名或密码错误'
      } else if (status === 403) {
        errorMessage = '没有权限访问'
      } else {
        errorMessage = `请求失败 (${status})`
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '无法连接到服务器，请检查网络连接或确认后端服务是否运行'
    } else if (error.message) {
      // 其他错误
      errorMessage = error.message
    }
    
    console.error('Login API error:', {
      error,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data
    })
    
    throw new Error(errorMessage)
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
  const { refreshToken: refreshTokenFromManager } = await import('@/utils/tokenRefreshManager')
  const newToken = await refreshTokenFromManager()
  
  if (!newToken) {
    throw new Error('刷新token失败')
  }
  
  // 返回格式化的响应
  return {
    code: 0,
    data: {
      accessToken: newToken,
      refreshToken: localStorage.getItem(LocalStorageKey.refreshTokenKey) || '',
      expiresTime: localStorage.getItem(LocalStorageKey.expiresTimeKey) || ''
    }
  }
}

export default {
  login,
  register,
  getUserInfo,
  logout,
  refreshToken
}
