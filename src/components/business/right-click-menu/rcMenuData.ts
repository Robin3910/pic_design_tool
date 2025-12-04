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
  type?:
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
    | 'add-custom-text'
  text?: string
  icon?: string
  shortcut?: string
  divider?: boolean
}

export const widgetMenu: TWidgetItemData[] = [
  {
    type: 'copy',
    text: '复制',
    icon: 'copy',
    shortcut: 'Ctrl+C',
  },
  {
    type: 'paste',
    text: '粘贴',
    icon: 'paste',
    shortcut: 'Ctrl+V',
  },
  {
    divider: true,
  },
  {
    type: 'rotate-left',
    text: '向左旋转90度',
    icon: 'rotate-left',
  },
  {
    type: 'rotate-right',
    text: '向右旋转90度',
    icon: 'rotate-right',
  },
  {
    divider: true,
  },
  {
    type: 'index-up',
    text: '上移一层',
    icon: 'layer-up',
  },
  {
    type: 'index-down',
    text: '下移一层',
    icon: 'layer-down',
  },
  {
    type: 'index-top',
    text: '置顶',
    icon: 'layer-top',
  },
  {
    divider: true,
  },
  {
    type: 'add-custom-text',
    text: '添加自定义文字',
    icon: 'plus',
  },
  {
    divider: true,
  },
  {
    type: 'del',
    text: '删除',
    icon: 'delete',
    shortcut: 'Delete',
  },
]

export const pageMenu: TWidgetItemData[] = [
  {
    type: 'paste',
    text: '粘贴',
    icon: 'paste',
    shortcut: 'Ctrl+V',
  },
  {
    type: 'add-custom-text',
    text: '添加自定义文字',
    icon: 'plus',
  },
]
