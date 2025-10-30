/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 认证相关API接口
 */

import axios from 'axios'

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

// 请求拦截器
authAxios.interceptors.request.use(
  (config) => {
    // 可以在这里添加token
    const token = localStorage.getItem('xp_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
  (error) => {
    if (error.response?.status === 401) {
      // token过期，清除本地存储
      localStorage.removeItem('xp_token')
      // 可以跳转到登录页
      window.location.href = '/login'
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
    return response as unknown as ApiResponse
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
    localStorage.removeItem('xp_token')
    return { code: 0, data: null }
  } catch (error: any) {
    // 即使登出失败，也清除本地token
    localStorage.removeItem('xp_token')
    throw new Error(error.response?.data?.msg || '登出失败')
  }
}

// 刷新token
export const refreshToken = async (): Promise<ApiResponse> => {
  try {
    const response = await authAxios.post('/system/auth/refresh-token')
    const apiResponse = response as unknown as ApiResponse
    if (apiResponse.code === 0 && apiResponse.data.accessToken) {
      localStorage.setItem('xp_token', apiResponse.data.accessToken)
    }
    return apiResponse
  } catch (error: any) {
    localStorage.removeItem('xp_token')
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
