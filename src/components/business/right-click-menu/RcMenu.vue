<template>
  <div v-show="showMenuBg" id="menu-bg" class="menu-bg" @click="closeMenu">
    <ul ref="menuList" class="menu-list" :style="styleObj">
      <li
        v-for="(item, index) in menuListData.list"
        :key="index"
        :class="{ 
          'menu-item': true, 
          'disable-menu': (dCopyElement.length === 0 && item.type === 'paste')
        }"
        @click.stop="selectMenu(item.type)"
      >
        {{ item.text }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onBeforeUnmount, ref, toRaw } from 'vue'
import { 
  widgetMenu as widget, 
  pageMenu as page,
  menuList as menu, 
  TMenuItemData, TWidgetItemData, 
} from './rcMenuData'
import { getTarget } from '@/common/methods/target'
import { storeToRefs } from 'pinia';
import { useControlStore, useWidgetStore, useForceStore } from '@/store';

const menuListData = ref<TMenuItemData>({...menu})
const showMenuBg = ref<boolean>(false)
const widgetMenu = ref<TWidgetItemData[]>([...widget])
const pageMenu = ref<TWidgetItemData[]>([...page])

const widgetStore = useWidgetStore()
const forceStore = useForceStore()

const {dActiveElement, dWidgets, dCopyElement} = storeToRefs(widgetStore)
const { dAltDown } = storeToRefs(useControlStore())

// 保存选中范围的变量
let savedSelectionRange: Range | null = null
let savedTextElement: HTMLElement | null = null

const styleObj = computed(() => {
  return {
    left: menuListData.value.left + 'px',
    top: menuListData.value.top + 'px',
  }
})

onMounted(() => {
  console.log('RcMenu 组件已挂载，设置 document.oncontextmenu')
  document.oncontextmenu = mouseRightClick
  console.log('document.oncontextmenu 已设置:', document.oncontextmenu)
})

onBeforeUnmount(() => {
  console.log('RcMenu 组件卸载，清理 document.oncontextmenu')
  document.oncontextmenu = null
})
async function mouseRightClick(e: MouseEvent) {
  console.log('右键菜单事件触发', e.target, (e.target as any)?.nodeType)
  e.stopPropagation()
  e.preventDefault()
  if (showMenuBg.value) {
    showMenuBg.value = false
    return
  }
  if (!e.target) {
    console.log('没有 target，返回')
    return
  }
  // 如果 target 是文本节点，获取其父元素
  let targetElement: HTMLElement | null = null
  if (e.target instanceof HTMLElement) {
    targetElement = e.target
  } else if (e.target instanceof Text) {
    targetElement = e.target.parentElement
  } else {
    console.log('target 类型不正确:', e.target)
    return
  }
  if (!targetElement) {
    console.log('无法获取目标元素，返回')
    return
  }
  let target = await getTarget(targetElement)
  console.log('getTarget 返回:', target, target?.className, target?.id)
  if (!target) {
    console.log('getTarget 返回 null，返回')
    return
  }
  
  // 查找带有 data-type 或匹配类名的元素（向上查找）
  let type: string | null = null
  let finalTarget: HTMLElement | null = target
  const widgetTypes = ['w-text', 'w-image', 'w-svg', 'w-group', 'w-qrcode']
  
  // 向上查找，直到找到类型或到达页面根元素
  while (finalTarget && finalTarget.id !== 'page-design') {
    // 先检查 data-type
    type = finalTarget.getAttribute('data-type')
    if (type) {
      console.log('找到 data-type:', type, '在元素:', finalTarget)
      target = finalTarget
      break
    }
    
    // 再检查类名
    const classList = Array.from(finalTarget.classList)
    console.log('检查元素类名:', classList, '元素:', finalTarget)
    for (const widgetType of widgetTypes) {
      if (classList.includes(widgetType)) {
        type = widgetType
        console.log('通过类名推断类型:', type, '在元素:', finalTarget)
        target = finalTarget
        break
      }
    }
    
    if (type) break
    
    // 特殊处理：如果当前元素有 text-content 类，继续向上查找
    if (classList.includes('text-content')) {
      console.log('找到 text-content 类，继续向上查找父元素')
      finalTarget = finalTarget.parentElement
      continue
    }
    
    // 如果都没找到，继续向上查找
    finalTarget = finalTarget.parentElement
  }
  
  console.log('最终类型:', type, '最终目标元素:', target)
  if (type) {
    let uuid = target.getAttribute('data-uuid') || target.id || String(target.id) // 如果没有 data-uuid，尝试使用 id
    console.log('uuid:', uuid)

    if (uuid !== '-1' && !dAltDown.value) {
      let widget = dWidgets.value.find((item: any) => item.uuid === uuid || String(item.uuid) === uuid)
      if (
        widget?.parent !== '-1' && 
        widget?.parent !== dActiveElement.value?.uuid &&
        widget?.parent !== dActiveElement.value?.parent
      ) {
        uuid = widget?.parent || ""
      }
    }
    console.log('最终 uuid:', uuid)
    widgetStore.selectWidget({
      uuid: uuid ?? '-1',
    })
    showMenu(e)
  } else {
    console.log('没有找到类型，不显示菜单')
  }
}

function showMenu(e: MouseEvent) {
  let isPage = dActiveElement.value?.uuid === '-1'
  menuListData.value.list = isPage ? pageMenu.value : widgetMenu.value
  
  // 检测是否是文本组件且有选中文本，如果是则添加"染色"菜单项
  const isTextWidget = dActiveElement.value?.type === 'w-text'
  let hasSelectedText = false
  savedSelectionRange = null
  savedTextElement = null
  
  if (isTextWidget && dActiveElement.value?.uuid) {
    const uuid = dActiveElement.value.uuid
    const selector = `[id="${uuid}"] .edit-text`
    const textElement = document.querySelector(selector) as HTMLElement
    if (textElement) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const isInElement = textElement.contains(range.commonAncestorContainer)
        if (!range.collapsed && isInElement) {
          hasSelectedText = true
          // 保存选中范围和文本元素
          savedSelectionRange = range.cloneRange()
          savedTextElement = textElement
        }
      }
    }
  }
  
  // 如果有选中文本，在菜单开头添加"染色"选项
  if (hasSelectedText) {
    const colorMenu: TWidgetItemData[] = [
      {
        type: 'color-text',
        text: '染色',
      },
    ]
    menuListData.value.list = colorMenu.concat(menuListData.value.list)
  }
  
  if (dActiveElement.value?.isContainer) {
    let ungroup: TWidgetItemData[] = [
      {
        type: 'ungroup',
        text: '取消组合',
      },
    ]
    menuListData.value.list = ungroup.concat(menuListData.value.list)
  }
  showMenuBg.value = true
  // document.getElementById('menu-bg').addEventListener('click', this.closeMenu, false)
  let mx = e.pageX
  let my = e.pageY
  let listWidth = 120
  if (mx + listWidth > window.innerWidth) {
    mx -= listWidth
  }
  let listHeight = (14 + 10) * menuListData.value.list.length + 10
  if (my + listHeight > window.innerHeight) {
    my -= listHeight
  }
  menuListData.value.left = mx
  menuListData.value.top = my
}

function closeMenu() {
  showMenuBg.value = false
}

function rotateWidget(step: number) {
  const active = dActiveElement.value
  if (!active || active.uuid === '-1') {
    return
  }
  const currentRotate = active.rotate ? Number(String(active.rotate).replace('deg', '')) : 0
  const nextRotate = (currentRotate + step + 360) % 360
  const rotateValue = `${nextRotate}deg`

  const targetEl = document.getElementById(active.uuid)
  if (targetEl) {
    const originalTransform = targetEl.style.transform || ''
    const hasRotate = /rotate\([^)]*\)/.test(originalTransform)
    targetEl.style.transform = hasRotate
      ? originalTransform.replace(/rotate\([^)]*\)/, `rotate(${rotateValue})`)
      : `${originalTransform} rotate(${rotateValue})`.trim()
  }

  widgetStore.updateWidgetData({
    uuid: active.uuid,
    key: 'rotate',
    value: rotateValue,
  })

  forceStore.setUpdateRect()
}

// 应用颜色到选中文本
function applyColorToSelection(textElement: HTMLElement, range: Range, color: string): boolean {
  try {
    // 保存原始 contenteditable 状态
    const wasEditable = textElement.contentEditable === 'true'
    const originalContentEditable = textElement.contentEditable
    
    // 临时设置为可编辑
    if (!wasEditable) {
      textElement.contentEditable = 'true'
    }
    
    // 确保文本元素获得焦点
    textElement.focus()
    
    // 恢复选中范围
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
    }
    
    // 检查选中范围是否有效
    if (range.collapsed) {
      if (!wasEditable) {
        textElement.contentEditable = originalContentEditable
      }
      return false
    }
    
    // 创建一个 span 元素来包装选中的文本
    const span = document.createElement('span')
    span.style.color = color
    
    try {
      // 尝试使用 surroundContents 来包装选中内容
      range.surroundContents(span)
    } catch (e) {
      // 如果 surroundContents 失败（比如选中内容跨越了多个节点），使用另一种方法
      // 保存 range 的边界点
      const startContainer = range.startContainer
      const startOffset = range.startOffset
      const endContainer = range.endContainer
      const endOffset = range.endOffset
      
      // 提取选中的内容
      const contents = range.extractContents()
      
      // 将内容添加到 span 中
      if (contents) {
        span.appendChild(contents)
      }
      
      // 创建一个新的 range 来插入 span
      const newRange = document.createRange()
      newRange.setStart(startContainer, startOffset)
      newRange.collapse(true) // 折叠到起始位置
      
      // 将 span 插入到原来的位置
      newRange.insertNode(span)
    }
    
    // 合并相邻的文本节点，避免产生空的文本节点
    textElement.normalize()
    
    // 恢复原始 contenteditable 状态
    if (!wasEditable) {
      textElement.contentEditable = originalContentEditable
    }
    
    return true
  } catch (e) {
    console.error('应用颜色到选中文本失败:', e)
    // 恢复原始 contenteditable 状态
    const wasEditable = textElement.contentEditable === 'true'
    const originalContentEditable = textElement.getAttribute('contenteditable')
    if (originalContentEditable !== null && !wasEditable) {
      textElement.contentEditable = originalContentEditable
    }
    return false
  }
}

// 获取染色颜色（从 localStorage 读取，如果没有则使用默认红色）
function getTextColorSelectionColor(): string {
  const saved = localStorage.getItem('textColorSelectionColor')
  return saved || '#ff0000ff'
}

// 染色功能：将选中文本染成指定颜色
function colorTextSelection() {
  const active = dActiveElement.value
  if (!active || active.uuid === '-1' || active.type !== 'w-text') {
    return
  }
  
  const uuid = active.uuid
  const selector = `[id="${uuid}"] .edit-text`
  const textElement = document.querySelector(selector) as HTMLElement
  
  if (!textElement) {
    return
  }
  
  // 优先使用保存的选中范围
  let rangeToUse: Range | null = null
  
  if (savedSelectionRange && savedTextElement === textElement) {
    // 验证保存的范围是否仍然有效
    try {
      const clonedRange = savedSelectionRange.cloneRange()
      const startContainer = clonedRange.startContainer
      const endContainer = clonedRange.endContainer
      // 检查节点是否仍然在文档中
      if (document.contains(startContainer) && document.contains(endContainer)) {
        // 检查范围是否仍然在文本元素内
        if (textElement.contains(startContainer) && textElement.contains(endContainer)) {
          rangeToUse = clonedRange
        }
      }
    } catch (e) {
      console.error('保存的范围无效:', e)
    }
  }
  
  // 如果保存的范围无效，尝试使用当前选中范围
  if (!rangeToUse) {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const isInElement = textElement.contains(range.commonAncestorContainer)
      if (!range.collapsed && isInElement) {
        rangeToUse = range.cloneRange()
      }
    }
  }
  
  if (!rangeToUse || rangeToUse.collapsed) {
    console.warn('没有找到有效的选中范围')
    return
  }
  
  // 从 localStorage 获取染色颜色
  const color = getTextColorSelectionColor()
  const success = applyColorToSelection(textElement, rangeToUse, color)
  
  if (success) {
    // 更新文本内容
    const newText = textElement.innerHTML
    widgetStore.updateWidgetData({
      uuid: uuid,
      key: 'text',
      value: newText,
    })
  }
  
  // 清除保存的范围
  savedSelectionRange = null
  savedTextElement = null
}

/** 点击菜单触发事件 */
function selectMenu(type: TWidgetItemData['type']) {
  switch (type) {
    case 'copy':
      widgetStore.copyWidget()
      break
    case 'paste':
      if (dCopyElement.value.length === 0) {
        return
      }
      widgetStore.pasteWidget()
      break
    case 'rotate-left':
      rotateWidget(-90)
      break
    case 'rotate-right':
      rotateWidget(90)
      break
    case 'index-up':
      widgetStore.updateLayerIndex({
        uuid: dActiveElement.value?.uuid || "",
        value: 1,
        isGroup: dActiveElement.value?.isContainer,
      })
      break
    case 'index-down':
      widgetStore.updateLayerIndex({
        uuid: dActiveElement.value?.uuid || "",
        value: -1,
        isGroup: dActiveElement.value?.isContainer,
      })
      break
    case 'index-top':
      widgetStore.updateLayerIndex({
        uuid: dActiveElement.value?.uuid || "",
        value: 999,
        isGroup: dActiveElement.value?.isContainer,
      })
      break
    case 'del':
      widgetStore.deleteWidget()
      break
    case 'ungroup':
      widgetStore.ungroup(dActiveElement.value?.uuid || "")
      break
    case 'color-text':
      colorTextSelection()
      break
  }
  closeMenu()
}

</script>

<style lang="less" scoped>
.menu-bg {
  height: 100%;
  position: absolute;
  width: 100%;
  z-index: 99999;
  .menu-list {
    background-color: @color-white;
    box-shadow: 1px 0px 10px 3px rgba(0, 0, 0, 0.1);
    padding: 5px;
    position: absolute;
    width: 120px;
    .menu-item {
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      padding: 5px 15px;
      width: 100%;
      &:hover {
        background-color: #ececec;
      }
    }
    .menu-item.disable-menu {
      background-color: @color-white;
      color: #aaaaaa;
      cursor: not-allowed;
    }
  }
}
</style>
