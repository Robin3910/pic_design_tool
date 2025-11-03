/*
 * @Author: ShawnPhang <https://m.palxp.cn>
 * @Date: 2021-08-27 14:42:15
 * @Description: 媒体相关接口
 * @LastEditors: Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-09-25 00:39:00
 */
import fetch from '@/utils/axios'
import _config from '@/config'
import { IGetTempListData } from './home'

// 获取素材分类：主后端服务已移除
export const getKinds = (params: Type.Object = {}) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch('design/cate', params)
}

type TGetListParam = {
  first_id?: number
  second_id?: string
  cate?: string | number
  pageSize?: number
}

export type TGetListData = {
  category: number
  created_time: string
  height: number
  id: number
  model: string
  original: string
  state: number
  thumb: string
  title: string
  type: string
  updated_time: string
  url: string
  width: number
  thumbUrl: string
  imgUrl: string
}

export type TGetListResult = TPageRequestResult<TGetListData[]>

// 获取素材列表：主后端服务已移除
export const getList = (params: TGetListParam) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<TGetListResult>('design/material', params)
}

export type TGetFontParam = {
  pageSize?: number
}

/** 字体item数据 */
export type TGetFontItemData = {
  id: number
  alias: string
  oid: string
  value: string
  preview: string
  woff: string
  lang: string
}

// 获取字体：主后端服务已移除
export const getFonts = (params: TGetFontParam = {}) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<TPageRequestResult<TGetFontItemData[]>>('design/fonts', params)
}

type TGetFontSubParam = {
  font_id: string | number
  id: string | number
  content: string
}

type TGetFontSubExtra = {
  responseType?: string
}

export const getFontSub = (params: TGetFontSubParam, extra: TGetFontSubExtra = {}) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<Blob | string>('design/font_sub', params, 'get', {}, extra)
}

type TGetImageListParams = {
  page?: number
  pageSize?: number
  cate?: number
}

export type TGetImageListResult = {
  created_time: string
  height: number
  width: number
  url: string
  user_id: number
  id: string
  thumb?: string
} & Partial<IGetTempListData>

// 图库列表：主后端服务已移除
export const getImagesList = (params: TGetImageListParams) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<TPageRequestResult<TGetImageListResult[]>>('design/imgs', params, 'get')
}

type TMyPhotoParams = {
  
  page: number
  pageSize?: number
}

/** 获取我的资源管理返回 */
export type TMyPhotoResult = {
  created_time: string
  height: number
  id: number
  url: string
  user_id: number
  width: number
} & IGetTempListData

// 我的上传列表：主后端服务已移除
export const getMyPhoto = (params: TMyPhotoParams) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<TPageRequestResult<TMyPhotoResult[]>>('design/user/image', params)
}

type TDeleteMyPhotoParams = {
  id: string | number
  key: string
}

export const deleteMyPhoto = (params: TDeleteMyPhotoParams) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<void>('design/user/image/del', params, 'post')
}

type TDeleteMyWorksParams = {
  id: string | number
}

export const deleteMyWorks = (params: TDeleteMyWorksParams) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<void>('design/poster/del', params, 'post')
}

type TAddMyPhotoParam = {
  width: number
  height: number
  url: string
}

// 添加图片：主后端服务已移除
export const addMyPhoto = (params: TAddMyPhotoParam) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<void>('design/user/add_image', params)
}

// 上传接口：主后端服务已移除
export const upload = ({ file, folder = 'user' }: any, cb: Function) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // const formData = new FormData()
  // formData.append('file', file)
  // formData.append('folder', folder)
  // const extra = {
  //   responseType: 'application/json',
  //   onUploadProgress: (progress: any) => {
  //     cb(Math.floor((progress.loaded / progress.total) * 100), 0)
  //   },
  //   onDownloadProgress: (progress: any) => {
  //     cb(100, Math.floor((progress.loaded / progress.total) * 100))
  //   },
  // }
  // return fetch(`${_config.SCREEN_URL}/api/file/upload`, formData, 'post', {}, extra)
}