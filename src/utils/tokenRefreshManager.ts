/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: Token 刷新管理器 - 统一管理所有 axios 实例的 token 刷新逻辑
 */

import axios from 'axios'
import { LocalStorageKey } from '@/config'
import { useAuthStore } from '@/store'

// API基础配置
const API_BASE_URL = 'http://localhost:48080/admin-api'

// Token刷新相关状态（全局共享）
let isRefreshing = false
let requests: Array<(token: string) => void> = []
let refreshPromise: Promise<string> | null = null

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

// 检查 token 是否即将过期（提前 5 分钟刷新）
export function isTokenExpiringSoon(): boolean {
  const expiresTime = localStorage.getItem(LocalStorageKey.expiresTimeKey)
  if (!expiresTime) {
    return false
  }

  const expiresTimestamp = parseExpiresTime(expiresTime)
  if (expiresTimestamp === null) {
    return false
  }

  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000 // 5分钟（毫秒）
  
  // 如果过期时间减去当前时间小于 5 分钟，则认为即将过期
  return (expiresTimestamp - now) < fiveMinutes
}

// 检查 token 是否已过期
export function isTokenExpired(): boolean {
  const expiresTime = localStorage.getItem(LocalStorageKey.expiresTimeKey)
  if (!expiresTime) {
    return true
  }

  const expiresTimestamp = parseExpiresTime(expiresTime)
  if (expiresTimestamp === null) {
    return true
  }

  const now = Date.now()
  return now >= expiresTimestamp
}

// 主动刷新 token（在 token 即将过期前）
export async function refreshTokenIfNeeded(): Promise<string | null> {
  const accessToken = localStorage.getItem(LocalStorageKey.tokenKey)
  
  // 如果没有 token，直接返回 null
  if (!accessToken) {
    return null
  }

  // 如果 token 即将过期或已过期，则刷新
  if (isTokenExpiringSoon() || isTokenExpired()) {
    console.log('Token is expiring soon or expired, refreshing...')
    return await refreshToken()
  }

  return accessToken
}

// 刷新 token（核心逻辑）
export async function refreshToken(): Promise<string | null> {
  // 如果正在刷新，返回已有的刷新 Promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  // 开始刷新
  isRefreshing = true
  const refreshTokenValue = localStorage.getItem(LocalStorageKey.refreshTokenKey)

  if (!refreshTokenValue) {
    // 没有refreshToken，跳转登录
    clearTokens()
    isRefreshing = false
    refreshPromise = null
    redirectToLogin()
    return null
  }

  // 创建刷新 Promise
  refreshPromise = (async () => {
    try {
      // 调用刷新token接口（使用URL参数，匹配后端 @RequestParam）
      const refreshRes = await axios.post(
        `${API_BASE_URL}/system/auth/refresh-token`,
        null, // POST 请求体为空，参数通过 URL 传递
        {
          params: {
            refreshToken: refreshTokenValue
          },
          headers: {
            'Content-Type': 'application/json',
            'tenant-id': '1'
          }
        }
      )

      if (refreshRes.data && refreshRes.data.code === 0) {
        // 保存新的token
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresTime } = refreshRes.data.data
        if (!newAccessToken) {
          throw new Error('刷新token返回的accessToken为空')
        }

        saveTokens(newAccessToken, newRefreshToken || refreshTokenValue, expiresTime)

        // 同步更新Store的token状态
        try {
          const authStore = useAuthStore()
          authStore.token = newAccessToken
        } catch (storeError) {
          // Store可能未初始化，忽略错误
          console.warn('Failed to update auth store token:', storeError)
        }

        // 执行队列中的请求
        requests.forEach(cb => cb(newAccessToken))
        requests = []

        return newAccessToken
      } else {
        // 刷新token失败（业务错误码）
        const errorMsg = refreshRes.data?.msg || refreshRes.data?.message || '刷新token失败'
        console.error('Token refresh failed:', errorMsg, refreshRes.data)
        throw new Error(errorMsg)
      }
    } catch (refreshError: any) {
      // 刷新token失败，跳转登录
      console.error('Token refresh error:', refreshError)
      clearTokens()

      // 执行队列中的请求（但会失败）
      requests.forEach(cb => cb(''))
      requests = []

      redirectToLogin()
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// 处理 401 错误并刷新 token
export async function handle401Error(config: any): Promise<string | null> {
  // 如果是刷新token的接口失败，直接跳转登录
  if (config?.url && (config.url.includes('/refresh-token') || config.url.endsWith('refresh-token'))) {
    clearTokens()
    redirectToLogin()
    return null
  }

  // 如果正在刷新token，将请求加入队列
  if (isRefreshing && refreshPromise) {
    return new Promise((resolve, reject) => {
      requests.push((token: string) => {
        if (!token) {
          reject(new Error('Token refresh failed'))
          return
        }
        resolve(token)
      })
    })
  }

  // 开始刷新token
  return await refreshToken()
}

// 导出工具函数
export { clearTokens, redirectToLogin, saveTokens }

