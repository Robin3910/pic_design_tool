/*
 * @Author: AI Assistant
 * @Date: 2025-10-29
 * @Description: 重绘任务相关 API
 */

import templateRequest from '@/utils/templateAxios'

// 旧版查询参数（保持兼容）
export type RedrawTaskQuery = {
  pageNo?: number
  pageSize?: number
  taskId?: string
  spuId?: string | number
  state?: number | ''
  type?: number | ''
}

// 新版查询参数（套图不合格重制任务分页接口）
export type TemuRedrawTaskPageQuery = {
  pageNo?: number
  pageSize?: number
  orderNo?: string
  shopId?: number
  categoryId?: string
  categoryName?: string
  reworkStatus?: number
  operator?: string
  sku?: string
  createTime?: [string, string] // 格式：["2024-01-01 00:00:00", "2024-12-31 23:59:59"]
}

// 旧版响应数据（保持兼容）
export type RedrawTaskItem = {
  id: number
  taskId?: string
  spuId?: number
  type?: number
  state?: number
  errorMsg?: string
  createTime?: string
  updateTime?: string
  // 图片 URL 列表（来自接口，逗号分隔字符串）
  setImageUrls?: string
  newSetImageUrls?: string | null
  // 高清图片 URL 列表（逗号分隔字符串）
  hdImages?: string
  // 定制图片 URL 列表（逗号分隔字符串）
  customImageUrls?: string
  // 需重制图片的序号（逗号分隔，如1,3,5表示第1、3、5张）
  needRedrawIndex?: string
  // 定制文字列表（JSON字符串或数组）
  custom_text_list?: string | string[]
}

// 新版响应数据（套图不合格重制任务）
export type TemuRedrawTaskRespVO = {
  id: number
  orderId: number
  orderNo: string
  shopId: number
  categoryId: string
  categoryName: string
  setImageUrls: string // 原始套图URL列表（多个URL用英文逗号分隔）
  reason?: string // 不合格原因说明
  sku?: string // SKU编号
  reworkStatus: number // 重制状态：0-未开始，1-制图中，2-完成，3-失败
  newSetImageUrls?: string | null // 重新制图后的新套图URL（制图完成后填写）
  hdImages?: string // 高清定制图片URL（多个URL用英文逗号分隔）
  customImageUrls?: string // 定制图片列表URL（多个URL用英文逗号分隔）
  customTextList?: string // 定制文字列表（多个文本用英文逗号分隔）
  operator?: string // 操作人
  remark?: string // 备注
  needRedrawIndex?: string // 需重制图片的序号（逗号分隔，如1,3,5表示第1、3、5张）
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
  // 兼容旧版字段名（蛇形命名）
  custom_text_list?: string | string[]
  need_redraw_index?: string
}

export type PageResp<T> = {
  code: number
  data: {
    list: T[]
    total: number
    pageNo?: number
    pageSize?: number
  }
  msg?: string
}

// 旧版分页接口
export const getRedrawTaskPage = (params: RedrawTaskQuery) => {
  return templateRequest.get<PageResp<RedrawTaskItem>>('/temu/redraw-task/page', { params })
}

// 套图不合格重制任务分页接口（仅包含custom_text_list有数据）
export const getRedrawTaskPageWithCustomText = (params: TemuRedrawTaskPageQuery) => {
  return templateRequest.get<PageResp<TemuRedrawTaskRespVO>>('/temu/redraw-task/page-with-custom-text', { params })
}

export default {
  getRedrawTaskPage,
  getRedrawTaskPageWithCustomText,
}


