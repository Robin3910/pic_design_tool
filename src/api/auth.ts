/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 认证相关API接口
 */

import axios, { AxiosRequestConfig } from 'axios'
import app_config, { LocalStorageKey } from '@/config'
import { 
  getCurrentToken,
  handle401Error, 
  saveTokens,
  clearTokens 
} from '@/utils/tokenRefreshManager'

// 新后端API配置（从统一配置中获取）
const API_BASE_URL = app_config.API_BASE_URL

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

// 请求拦截器（只负责设置 token，不进行主动刷新）
authAxios.interceptors.request.use(
  (config) => {
    // 只设置当前的 token，不进行主动刷新
    // 如果 token 过期，后端会返回 401，由响应拦截器处理
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
    
    // 处理业务错误码
    if (response && response.data) {
      const code = response.data.code
      const msg = response.data.msg || response.data.message
      
      // 如果是401错误（未授权/Token过期）
      // 但是，如果是重试请求，不应该再次触发刷新（避免无限循环）
      if ((code === 401 || response.status === 401) && !config?._isRetryRequest) {
        // 如果没有config（请求配置丢失），直接拒绝
        if (!config) {
          console.error('Token refresh failed: config is missing', error)
          return Promise.reject(error)
        }
        
        try {
          // 使用共享的 token 刷新管理器处理 401 错误
          const { handle401Error } = await import('@/utils/tokenRefreshManager')
          return await handle401Error(config, authAxios)
        } catch (refreshError: any) {
          // 刷新token失败，已跳转登录
          return Promise.reject(refreshError)
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
      // 如果没有config（请求配置丢失），直接拒绝
      if (!config) {
        console.error('Token refresh failed: config is missing', error)
        return Promise.reject(error)
      }
      
      try {
        // 使用共享的 token 刷新管理器处理 401 错误
        const { handle401Error } = await import('@/utils/tokenRefreshManager')
        return await handle401Error(config, authAxios)
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

// ========== 用户信息相关类型定义 ==========

// 角色简单信息
export interface RoleSimpleRespVO {
  id: number
  name: string
}

// 部门简单信息
export interface DeptSimpleRespVO {
  id: number
  name: string
  parentId: number
}

// 岗位简单信息
export interface PostSimpleRespVO {
  id: number
  name: string
}

// 社交用户信息
export interface SocialUser {
  type: number
  openid: string
}

// 用户详细信息响应（接口一）
export interface UserProfileRespVO {
  id: number
  username: string
  nickname: string
  email?: string
  mobile?: string
  sex?: number
  avatar?: string
  loginIp: string
  loginDate: string
  createTime: string
  roles?: RoleSimpleRespVO[]
  dept?: DeptSimpleRespVO
  posts?: PostSimpleRespVO[]
  socialUsers?: SocialUser[]
}

// 用户VO（用于权限信息接口）
export interface UserVO {
  id: number
  nickname: string
  avatar?: string
  deptId?: number
}

// 菜单VO
export interface MenuVO {
  id: number
  parentId: number
  name: string
  path?: string
  component?: string
  componentName?: string
  icon?: string
  visible: boolean
  keepAlive: boolean
  alwaysShow: boolean
  children: MenuVO[]
}

// 用户权限信息响应（接口二）
export interface AuthPermissionInfoRespVO {
  user: UserVO
  roles: string[]
  permissions: string[]
  menus: MenuVO[]
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
      const tokenPayload = apiResponse.data as any
      const accessToken = tokenPayload.accessToken ?? tokenPayload.access_token
      const refreshToken = tokenPayload.refreshToken ?? tokenPayload.refresh_token
      const expiresTime = tokenPayload.expiresTime ?? tokenPayload.expires_time
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

// 获取用户信息（接口二：获取用户权限信息，包含用户基本信息、角色、权限标识、菜单树等）
// 适用于：登录后初始化用户权限和菜单
export const getUserInfo = async (): Promise<ApiResponse<AuthPermissionInfoRespVO>> => {
  try {
    const response = await authAxios.get('/system/auth/get-permission-info')
    return response as unknown as ApiResponse<AuthPermissionInfoRespVO>
  } catch (error: any) {
    throw new Error(error.response?.data?.msg || '获取用户信息失败')
  }
}

// 获取用户详细信息（接口一：获取用户详细信息，包含角色、部门、岗位、社交账号等）
// 适用于：用户个人中心页面展示用户详细信息
export const getUserProfile = async (): Promise<ApiResponse<UserProfileRespVO>> => {
  try {
    const response = await authAxios.get('/system/user/profile/get')
    return response as unknown as ApiResponse<UserProfileRespVO>
  } catch (error: any) {
    throw new Error(error.response?.data?.msg || '获取用户详细信息失败')
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
  const tokenData = await refreshTokenFromManager()
  
  if (!tokenData) {
    throw new Error('刷新token失败')
  }
  
  // 保存token
  const accessToken = tokenData.accessToken ?? (tokenData as any).access_token
  const refreshToken = tokenData.refreshToken ?? (tokenData as any).refresh_token
  const expiresTime = tokenData.expiresTime ?? (tokenData as any).expires_time
  if (!accessToken) {
    throw new Error('刷新token失败：accessToken为空')
  }
  saveTokens(accessToken, refreshToken || '', expiresTime)
  
  // 返回格式化的响应
  return {
    code: 0,
    data: {
      accessToken,
      refreshToken: refreshToken || '',
      expiresTime: expiresTime || ''
    }
  }
}

export default {
  login,
  register,
  getUserInfo,
  getUserProfile,
  logout,
  refreshToken
}
