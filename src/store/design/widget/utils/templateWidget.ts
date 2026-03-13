import type { TdWidgetData } from '../index'

let templateImageCount = 0

export const applyTemplateImageDefaults = (widget: TdWidgetData, isFirstImage: boolean = false) => {
  if (widget.type !== 'w-image') {
    return
  }

  widget.name = '模板图片'
  // 只锁定第一张模板图片，避免误操作
  if (isFirstImage && widget.lock !== true) {
    widget.lock = true
  }
  // 已取消自动置顶
  // widget.isTop = true
}

export const resetTemplateImageCount = () => {
  templateImageCount = 0
}

