/*
 * @Author: ShawnPhang
 * @Date: 2022-01-08 09:43:37
 * @Description: 字体处理
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 10:33:36
 */
import { OssApi, type TemuFontResourceDO } from '@/api/temu/oss'

const nowVersion = '4' // 当前字体文件版本更新，将刷新前端缓存

/** 字体item类型 */
export type TFontItemData = {
  id: number
  oid: string
  value: string
  alias: string
  preview: string
  url: string
  lang: string
}

const fontList: TFontItemData[] = []

/**
 * 将后端字体资源转换为前端字体item格式
 */
function transformFontResource(resource: TemuFontResourceDO): TFontItemData {
  // 从 fontName 中提取字体别名（去掉扩展名）
  const fontName = resource.fontName || ''
  const dotIndex = fontName.lastIndexOf('.')
  const alias = dotIndex > 0 ? fontName.substring(0, dotIndex) : fontName

  // 根据字体名判断语言类型（简单判断：包含中文则为中文）
  const isChinese = /[\u4e00-\u9fa5]/.test(alias)
  const lang = isChinese ? 'zh' : 'en'

  return {
    id: resource.id,
    oid: String(resource.id),
    value: alias, // 使用别名作为字体标识
    alias: alias,
    preview: '', // 后端接口没有返回预览图
    url: resource.ossUrl, // OSS 链接作为字体文件 URL
    lang: lang,
  }
}

export const useFontStore = {
  list: fontList,

  async init(forceRefresh: boolean = false) {
    this.list = []
    
    // 强制刷新时跳过本地缓存，直接从后端获取
    if (!forceRefresh) {
      // 版本不匹配时清除本地缓存
      if (localStorage.getItem('FONTS_VERSION') !== nowVersion) {
        localStorage.removeItem('FONTS')
      }

      // 尝试从本地缓存读取
      const localFonts: TFontItemData[] = localStorage.getItem('FONTS')
        ? JSON.parse(localStorage.getItem('FONTS') || '')
        : []

      if (localFonts.length > 0) {
        this.list.push(...localFonts)
        // 非强制刷新时，如果本地有缓存，直接返回，不请求后端
        return
      }
    } else {
      // 强制刷新时清除本地缓存
      localStorage.removeItem('FONTS')
    }

    // 从后端获取字体资源
    try {
      // 获取第一页，每页 100 条（最大建议值）
      const pageResult = await OssApi.getFontResourcePage({ pageNo: 1, pageSize: 100 })

      if (pageResult && pageResult.list && pageResult.list.length > 0) {
        // 将后端返回的字体资源转换为前端格式
        const remoteFonts = pageResult.list
          .filter((r) => !r.deleted) // 过滤已删除的
          .map(transformFontResource)

        this.list = remoteFonts
      } else {
        // 后端没有返回数据，字体列表为空
        this.list = []
      }
    } catch (error) {
      console.error('获取字体资源失败:', error)
      // 接口失败时字体列表为空
      this.list = []
    }

    // 保存到本地缓存
    localStorage.setItem('FONTS', JSON.stringify(this.list))
    localStorage.setItem('FONTS_VERSION', nowVersion)
  },

  /**
   * 根据ID获取字体资源详情
   */
  async getFontById(id: number): Promise<TFontItemData | null> {
    // 先检查本地缓存
    const localFont = this.list.find((f) => f.id === id)
    if (localFont) {
      return localFont
    }

    // 本地缓存没有，从后端获取
    try {
      const resource = await OssApi.getFontResourceById(id)
      if (resource && !resource.deleted) {
        return transformFontResource(resource)
      }
      return null
    } catch (error) {
      console.error('获取字体资源详情失败:', error)
      return null
    }
  },
}
