/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: Temu相关API接口
 */

import { OssApi } from './temu/oss'

/**
 * 上传图片到阿里云OSS
 * 使用新后端服务(端口48080)
 * @param file 图片文件
 * @param onUploadProgress 上传进度回调 (可选，后端代理上传无法获取真实进度)
 * @param fileName 自定义文件名（可选，不包含扩展名）
 * @returns Promise<string> 返回图片访问URL
 */
export const uploadToOSS = async (
  file: File,
  onUploadProgress?: (progress: number) => void,
  fileName?: string
): Promise<string> => {
  // 使用新的 OSS API
  // 注意：后端代理上传无法获取真实进度，如果提供了 onUploadProgress，可以模拟进度
  if (onUploadProgress) {
    // 模拟上传进度（可选实现）
    onUploadProgress(10)
    setTimeout(() => onUploadProgress(50), 100)
    setTimeout(() => onUploadProgress(90), 200)
  }
  
  try {
    const url = await OssApi.uploadFile(file, fileName)
    if (onUploadProgress) {
      onUploadProgress(100)
    }
    return url
  } catch (error) {
    throw error
  }
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

// 导出 OSS API
export { OssApi } from './temu/oss'

export default {
  uploadToOSS,
  OssApi
}

