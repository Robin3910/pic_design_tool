/*
 * @Author: Jeremy Yu
 * @Date: 2024-03-28 14:00:00
 * @Description:
 * @LastEditors: Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-03-28 14:00:00
 */

import { useForceStore } from "@/store"
import { TWidgetStore, TdWidgetData } from ".."

export type TupdateLayerIndexData = {
  uuid: string
  value: number
  isGroup?: boolean
}

export function updateLayerIndex(store: TWidgetStore, { uuid, value, isGroup }: TupdateLayerIndexData) {
  const widgets = store.dWidgets
  const widget = widgets.find((item) => item.uuid === uuid)
  const index = widgets.findIndex((item) => item.uuid === uuid)
  let group: TdWidgetData[] = []

  if (!widget) return

  // 置顶功能：value === 999 表示置顶
  if (value === 999) {
    // 如果已经置顶，则取消置顶（将图层移动到同层级的第一个位置）
    if (widget.isTop) {
      widget.isTop = false
      
      if (isGroup) {
        // 组合组件移动
        group = widgets.filter((item) => item.parent === uuid)
        for (let i = 0; i < group.length; ++i) {
          const pos = widgets.findIndex((item) => item.uuid === group[i].uuid)
          widgets.splice(pos, 1)
        }
      }
      
      // 找到同层级（相同 parent）的第一个位置
      let targetIndex = 0
      if (widget.parent !== '-1') {
        // 在容器内，找到容器内第一个元素的位置
        for (let i = 0; i < widgets.length; i++) {
          if (widgets[i].parent === widget.parent) {
            targetIndex = i
            break
          }
        }
      } else {
        // 在顶层，找到顶层第一个元素的位置（跳过容器内的子元素）
        for (let i = 0; i < widgets.length; i++) {
          if (widgets[i].parent === '-1') {
            targetIndex = i
            break
          }
        }
      }
      
      // 移除原位置
      const currentIndex = widgets.findIndex((item) => item.uuid === uuid)
      widgets.splice(currentIndex, 1)
      // 插入到目标位置
      widgets.splice(targetIndex, 0, widget)
      
      // 如果是组合，要把里面的组件添加回去
      if (isGroup) {
        const pos = widgets.findIndex((item) => item.uuid === uuid)
        for (let i = group.length - 1; i >= 0; --i) {
          widgets.splice(pos + 1, 0, group[i])
        }
      }
      return
    }

    if (isGroup) {
      // 组合组件移动
      group = widgets.filter((item) => item.parent === uuid)
      for (let i = 0; i < group.length; ++i) {
        const pos = widgets.findIndex((item) => item.uuid === group[i].uuid)
        widgets.splice(pos, 1)
      }
    }

    // 找到同层级（相同 parent）的最后一个位置
    let targetIndex = widgets.length
    if (widget.parent !== '-1') {
      // 在容器内，找到容器内最后一个元素的位置
      for (let i = widgets.length - 1; i >= 0; i--) {
        if (widgets[i].parent === widget.parent) {
          targetIndex = i + 1
          break
        }
      }
    } else {
      // 在顶层，找到顶层最后一个元素的位置（跳过容器内的子元素）
      for (let i = widgets.length - 1; i >= 0; i--) {
        if (widgets[i].parent === '-1') {
          if (widgets[i].isContainer) {
            // 如果是容器，找到容器及其所有子元素后的位置
            let containerEnd = i
            for (let j = i + 1; j < widgets.length; j++) {
              if (widgets[j].parent === widgets[i].uuid) {
                containerEnd = j
              } else {
                break
              }
            }
            targetIndex = containerEnd + 1
          } else {
            targetIndex = i + 1
          }
          break
        }
      }
    }

    // 移除原位置
    widgets.splice(index, 1)
    // 插入到目标位置
    widgets.splice(targetIndex, 0, widget)
    // 设置置顶标记
    widget.isTop = true

    // 如果是组合，要把里面的组件添加回去
    if (isGroup) {
      const pos = widgets.findIndex((item) => item.uuid === uuid)
      for (let i = group.length - 1; i >= 0; --i) {
        widgets.splice(pos + 1, 0, group[i])
      }
    }
    return
  }

  if (isGroup) {
    // 组合组件移动
    group = widgets.filter((item) => item.parent === uuid)
    for (let i = 0; i < group.length; ++i) {
      const pos = widgets.findIndex((item) => item.uuid === group[i].uuid)
      widgets.splice(pos, 1)
    }
  }

  // 单个组件移动，组合的把容器内的组件取出来后也相当于是移动单个组件
  let next = index + value
  let move = false
  const maxLen = widgets.length
  let gCount = 1 // 记录跳过的组合数量
  // 循环找出要目标位置并移动（因为存在组合，所以不能直接移动到下一个位置）
  while (next >= 0 && next < maxLen) {
    const nextWidget = widgets[next]
    if (widget.parent !== '-1') {
      // 如果是在容器里面，比较简单，只要目标组件的父容器一样就移动，不一样说明出了容器了就不移动
      if (nextWidget.parent === widget.parent) {
        widgets.splice(index, 1)
        widgets.splice(next, 0, widget)
        move = true
      }
      break
      // 如果父容器一样并且（目标组件不是容器或者先上移动并且目标组件是容器），则是要移动的位置
    } else if (nextWidget.parent === '-1') {
      if ((gCount === 0 && nextWidget.isContainer) || !nextWidget.isContainer || (value < 0 && nextWidget.isContainer)) {
        if (gCount === 0 && value > 0) {
          next -= value
        }
        widgets.splice(index, 1)
        widgets.splice(next, 0, widget)
        move = true
        break
      } else if (nextWidget.isContainer) {
        gCount = 0
      }
    }
    next += value
  }
  next -= value
  if (!move && next !== index) {
    widgets.splice(index, 1)
    widgets.splice(next, 0, widget)
  }

  // 如果是组合，要把里面的组件添加回去
  if (isGroup) {
    const pos = widgets.findIndex((item) => item.uuid === uuid)
    for (let i = group.length - 1; i >= 0; --i) {
      widgets.splice(pos + 1, 0, group[i])
    }
  }
}

// TODO: 取消组合
export function ungroup(store: TWidgetStore, uuid: string) {
  const forceStore = useForceStore()

  const widgets = store.dWidgets
  const index = widgets.findIndex((item) => item.uuid === uuid)
  widgets.splice(index, 1)
  const len = widgets.length

  for (let i = 0; i < len; ++i) {
    if (widgets[i].parent === uuid) {
      widgets[i].parent = '-1'
      // store.state.dAltDown = true
      // store.dispatch('selectWidgetsInOut', { uuid: widgets[i].uuid })
      store.dSelectWidgets.push(widgets[i])
    }
  }
  // store.state.dAltDown = false
  
  forceStore.setUpdateSelect()
  // store.commit('updateSelect')
  // store.state.dActiveElement = store.state.dPage
}
