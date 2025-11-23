/*
 * @Author: ShawnPhang
 * @Date: 2021-07-30 17:38:50
 * @Description:
 * @LastEditors: ShawnPhang, Jeremy Yu <https://github.com/JeremyYu-cn>
 * @Date: 2024-03-04 18:50:00
 */

export type TMenuItemData = {
  left: number
  top: number
  list: TWidgetItemData[]
}

export const menuList: TMenuItemData = {
  left: 0,
  top: 0,
  list: [],
}

export type TWidgetItemData = {
  type:
    | 'copy'
    | 'paste'
    | 'rotate-left'
    | 'rotate-right'
    | 'index-up'
    | 'index-down'
    | 'index-top'
    | 'del'
    | 'ungroup'
    | 'color-text'
  text: string
}

export const widgetMenu: TWidgetItemData[] = [
  {
    type: 'copy',
    text: '复制',
  },
  {
    type: 'paste',
    text: '粘贴',
  },
  {
    type: 'rotate-left',
    text: '向左旋转90度',
  },
  {
    type: 'rotate-right',
    text: '向右旋转90度',
  },
  {
    type: 'index-up',
    text: '上移一层',
  },
  {
    type: 'index-down',
    text: '下移一层',
  },
  {
    type: 'index-top',
    text: '置顶',
  },
  {
    type: 'del',
    text: '删除',
  },
]

export const pageMenu: TWidgetItemData[] = [
  {
    type: 'paste',
    text: '粘贴',
  },
]
