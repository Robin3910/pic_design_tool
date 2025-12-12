/*
 * @Author: Jeremy Yu
 * @Date: 2024-03-28 21:00:00
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 09:29:35
 */


import { customAlphabet } from 'nanoid/non-secure'
import { TWidgetStore, TdWidgetData } from '..'
import { useCanvasStore, useWidgetStore } from '@/store'
import { applyTemplateImageDefaults } from '../utils/templateWidget'
const nanoid = customAlphabet('1234567890abcdef', 12)

// TODO: 选择模板
export function setTemplate(store: TWidgetStore, allWidgets: TdWidgetData[]) {
  // const historyStore = useHistoryStore()
  const canvasStore = useCanvasStore()
  const widgetStore = useWidgetStore()
  // 仅对第一个“模板图片”做画布铺满校正，避免画布露边
  let firstTemplateImageHandled = false
  allWidgets.forEach((item) => {
    Number(item.uuid) < 0 && (item.uuid = nanoid()) // 重设id
    item.text && (item.text = decodeURIComponent(item.text))
    // 从模板加载的图片命名为"模板图片"
    applyTemplateImageDefaults(item)
    // 导入到画布时，让第一个模板图片自动铺满整个画布，避免边缘露白
    if (!firstTemplateImageHandled && item.type === 'w-image' && item.name === '模板图片') {
      const page = canvasStore.dPage
      // 细小留白通常来自缩放取整误差，这里额外扩展 4px 作为“出血”保障
      const bleed = 2
      const bleedOffset = bleed / 2
      item.left = -bleedOffset
      item.top = -bleedOffset
      item.width = page.width + bleed
      item.height = page.height + bleed
      // 同步修正记录尺寸，保持后续操作一致
      const anyItem = item as any
      anyItem.record = anyItem.record || {}
      anyItem.record.width = page.width + bleed
      anyItem.record.height = page.height + bleed
      firstTemplateImageHandled = true
    }
    store.dWidgets.push(item)
  })
  widgetStore.updateDWidgets()
  canvasStore.reChangeCanvas()
}
