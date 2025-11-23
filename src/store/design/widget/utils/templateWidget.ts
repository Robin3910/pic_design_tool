import type { TdWidgetData } from '../index'

export const applyTemplateImageDefaults = (widget: TdWidgetData) => {
  if (widget.type !== 'w-image') {
    return
  }

  widget.name = '模板图片'
  // 已取消自动锁定和自动置顶
  // widget.lock = true
  // widget.isTop = true
}

