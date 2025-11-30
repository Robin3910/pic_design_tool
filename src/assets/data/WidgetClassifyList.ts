/*
 * @Author: ShawnPhang
 * @Date: 2021-07-17 11:20:22
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>, Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-03-01 20:55:51
 */

import { StyleValue } from "vue"

export type TWidgetClassifyData = {
  name: string
  icon: string
  show: boolean
  component: string
  style?: StyleValue
  iconComponent?: string
  iconImage?: string
}

export default [
  {
    name: '模板',
    icon: 'icon-moban',
    show: false,
    component: 'temp-list-wrap',
  },
  {
    name: '订单',
    icon: 'icon-dingdan',
    show: false,
    component: 'order-list-wrap',
    iconImage: `${import.meta.env.BASE_URL}订单.svg`,
  },
  {
    name: '图片',
    icon: 'icon-gallery',
    show: false,
    component: 'photo-list-wrap',
  },
  {
    name: '文字',
    icon: 'icon-wenzi',
    show: false,
    style: { fontWeight: 600 },
    component: 'text-list-wrap',
  },
  {
    name: '历史',
    icon: 'icon-refresh',
    show: false,
    component: 'replace-list-wrap',
    iconComponent: 'HistoryIcon',
  },
  // 注释掉素材管理相关功能 - 依赖后端服务
  // {
  //   name: '素材',
  //   icon: 'icon-sucai',
  //   show: false,
  //   component: 'graph-list-wrap',
  // },
  // {
  //   name: '组件',
  //   icon: 'icon-zujian',
  //   show: false,
  //   component: 'comp-list-wrap',
  // },
] as TWidgetClassifyData[]
