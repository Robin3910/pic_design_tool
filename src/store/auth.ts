/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 认证状态管理 (Pinia)
 */

import { defineStore } from 'pinia'
import { login, logout, getUserInfo, refreshToken } from '@/api/auth'
import { LocalStorageKey } from '@/config'

export interface User {
  id: string
  username: string
  email?: string
  avatar?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  loading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem(LocalStorageKey.tokenKey),
    loading: false
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token && state.isAuthenticated,
    currentUser: (state) => state.user,
    isLoading: (state) => state.loading
  },
  
  actions: {
    async loginAction(username: string, password: string) {
      this.loading = true
      try {
        const response = await login(username, password)
        if (response.code === 0) {
          this.token = response.data.accessToken
          this.isAuthenticated = true
          this.user = response.data.user
          // token已在login函数中保存（包括refreshToken和expiresTime）
          localStorage.setItem(LocalStorageKey.tokenKey, response.data.accessToken)
          if (response.data.refreshToken) {
            localStorage.setItem(LocalStorageKey.refreshTokenKey, response.data.refreshToken)
          }
          if (response.data.expiresTime) {
            localStorage.setItem(LocalStorageKey.expiresTimeKey, response.data.expiresTime)
          }
          return { success: true }
        } else {
          throw new Error(response.msg || '登录失败')
        }
      } catch (error: any) {
        this.clearAuth()
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async logoutAction() {
      this.loading = true
      try {
        await logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuth()
        this.loading = false
      }
    },
    
    async fetchUserInfo() {
      if (!this.token) return
      
      this.loading = true
      try {
        const response = await getUserInfo()
        if (response.code === 0) {
          this.user = response.data.user
          this.isAuthenticated = true
        } else {
          this.clearAuth()
        }
      } catch (error) {
        console.error('Fetch user info error:', error)
        this.clearAuth()
      } finally {
        this.loading = false
      }
    },
    
    async refreshTokenAction() {
      const refreshTokenValue = localStorage.getItem(LocalStorageKey.refreshTokenKey)
      if (!refreshTokenValue) {
        this.clearAuth()
        return false
      }
      
      try {
        const response = await refreshToken()
        if (response.code === 0) {
          this.token = response.data.accessToken
          // token已在refreshToken函数中保存（包括refreshToken和expiresTime）
          localStorage.setItem(LocalStorageKey.tokenKey, response.data.accessToken)
          if (response.data.refreshToken) {
            localStorage.setItem(LocalStorageKey.refreshTokenKey, response.data.refreshToken)
          }
          if (response.data.expiresTime) {
            localStorage.setItem(LocalStorageKey.expiresTimeKey, response.data.expiresTime)
          }
          return true
        } else {
          this.clearAuth()
          return false
        }
      } catch (error) {
        this.clearAuth()
        return false
      }
    },
    
    initializeAuth() {
      const token = localStorage.getItem(LocalStorageKey.tokenKey)
      if (token) {
        this.token = token
        this.fetchUserInfo()
      }
    },
    
    clearAuth() {
      this.isAuthenticated = false
      this.user = null
      this.token = null
      localStorage.removeItem(LocalStorageKey.tokenKey)
      localStorage.removeItem(LocalStorageKey.refreshTokenKey)
      localStorage.removeItem(LocalStorageKey.expiresTimeKey)
    }
  }
})

export default useAuthStore