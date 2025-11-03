/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: Temu相关API接口
 */

import fetch from '@/utils/axios'

/**
 * 上传图片到阿里云OSS
 * 主后端服务已移除
 * @param file 图片文件
 * @param onUploadProgress 上传进度回调 (可选)
 * @returns Promise<string> 返回图片访问URL
 */
export const uploadToOSS = async (
  file: File,
  onUploadProgress?: (progress: number) => void
): Promise<string> => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // const formData = new FormData()
  // formData.append('file', file)

  // const extra: any = {
  //   responseType: 'application/json',
  // }

  // // 添加上传进度监听
  // if (onUploadProgress) {
  //   extra.onUploadProgress = (progressEvent: any) => {
  //     if (progressEvent.total) {
  //       const progress = Math.floor((progressEvent.loaded / progressEvent.total) * 100)
  //       onUploadProgress(progress)
  //     }
  //   }
  // }

  // try {
  //   const response = await fetch<{
  //     code: number
  //     data: string
  //     msg?: string
  //   }>('/temu/oss/upload', formData, 'post', {
  //     'Content-Type': 'multipart/form-data'
  //   }, extra)

  //   // 检查业务错误码
  //   if (response.code === 0 && response.data) {
  //     return response.data
  //   } else {
  //     throw new Error(response.msg || '上传失败')
  //   }
  // } catch (error: any) {
  //   // 处理错误响应
  //   if (error.response && error.response.data) {
  //     const errorData = error.response.data
  //     if (errorData.code === 400) {
  //       throw new Error(errorData.msg || '上传失败')
  //     }
  //   }
  //   throw error
  // }
}

export default {
  uploadToOSS
}

