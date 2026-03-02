/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: OSS文件上传API接口
 */

import { templateRequest } from '@/utils/templateAxios'
import { AxiosRequestConfig } from 'axios'

// API响应格式
interface ApiResponse<T = any> {
  code: number
  data: T
  msg?: string
}

// 通用分页结果
interface PageResult<T> {
  list: T[]
  total: number
}

// 字体资源对象（对应 TemuFontResourceDO）
export interface TemuFontResourceDO {
  id: number
  fontName: string
  ossUrl: string
  tenantId: number
  createTime: string
  updateTime: string
  creator: string
  updater: string
  deleted: boolean
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
  },

  /**
   * 上传字体文件到OSS
   * 对应接口：POST /temu/oss/upload-font
   * @param file 字体文件，支持 ttf、otf、woff、woff2 格式
   * @param fontName 自定义字体名称（可选，不含后缀），不传则使用原始文件名去掉扩展名
   * @returns 返回字体文件的 OSS URL 字符串
   */
  uploadFont: async (file: File, fontName?: string): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    // 处理字体名：如果未提供，从文件对象中提取并去掉扩展名
    let finalFontName = fontName
    if (!finalFontName) {
      const originalName = file.name || 'font'
      const lastDotIndex = originalName.lastIndexOf('.')
      finalFontName =
        lastDotIndex > 0
          ? originalName.substring(0, lastDotIndex)
          : originalName || `font-${Date.now()}`
    }
    formData.append('fontName', finalFontName)

    // 请求配置：multipart/form-data + 较长超时时间
    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    }

    try {
      console.log('开始上传字体:', { fontName: finalFontName, fileName: file.name, fileSize: file.size })

      // 使用 templateRequest，自动带上 token
      const response = await templateRequest.post<ApiResponse<string>>(
        '/temu/oss/upload-font',
        formData,
        config,
      )

      console.log('字体上传响应:', response)

      // templateRequest 返回的是完整的 AxiosResponse，响应数据在 response.data 中
      // 注意：即使 HTTP 状态码是 200，后端可能返回 { code: 401, msg: '账号未登录' }
      // 此时需要检查 response.data.code
      const respData = response.data

      // 先检查业务 code，确保不是 401 等错误码
      if (respData && typeof respData === 'object' && 'code' in respData) {
        if (respData.code !== 0) {
          // 业务 code 不为 0，抛出错误
          console.error('字体上传业务错误:', respData)
          throw new Error(respData.msg || '字体上传失败')
        }
      }

      // 业务 code 为 0，继续处理数据
      const data = respData

      // 兼容多种返回格式：
      // 1) { code: 0, data: 'url', msg: '成功' } - 标准格式
      // 2) 直接返回字符串 'url'
      // 3) { code: 0, data: { ossUrl: 'url', ... } }

      // 直接字符串
      if (typeof data === 'string' && data.startsWith('http')) {
        return data
      }

      // 对象格式
      if (data && typeof data === 'object') {
        // data 是字符串 URL
        if (typeof data === 'string') {
          return data
        }

        // data 是对象，提取 URL
        const url = (data as any).data
        if (typeof url === 'string' && url.startsWith('http')) {
          console.log('字体上传成功，URL:', url)
          return url
        }

        // data 是嵌套对象 { ossUrl: 'url' }
        if (typeof url === 'object') {
          const ossUrl = (url as any).ossUrl || (url as any).url
          if (ossUrl) {
            console.log('字体上传成功，URL:', ossUrl)
            return ossUrl
          }
        }
      }

      // 理论上 code === 0 就会直接返回，不会到这里
      // 如果真的走到这里，说明返回格式异常
      console.error('字体上传响应格式异常:', data)
      throw new Error('字体上传响应格式异常')
    } catch (error: any) {
      console.error('字体上传失败:', error)

      // 尽量把后端的 msg 暴露出来
      if (error.response && error.response.data) {
        console.error('响应状态:', error.response.status)
        console.error('响应数据:', error.response.data)
        const respMsg = error.response.data.msg || error.response.data.message
        if (respMsg) {
          throw new Error(respMsg)
        }
      }

      if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，请检查网络连接')
      }

      if (error.message === 'Network Error') {
        throw new Error('网络错误，请检查网络连接')
      }

      // 如果错误已经有消息，直接抛出
      if (error.message) {
        throw error
      }

      throw new Error('字体上传失败，请稍后重试')
    }
  },

  /**
   * 根据字体资源ID获取字体资源详情
   * 对应接口：GET /temu/oss/font/{id}
   */
  getFontResourceById: async (id: number): Promise<TemuFontResourceDO> => {
    try {
      const response = await templateRequest.get<ApiResponse<TemuFontResourceDO>>(
        `/temu/oss/font/${id}`,
      )

      if (response && typeof response === 'object' && 'data' in response) {
        if (response.code === 0 && response.data) {
          return response.data
        }
        throw new Error(response.msg || '获取字体资源失败')
      }

      throw new Error('响应格式错误')
    } catch (error: any) {
      console.error('获取字体资源失败:', error)
      if (error.message) {
        throw error
      }
      if (error.response && error.response.data && error.response.data.msg) {
        throw new Error(error.response.data.msg)
      }
      throw new Error('获取字体资源失败，请稍后重试')
    }
  },

  /**
   * 分页获取字体资源列表
   * 对应接口：GET /temu/oss/font/page
   */
  getFontResourcePage: async (params: { pageNo?: number; pageSize?: number } = {}): Promise<PageResult<TemuFontResourceDO>> => {
    try {
      const response = await templateRequest.get<ApiResponse<PageResult<TemuFontResourceDO>>>(
        '/temu/oss/font/page',
        { params },
      )

      if (response && typeof response === 'object' && 'data' in response) {
        if (response.code === 0 && response.data) {
          return response.data
        }
        throw new Error(response.msg || '获取字体资源列表失败')
      }

      throw new Error('响应格式错误')
    } catch (error: any) {
      console.error('获取字体资源列表失败:', error)
      if (error.message) {
        throw error
      }
      if (error.response && error.response.data && error.response.data.msg) {
        throw new Error(error.response.data.msg)
      }
      throw new Error('获取字体资源列表失败，请稍后重试')
    }
  },
}

// 导出默认对象
export default OssApi

