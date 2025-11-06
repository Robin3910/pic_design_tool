/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: OSS文件上传API接口
 */

import { templateRequest } from '@/utils/templateAxios'
import type { AxiosRequestConfig } from 'axios'

// API响应格式
interface ApiResponse<T = any> {
  code: number
  data: T
  msg?: string
}

/**
 * OSS API
 */
export const OssApi = {
  /**
   * 上传文件到OSS（支持自定义文件名）
   * @param file 要上传的文件对象
   * @param fileName 自定义文件名（可选，不包含扩展名。如果不提供，将从文件对象中提取文件名并去掉扩展名）
   * @returns 返回文件访问URL字符串
   */
  uploadFile: async (file: File, fileName?: string): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    // 处理文件名：如果未提供，从文件对象中提取并去掉扩展名
    let finalFileName = fileName
    if (!finalFileName) {
      const originalName = file.name || 'upload'
      // 去掉扩展名
      const lastDotIndex = originalName.lastIndexOf('.')
      finalFileName = lastDotIndex > 0 
        ? originalName.substring(0, lastDotIndex) 
        : originalName || `upload-${Date.now()}`
    }
    
    formData.append('fileName', finalFileName)
    
    // 请求配置：使用 multipart/form-data，增加超时时间到 60 秒（文件上传需要更长时间）
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60秒超时，适合大文件上传
    }
    
    try {
      // 调用新接口，支持自定义文件名
      // templateRequest 会自动处理认证token和tenant-id
      // 注意：templateRequest.post 返回的是 res.data，而 templateAxios 拦截器已经处理了业务状态码
      // 所以这里 response 应该是 { code: 0, data: string } 格式
      const response = await templateRequest.post<ApiResponse<string>>('/temu/oss/upload-with-name', formData, config)
      
      // 处理响应格式：根据 templateAxios 的响应拦截器，成功时返回的是 response.data
      // 所以这里的 response 实际上是 { code: 0, data: string } 格式
      if (response && typeof response === 'object' && 'data' in response) {
        // 返回对象格式 { code: 0, data: string }
        if (response.code === 0 && response.data) {
          return response.data
        } else {
          throw new Error(response.msg || '上传失败')
        }
      } else if (typeof response === 'string') {
        // 如果后端直接返回字符串URL（虽然不太可能，但为了兼容性保留）
        return response
      } else {
        throw new Error('响应格式错误')
      }
    } catch (error: any) {
      // 处理错误响应
      console.error('OSS上传失败:', error)
      
      // 如果错误已经有消息，直接抛出
      if (error.message) {
        throw error
      }
      
      // 处理HTTP错误响应
      if (error.response && error.response.data) {
        const errorData = error.response.data
        if (errorData.msg) {
          throw new Error(errorData.msg)
        }
      }
      
      // 处理网络错误或其他错误
      if (error.message === 'Network Error') {
        throw new Error('网络错误，请检查网络连接')
      }
      
      throw new Error('上传失败，请稍后重试')
    }
  }
}

// 导出默认对象
export default OssApi

