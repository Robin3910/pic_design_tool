import type { TdWidgetData } from '../index'

export const applyTemplateImageDefaults = (widget: TdWidgetData) => {
  if (widget.type !== 'w-image') {
    return
  }

  widget.name = '模板图片'
  // 模板图片初次导入时默认锁定，避免误操作
  if (widget.lock !== true) {
    widget.lock = true
  }
  // 已取消自动置顶
  // widget.isTop = true
}

