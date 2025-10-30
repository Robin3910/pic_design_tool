/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 新后端模板API请求工具 (48080端口)
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

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

// 请求拦截器
templateAxios.interceptors.request.use(
  (config) => {
    // 获取token
    const token = localStorage.getItem('xp_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
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
  (error) => {
    console.error('Template API Response Error:', error)
    
    // 处理HTTP错误
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
