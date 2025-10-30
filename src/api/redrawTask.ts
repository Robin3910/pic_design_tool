/*
 * @Author: AI Assistant
 * @Date: 2025-10-29
 * @Description: 重绘任务相关 API
 */

import templateRequest from '@/utils/templateAxios'

export type RedrawTaskQuery = {
  pageNo?: number
  pageSize?: number
  taskId?: string
  spuId?: string | number
  state?: number | ''
  type?: number | ''
}

export type RedrawTaskItem = {
  id: number
  taskId: string
  spuId: number
  type: number
  state: number
  errorMsg?: string
  createTime?: string
  updateTime?: string
  // 图片 URL 列表（来自接口，逗号分隔字符串）
  setImageUrls?: string
  newSetImageUrls?: string | null
  // 高清图片 URL 列表（逗号分隔字符串）
  hdImages?: string
}

export type PageResp<T> = {
  code: number
  data: {
    list: T[]
    total: number
  }
  msg?: string
}

export const getRedrawTaskPage = (params: RedrawTaskQuery) => {
  return templateRequest.get<PageResp<RedrawTaskItem>>('/temu/redraw-task/page', { params })
}

export default {
  getRedrawTaskPage,
}


