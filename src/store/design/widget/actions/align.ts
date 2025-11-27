/*
 * @Author: Jeremy Yu
 * @Date: 2024-03-28 14:00:00
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 09:29:27
 */

import { useCanvasStore, useHistoryStore } from "@/store"
import { TWidgetStore, TdWidgetData } from ".."
import { updateWidgetData } from "./widget"

type TAlign = 'left' | 'ch' | 'right' | 'top' | 'cv' | 'bottom'

export type TUpdateAlignData = {
  align: TAlign
  uuid: string
  group?: TdWidgetData
}

export function updateAlign(store: TWidgetStore, { align, uuid, group }: TUpdateAlignData) {
  const pageStore = useCanvasStore()
  const historyStore = useHistoryStore()
  const canvasStore = useCanvasStore()

  const widgets = store.dWidgets
  const target = uuid ? widgets.find((item: any) => item.uuid === uuid) : store.dActiveElement
  let parent = group || pageStore.dPage

  if (!target) return

  // 如果传入了 group 参数，优先使用 group 作为对齐基准
  // 否则，如果元素有父容器，使用父容器作为对齐基准
  if (!group && target.parent !== '-1') {
    const tmp = widgets.find((item: any) => item.uuid === target.parent)
    tmp && (parent = tmp)
  }

  let left = target.left
  let top = target.top
  let pw = parent.record.width || parent.width
  let ph = parent.record.height || parent.height

  if (parent.uuid === '-1') {
    pw = parent.width
    ph = parent.height
  }

  // 对于文本元素，优先使用 record.width，因为实际宽度可能存储在 record 中
  // 如果 record.width 不存在或为 0，则使用 target.width
  const targetW = (target.type === 'w-text' && target.record?.width && target.record.width > 0) 
    ? target.record.width 
    : (target.width || 0)
  const targetH = (target.type === 'w-text' && target.record?.height && target.record.height > 0) 
    ? target.record.height 
    : (target.height || 0)
  switch (align) {
    case 'left':
      left = parent.left
      break
    case 'ch': // 水平居中
      left = Math.round(parent.left + pw / 2 - targetW / 2)
      break
    case 'right':
      left = Math.round(parent.left + pw - targetW)
      break
    case 'top':
      top = parent.top
      break
    case 'cv': // 垂直居中
      top = Math.round(parent.top + ph / 2 - targetH / 2)
      break
    case 'bottom':
      top = Math.round(parent.top + ph - targetH)
      break
  }

  if (target.left !== left || target.top !== top) {
    // 如果是容器，需要先更新子元素的位置
    if (target.isContainer) {
      const dLeft = target.left - left
      const dTop = target.top - top
      const len = widgets.length
      for (let i = 0; i < len; ++i) {
        const widget = widgets[i]
        if (widget.parent === target.uuid) {
          widget.left -= dLeft
          widget.top -= dTop
        }
      }
    }
    
    // 直接修改属性，与 dMove 函数保持一致
    target.left = left
    target.top = top

    canvasStore.reChangeCanvas()
    // store.dispatch('reChangeCanvas')
  }
}
