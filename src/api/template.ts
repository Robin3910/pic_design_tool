/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 新后端模板API接口 (48080端口)
 */

import { templateRequest } from '../utils/templateAxios'

// 模板数据类型定义
export interface Template {
  id: string
  title: string
  name: string
  width: number
  height: number
  state: number // 1: 启用, 0: 禁用
  createTime: string
  updateTime?: string
  cover?: string
  data?: string // JSON字符串格式的模板数据
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
}

// 分页查询参数
export interface TemplatePageParams {
  pageNo?: number
  pageSize?: number
  state?: number | string
}

// 分页查询结果
export interface TemplatePageResult {
  list: Template[]
  total: number
  pageNo: number
  pageSize: number
}

// API响应格式
export interface ApiResponse<T = any> {
  code: number
  data: T
  msg?: string
}

/**
 * 获取所有模板列表
 */
export const getTemplateList = async (): Promise<ApiResponse<Template[]>> => {
  return await templateRequest.get('/temu/auto-template/template/list')
}

/**
 * 分页查询模板
 */
export const getTemplatePage = async (params: TemplatePageParams): Promise<ApiResponse<TemplatePageResult>> => {
  const queryParams = new URLSearchParams()
  
  if (params.pageNo !== undefined) queryParams.append('pageNo', params.pageNo.toString())
  if (params.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString())
  if (params.state !== undefined && params.state !== '') queryParams.append('state', params.state.toString())
  
  const url = `/temu/auto-template/template/page${queryParams.toString() ? '?' + queryParams.toString() : ''}`
  return await templateRequest.get(url)
}

/**
 * 根据ID获取模板详情
 */
export const getTemplateById = async (id: string): Promise<ApiResponse<Template>> => {
  return await templateRequest.get(`/temu/auto-template/template/${id}`)
}

/**
 * 根据状态获取模板列表
 */
export const getTemplateByState = async (state: number): Promise<ApiResponse<Template[]>> => {
  return await templateRequest.get(`/temu/auto-template/template/list-by-state?state=${state}`)
}

/**
 * 获取启用的模板列表
 */
export const getEnabledTemplates = async (): Promise<ApiResponse<Template[]>> => {
  return await getTemplateByState(1)
}

/**
 * 获取禁用的模板列表
 */
export const getDisabledTemplates = async (): Promise<ApiResponse<Template[]>> => {
  return await getTemplateByState(0)
}

// 导出所有API函数
export default {
  getTemplateList,
  getTemplatePage,
  getTemplateById,
  getTemplateByState,
  getEnabledTemplates,
  getDisabledTemplates
}
