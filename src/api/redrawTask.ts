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
  reworkStatus?: number | number[] // 支持单个状态或多个状态数组
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
  finishedIndex?: string // 已完成制图的序号（逗号分隔，如1,2,4表示第1、2、4张已完成）
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
  effectiveImgUrl?: string // 合成预览图
  // 兼容旧版字段名（蛇形命名）
  custom_text_list?: string | string[]
  need_redraw_index?: string
  effective_img_url?: string // 合成预览图（蛇形命名兼容）
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

// API响应类型
export type ApiResponse<T = any> = {
  code: number
  data: T
  msg?: string
}

// 更新套图不合格重制任务请求参数
export type TemuRedrawTaskSaveReqVO = {
  id: number // 必填：主键ID（用于标识要更新的记录）
  orderId: number // 必填：原订单ID，对应 temu_order.id
  orderNo: string // 必填：订单编号
  shopId?: number // 可选：店铺ID
  categoryId?: string // 可选：类目ID
  categoryName?: string // 可选：类目名称
  setImageUrls?: string // 可选：原始套图URL列表（多个URL用英文逗号分隔）
  reason?: string // 可选：不合格原因说明
  sku?: string // 可选：SKU编号
  reworkStatus?: number // 可选：重制状态：0-未开始，1-制图中，2-完成，3-失败
  newSetImageUrls?: string // 可选：重新制图后的新套图URL（制图完成后填写，多个URL用英文逗号分隔）
  hdImages?: string // 可选：高清定制图片URL（多个URL用英文逗号分隔）
  customImageUrls?: string // 可选：定制图片列表URL（多个URL用英文逗号分隔）
  customTextList?: string // 可选：定制文字列表（多个文本用英文逗号分隔）
  operator?: string // 可选：操作人
  remark?: string // 可选：备注
  needRedrawIndex?: string // 可选：需重制图片的序号（逗号分隔，如1,3,5表示第1、3、5张）
  finishedIndex?: string // 可选：已完成制图的序号（逗号分隔，如1,2,4表示第1、2、4张已完成）
  effectiveImgUrl?: string // 可选：合成预览图
}

// 旧版分页接口
export const getRedrawTaskPage = (params: RedrawTaskQuery) => {
  return templateRequest.get<PageResp<RedrawTaskItem>>('/temu/redraw-task/page', { params })
}

// 套图不合格重制任务分页接口（仅包含custom_text_list有数据）
export const getRedrawTaskPageWithCustomText = (params: TemuRedrawTaskPageQuery) => {
  return templateRequest.get<PageResp<TemuRedrawTaskRespVO>>('/temu/redraw-task/page-with-custom-text', { params })
}

// 套图不合格重制任务分页接口（仅包含need_redraw_index有数据的记录）
export const getRedrawTaskPageWithNeedRedrawIndex = (params: TemuRedrawTaskPageQuery) => {
  return templateRequest.get<PageResp<TemuRedrawTaskRespVO>>('/temu/redraw-task/page-with-need-redraw-index', { params })
}

/**
 * 根据ID查询单个任务记录
 * @param id 任务记录ID
 * @returns Promise<TemuRedrawTaskRespVO | null> 任务记录详情
 */
export const getRedrawTaskById = async (id: number): Promise<TemuRedrawTaskRespVO | null> => {
  try {
    // 使用分页接口查询，增加pageSize以确保能找到目标记录
    // 如果数据量很大，可以考虑使用ID作为查询条件（如果后端支持）
    let pageNo = 1
    const pageSize = 100
    let found = false
    let task: TemuRedrawTaskRespVO | null = null
    
    // 最多查询10页，避免无限循环
    while (!found && pageNo <= 10) {
      const res = await templateRequest.get<PageResp<TemuRedrawTaskRespVO>>('/temu/redraw-task/page-with-custom-text', {
        params: { pageNo, pageSize }
      })
      const list = res.data?.list || []
      
      // 从列表中查找匹配的ID
      task = list.find((item: TemuRedrawTaskRespVO) => item.id === id) || null
      
      if (task) {
        found = true
        break
      }
      
      // 如果当前页数据少于pageSize，说明已经到最后一页了
      if (list.length < pageSize) {
        break
      }
      
      pageNo++
    }
    
    if (!task) {
      console.warn(`未找到ID为 ${id} 的任务记录`)
    }
    
    return task
  } catch (error) {
    console.error(`查询任务记录失败 (ID: ${id}):`, error)
    return null
  }
}

/**
 * 更新套图不合格重制任务接口
 * @param data 更新请求参数（id、orderId、orderNo为必填字段）
 * @returns Promise<ApiResponse<boolean>> 更新结果
 */
export const updateRedrawTask = (data: TemuRedrawTaskSaveReqVO) => {
  return templateRequest.put<ApiResponse<boolean>>('/temu/redraw-task/update', data)
}

/**
 * 将重制任务的新套图URL同步到订单
 * @param ids 重制任务ID列表
 * @returns Promise<ApiResponse<number>> 返回成功处理的任务数量
 */
export const syncNewImagesToOrder = (ids: number[]) => {
  // 将ID数组转换为JSON数组字符串格式，例如 "[1,2,3]"
  const idsParam = JSON.stringify(ids)
  // 直接在URL中拼接参数，与测试文件保持一致
  const url = `/temu/redraw-task/sync-new-images-to-order?ids=${encodeURIComponent(idsParam)}`
  return templateRequest.put<ApiResponse<number>>(url, null)
}

export default {
  getRedrawTaskPage,
  getRedrawTaskPageWithCustomText,
  getRedrawTaskPageWithNeedRedrawIndex,
  getRedrawTaskById,
  updateRedrawTask,
  syncNewImagesToOrder,
}


