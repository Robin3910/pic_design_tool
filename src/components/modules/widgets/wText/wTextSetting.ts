import { StyleValue } from "vue"

// 从 localStorage 获取上次选择的字体
export function getLastSelectedFont(): TwTextData['fontClass'] | null {
  try {
    const saved = localStorage.getItem('lastSelectedFont')
    if (saved) {
      const font = JSON.parse(saved)
      // 验证字体对象结构
      if (font && typeof font === 'object' && font.id !== undefined && font.value) {
        return {
          alias: font.alias || font.value,
          id: font.id,
          value: font.value,
          url: font.url || '',
        }
      }
    }
  } catch (e) {
    console.error('读取记忆字体失败:', e)
  }
  return null
}

export type TwTextData = {
  name: string
  type: string
  uuid: number
  editable: boolean,
  left: number
  top: number
  transform: string
  lineHeight: number
  letterSpacing: number
  fontSize: number
  zoom: number
  fontClass: {
    alias: string
    id: number
    value: string
    url: string
  },
  fontFamily: string
  fontWeight: string
  fontStyle: string
  writingMode: StyleProperty.WritingMode
  textDecoration: string
  color: string
  textAlign: StyleProperty.TextAlign
  textAlignLast: StyleProperty.TextAlign
  text: string
  opacity: number
  backgroundColor: string
  parent: string
  /** 素材排序信息 */
  sortId?: number | string
  sortIndex?: number
  record: {
    width: number
    height: number
    minWidth: number
    minHeight: number
    dir: string
  },
  textEffects?: {
    filling: {
      enable: boolean
      type: number
      color: string
    }
    stroke: {
      enable: boolean
      width: number
      color: string
    }
    shadow: {
      enable: boolean
      offsetY: number
      offsetX: number
      blur: number
      color: string
    }
    offset: {
      enable: boolean
      x: number
      y: number
    }
  }[]
  width?: number
  height?: number
  degree?: number
}

// 获取带记忆的默认字体设置
function getDefaultFontClass(): TwTextData['fontClass'] {
  const lastFont = getLastSelectedFont()
  if (lastFont) {
    return lastFont
  }
  // 如果没有记忆的字体，使用默认字体
  return {
    alias: 'Acardia Regular',
    id: 0,
    value: 'Acardia Regular',
    url: '',
  }
}

const defaultFontClass = getDefaultFontClass()

export const wTextSetting: TwTextData = {
  name: '文本',
  type: 'w-text',
  uuid: -1,
  editable: false,
  left: 0,
  top: 0,
  transform: '',
  lineHeight: 1.5,
  letterSpacing: 0,
  fontSize: 24,
  zoom: 1,
  fontClass: defaultFontClass,
  fontFamily: defaultFontClass.value,
  fontWeight: 'normal',
  fontStyle: 'normal',
  writingMode: 'horizontal-tb',
  textDecoration: 'none',
  color: '#000000ff',
  textAlign: 'left',
  textAlignLast: 'left',
  text: '',
  opacity: 1,
  backgroundColor: '',
  parent: '-1',
  sortId: '',
  sortIndex: undefined,
  record: {
    width: 0,
    height: 0,
    minWidth: 0,
    minHeight: 0,
    dir: 'horizontal',
  },
}