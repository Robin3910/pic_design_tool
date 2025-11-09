/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 认证状态管理 (Pinia)
 */

import { defineStore } from 'pinia'
import { login, logout, getUserInfo, getUserProfile, refreshToken } from '@/api/auth'
import type { UserVO, AuthPermissionInfoRespVO, UserProfileRespVO } from '@/api/auth'
import { LocalStorageKey } from '@/config'
import { startAutoRefresh, stopAutoRefresh } from '@/utils/tokenRefreshManager'

export interface User {
  id: number | string
  username?: string
  nickname?: string
  email?: string
  mobile?: string
  avatar?: string
  deptId?: number
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  loading: boolean
  roles: string[]
  permissions: string[]
  menus: any[]
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem(LocalStorageKey.tokenKey),
    loading: false,
    roles: [],
    permissions: [],
    menus: []
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
          // token已在login函数中保存（包括refreshToken和expiresTime）
          localStorage.setItem(LocalStorageKey.tokenKey, response.data.accessToken)
          if (response.data.refreshToken) {
            localStorage.setItem(LocalStorageKey.refreshTokenKey, response.data.refreshToken)
          }
          if (response.data.expiresTime) {
            localStorage.setItem(LocalStorageKey.expiresTimeKey, response.data.expiresTime)
          }
          
          // 登录成功后，获取用户权限信息（包含用户信息、角色、权限、菜单）
          await this.fetchUserInfo()
          // 获取用户详细信息（包含头像）
          await this.fetchUserProfile()
          
          // 启动Token主动刷新机制
          startAutoRefresh()
          
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
        // 停止Token主动刷新机制
        stopAutoRefresh()
        await logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuth()
        this.loading = false
      }
    },
    
    // 获取用户权限信息（接口二：登录后初始化使用）
    // 注意：头像只从 getUserProfile() 接口获取，不从此接口获取
    async fetchUserInfo() {
      if (!this.token) return
      
      this.loading = true
      try {
        const response = await getUserInfo()
        if (response.code === 0 && response.data) {
          const { user, roles, permissions, menus } = response.data
          // 转换 UserVO 为 User 格式（不包含 avatar，头像只从 getUserProfile 获取）
          this.user = {
            id: user.id,
            nickname: user.nickname,
            deptId: user.deptId
          }
          this.roles = roles || []
          this.permissions = permissions || []
          this.menus = menus || []
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
    
    // 获取用户详细信息（接口一：个人中心页面使用）
    // 注意：头像只从此接口获取，不从 getUserInfo() 接口获取
    async fetchUserProfile(): Promise<UserProfileRespVO | null> {
      if (!this.token) return null
      
      this.loading = true
      try {
        const response = await getUserProfile()
        if (response.code === 0 && response.data) {
          const profile = response.data
          // 更新用户信息，补充详细信息（头像只从此接口获取）
          this.user = {
            id: profile.id,
            username: profile.username,
            nickname: profile.nickname,
            email: profile.email,
            mobile: profile.mobile,
            avatar: profile.avatar, // 头像只从 GET /system/user/profile/get 获取
            deptId: profile.dept?.id
          }
          return profile
        } else {
          throw new Error(response.msg || '获取用户详细信息失败')
        }
      } catch (error) {
        console.error('Fetch user profile error:', error)
        // 如果获取用户详细信息失败，不影响认证状态，只记录错误
        // 这样即使头像获取失败，用户仍然可以正常使用系统
        return null
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
    
    async initializeAuth() {
      const token = localStorage.getItem(LocalStorageKey.tokenKey)
      if (token) {
        this.token = token
        await this.fetchUserInfo()
        // 获取用户详细信息（包含头像）
        await this.fetchUserProfile()
        // 如果已登录，启动Token主动刷新机制
        if (this.isAuthenticated) {
          startAutoRefresh()
        }
      }
    },
    
    clearAuth() {
      // 停止Token主动刷新机制
      stopAutoRefresh()
      this.isAuthenticated = false
      this.user = null
      this.token = null
      this.roles = []
      this.permissions = []
      this.menus = []
      localStorage.removeItem(LocalStorageKey.tokenKey)
      localStorage.removeItem(LocalStorageKey.refreshTokenKey)
      localStorage.removeItem(LocalStorageKey.expiresTimeKey)
    }
  }
})

export default useAuthStore