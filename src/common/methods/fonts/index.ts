/*
 * @Author: ShawnPhang
 * @Date: 2022-01-08 09:43:37
 * @Description: 字体处理
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 10:33:36
 */
// import { isSupportFontFamily, blob2Base64 } from './utils'
import { TGetFontItemData, getFonts } from '@/api/material'

const nowVersion = '2' // 当前字体文件版本更新，将刷新前端缓存

/** 字体item类型 */
export type TFontItemData = { url: string } & Omit<TGetFontItemData, 'woff'>

const fontList: TFontItemData[] = []
// const download: any = {}
export const useFontStore = {
  list: fontList,
  // download,
  async init() {
    this.list = []
    localStorage.getItem('FONTS_VERSION') !== nowVersion && localStorage.removeItem('FONTS')
    const localFonts: TFontItemData[] = localStorage.getItem('FONTS') ? JSON.parse(localStorage.getItem('FONTS') || '') : []
    if (localFonts.length > 0) {
      this.list.push(...localFonts)
    }

    // 默认字体列表
    const defaultFonts = [
      {
        id: 0,
        alias: 'Acardia Regular',
        preview: '',
        ttf: null,
        woff: '',
        value: 'Acardia Regular',
        font_family: '',
        size: 0,
        lang: 'en',
        woff_size: 0,
      },
      {
        id: 544,
        alias: '阿里巴巴数黑体',
        preview: '',
        ttf: null,
        woff: '',
        value: '阿里巴巴数黑体',
        font_family: '',
        size: 0,
        lang: 'zh',
        woff_size: 0,
      },
      {
        id: 543,
        alias: '站酷快乐体',
        preview: '',
        ttf: null,
        woff: 'https://lib.baomitu.com/fonts/zcool-kuaile/zcool-kuaile-regular.woff2',
        value: 'zcool-kuaile-regular',
        font_family: '',
        size: 0,
        lang: 'zh',
        woff_size: 0,
      },
      {
        id: 546,
        alias: 'Dancing Script',
        preview: '',
        ttf: null,
        woff: '',
        value: 'Dancing Script',
        font_family: '',
        size: 0,
        lang: 'en',
        woff_size: 0,
      },
    ]

    if (this.list.length === 0) {
      // 如果列表为空，添加所有默认字体
      this.list.unshift(
        ...defaultFonts.map((x) => {
          const { id, alias, value, preview, woff, lang } = x
          return { id, oid: '0', value, preview, alias, url: woff, lang }
        }),
      )
      localStorage.setItem('FONTS', JSON.stringify(this.list))
      localStorage.setItem('FONTS_VERSION', nowVersion)
    } else {
      // 如果列表不为空，检查并添加缺失的默认字体
      let hasNewDefaultFont = false
      for (const defaultFont of defaultFonts) {
        const hasFont = this.list.some((f) => f.value === defaultFont.value)
        if (!hasFont) {
          const { id, alias, value, preview, woff, lang } = defaultFont
          this.list.unshift({ id, oid: '0', value, preview, alias, url: woff, lang })
          hasNewDefaultFont = true
        }
      }
      // 如果有新增的默认字体，更新 localStorage
      if (hasNewDefaultFont) {
        localStorage.setItem('FONTS', JSON.stringify(this.list))
      }
    }
    // store.dispatch('setFonts', this.list)
  },
}

// export const useFontStore = () => {
//   return {
//     list: fontList,
//     download,
//     async init() {
//       this.list = []
//       const localFonts: any = localStorage.getItem('FONTS') ? JSON.parse(localStorage.getItem('FONTS') || '') : []
//       if (localFonts.length > 0) {
//         this.list.push(...localFonts)
//       }

//       if (this.list.length === 0) {
//         const res = await getFonts({ pageSize: 400 })
//         this.list.unshift(
//           ...res.map((x: any) => {
//             const { content, id, name, preview } = x
//             return { id, name, preview: preview.url, alias: content.alias, family: content.family, lang: content.lang, ttf: content.ttf, url: content.woff }
//           }),
//         )
//         localStorage.setItem('FONTS', JSON.stringify(this.list))
//       }
//       console.log(this.list)
//     },
//     getList() {
//       return fontList
//     },
//   }
// }

// export const useFontStore = () => {
//   return {
//     list: fontList,
//     download,
//     async init() {
//       this.list = []
//       const localFonts: any = localStorage.getItem('FONTS') ? JSON.parse(localStorage.getItem('FONTS') || '') : []
//       if (localFonts.length > 0) {
//         this.list.push(...localFonts)
//       }

//       if (this.list.length === 0) {
//         for (let i = 1; i < 99; i += 1) {
//           const res = await getFonts(i)
//           this.list.unshift(
//             ...res.map((x: any) => {
//               const { content, id, name, preview } = x
//               return { id, name, preview: preview.url, alias: content.alias, family: content.family, lang: content.lang, ttf: content.ttf, url: content.woff }
//             }),
//           )
//           if (res.length < 100) break
//         }
//         localStorage.setItem('FONTS', JSON.stringify(this.list))
//       }
//     },
//     async addFont2Style(name: string, url: string) {
//       // if (this.download[name]) return;
//       if (isSupportFontFamily(name)) return

//       const response = await fetch(url, { headers: { responseType: 'blob' } })
//       const blob = await response.blob()
//       const ff = new FontFace(name, `url(${URL.createObjectURL(blob)})`)
//       const f = await ff.load()
//       ;(document.fonts as FontFaceSet).add(f)

//       const b64 = await blob2Base64(blob)
//       // 使用 base64 是为了方便将 DOM 生成图片
//       this.download[name] = b64
//       // document.head.appendChild(generateFontStyle(name, b64));
//     },
//   }
// }
