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
  let progressInterval: NodeJS.Timeout | null = null
  let isUploading = true
  
  if (onUploadProgress) {
    // 立即同步调用初始进度，确保进度条在上传开始前就显示
    // 这样可以避免上传速度太快时进度条还没显示的问题
    onUploadProgress(0)
    
    // 使用微任务确保进度更新在上传开始前就执行（至少到10%）
    // 这样可以避免上传速度太快时进度回调还没执行的问题
    await Promise.resolve()
    onUploadProgress(10)
    
    // 异步更新进度，不等待完成，立即开始上传
    // 这样可以避免延迟上传，同时确保进度条能显示
    setTimeout(() => {
      if (isUploading) {
        onUploadProgress(50)
      }
    }, 50)
    
    setTimeout(() => {
      if (isUploading) {
        onUploadProgress(90)
      }
    }, 150)
    
    // 在上传过程中，定期更新进度，从90%逐渐增加到99%
    // 这样可以避免进度卡在90%的问题
    let currentProgress = 90
    progressInterval = setInterval(() => {
      if (isUploading && currentProgress < 99) {
        // 每次增加1-2%，但不超过99%
        currentProgress = Math.min(99, currentProgress + Math.random() * 1.5 + 0.5)
        onUploadProgress(Math.floor(currentProgress))
      }
    }, 500) // 每500ms更新一次
  }
  
  try {
    // 等待上传完成
    const url = await OssApi.uploadFile(file, fileName)
    
    // 上传完成，停止进度更新
    isUploading = false
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
    
    // 确保上传完成后一定调用100%回调
    if (onUploadProgress) {
      // 先立即调用一次，确保进度更新
      onUploadProgress(100)
      // 再使用 setTimeout 确保进度条有时间更新（双重保险）
      setTimeout(() => {
        onUploadProgress(100)
      }, 50)
    }
    return url
  } catch (error) {
    // 上传失败，停止进度更新
    isUploading = false
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
    // 即使出错，也确保进度回调被调用（可选）
    // 这里不调用，让调用方处理错误情况
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

