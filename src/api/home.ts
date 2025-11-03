/*
 * @Author: ShawnPhang
 * @Date: 2021-08-19 18:43:22
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-16 15:37:54
 */
import fetch from '@/utils/axios'
import _config from '@/config'

function serialize(obj: any) {
  return Object.keys(obj).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`).join('&');
}

// const screenshot_url = window.location.protocol + '//' + window.location.host + '/draw'
// 主后端服务已移除
export const download = (params: Type.Object = {}) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return `${_config.SCREEN_URL}/api/screenshots?${serialize(params)}`
}

type IGetTempListParam = {
  search: string
  page: number
  pageSize: number
  cate: number | string
}
export type IGetTempListData = {
  cover: string
  height: number
  id: number
  state: number
  title: string
  width: number
  isDelect: boolean
  fail: boolean
  top: number
  left: number
  data?: string
  listWidth?: number
  gap?: number
  thumb?: string
  url: string
  model?: string
  color?: string
}
type IGetTempListResult = TPageRequestResult<IGetTempListData[]>

// 获取模板列表：主后端服务已移除（请使用 src/api/template.ts）
export const getTempList = (params: IGetTempListParam) => {
  throw new Error('主后端服务(端口7001)已移除，请使用 src/api/template.ts 中的模板API')
  // return fetch<IGetTempListResult>('design/list', params, 'get')
}

export type TGetTempDetail = {
  id: number
  type?: number
}

export type TTempDetail = {
  /** 分类 */
  category: number
  /** 封面 */
  cover: string
  /** 创建时间 */
  created_time: string
  /** Template内容 */
  data: string
  /** 高度 */
  height: number
  id: number
  /** 来源 */
  original: string
  resource: string
  state: string
  tag: string | null
  title: string
  updated_time: string
  width: number
}

// 主后端服务已移除（请使用 src/api/template.ts）
export const getTempDetail = (params: TGetTempDetail) => {
  throw new Error('主后端服务(端口7001)已移除，请使用 src/api/template.ts 中的模板API')
  // return fetch<TTempDetail>('design/temp', params, 'get')
}

type TGetCategoriesParams = {
  type?: number
}
export type TGetCategoriesData = {
  id: number
  name: string
  pid: number
  type: number
}
type TgetCategoriesResult = TCommResResult<TGetCategoriesData>

// 主后端服务已移除
export const getCategories = (params: TGetCategoriesParams) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<TgetCategoriesResult[]>('design/cate', params, 'get')
}


// 保存模板：主后端服务已移除
export const saveTemp = (params: Type.Object = {}) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch('design/edit', params, 'post')
}
// export const delTemp = (params: Type.Object = {}) => fetch('/api/template/temp_del', params)

type TGetCompListParam = {
  search?: string
  page?: number
  type?: number
  pageSize?: number
  cate?: number | string
}

/** 获取组件返回类型 */
export type TGetCompListResult = {
  cover: string
  height: number
  id: number
  state: number
  title: string
  width: number
  name?: string
  cate?: string
}

type getCompListReturn = TPageRequestResult<TGetCompListResult[]>

// 组件相关接口：主后端服务已移除
export const getCompList = (params: TGetCompListParam) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<getCompListReturn>('design/list', params, 'get')
}

type TRemoveComp = {
  id: string | number
}

export const removeComp = (params: TRemoveComp) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<void>('design/del', params, 'post')
}
// export const getCompDetail = (params: Type.Object = {}) => fetch('/api/template/temp_info', params, 'get')

type TSaveWorksParams = {
  title: string
  temp_id?: string
  width: number
  height: number
  data: string
  cover?: string
  id?: string | number
}

export type TSaveWorksResult = {
  id: number | string,
  stat?: number,
  msg: string
}

// 保存作品：主后端服务已移除
export const saveWorks = (params: TSaveWorksParams) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<TSaveWorksResult>('design/save', params, 'post')
}

// 保存个人模板：主后端服务已移除
export const saveMyTemp = (params: Type.Object = {}) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch('design/user/temp', params, 'post')
}

// 获取作品：主后端服务已移除
export const getWorks = (params: TGetTempDetail) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<TTempDetail>('design/poster', params, 'get')
}

type TGetMyDesignParams = {
  page: number
  pageSize: number
}

type TGetMyDesignResult = TPageRequestResult<IGetTempListData[]>

// 作品列表：主后端服务已移除
export const getMyDesign = (params: TGetMyDesignParams) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<TGetMyDesignResult>('design/my', params, 'get')
}
