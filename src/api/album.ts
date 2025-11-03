/*
 * @Author: ShawnPhang
 * @Date: 2021-08-26 12:47:40
 * @Description: 相册 api 接口
 * @LastEditors: ShawnPhang
 * @LastEditTime: 2021-08-30 10:45:49
 */
import fetch from '@/utils/axios'
import _config from '@/config'
// 主后端服务已移除
const prefix = '' // _config.API_URL + '/'
const API = {
  init: prefix + 'pic/init',
  getList: prefix + 'pic/list',
  getToken: prefix + 'pic/getToken',
  delOne: prefix + 'pic/delOne',
  rename: prefix + 'pic/rename',
  del: prefix + 'pic/del',
}

// 主后端服务已移除
export const init = (params: Type.Object = {}) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch(API.init, params, 'post')
}

// 主后端服务已移除
export const getPicList = (params: Type.Object = {}) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch(API.getList, params)
}

type TGetTokenParam = {
  bucket: string,
  name: string
}

// 主后端服务已移除
export const getToken = (params: TGetTokenParam) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch<string>(API.getToken, params)
}

// 主后端服务已移除
export const deletePic = (params: Type.Object = {}) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch(API.delOne, params, 'post')
}

// 主后端服务已移除
export const delPics = (params: Type.Object = {}) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch(API.del, params, 'post')
}

// 主后端服务已移除
export const reName = (params: Type.Object = {}) => {
  throw new Error('主后端服务(端口7001)已移除，请使用新后端服务(端口48080)')
  // return fetch(API.rename, params, 'post')
}

export default {
  init,
  getPicList,
  getToken,
  deletePic,
  delPics,
  reName,
}
