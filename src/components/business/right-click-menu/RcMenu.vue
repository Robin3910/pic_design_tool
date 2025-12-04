<template>
  <div v-show="showMenuBg" id="menu-bg" class="menu-bg" @click="closeMenu">
    <ul ref="menuList" class="menu-list" :style="styleObj">
      <template v-for="(item, index) in menuListData.list" :key="index">
        <li
          v-if="item.divider"
          class="menu-divider"
        ></li>
      <li
          v-else
        :class="{ 
          'menu-item': true, 
          'disable-menu': (dCopyElement.length === 0 && item.type === 'paste')
        }"
          @click.stop="item.type && !((dCopyElement.length === 0 && item.type === 'paste')) && selectMenu(item.type)"
      >
          <span class="menu-item-content">
            <span class="menu-item-left">
              <svg v-if="item.icon" class="menu-icon" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path v-if="item.icon === 'copy'" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2z"/>
                <template v-else-if="item.icon === 'paste'">
                  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                </template>
                <path v-else-if="item.icon === 'rotate-left'" fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
                <path v-else-if="item.icon === 'rotate-right'" fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 0 .771.636A5.002 5.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zm3.1 6a5.002 5.002 0 0 1-4.757 2.818.5.5 0 1 0 .771.636A6.002 6.002 0 0 0 13.917 9H12.9z"/>
                <template v-else-if="item.icon === 'layer-up'">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.646 4.646a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5a.5.5 0 0 1-1 0V5.707L5.354 8.354a.5.5 0 1 1-.708-.708l3-3z"/>
                </template>
                <template v-else-if="item.icon === 'layer-down'">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z"/>
                </template>
                <template v-else-if="item.icon === 'layer-top'">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M7.646 4.646a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5a.5.5 0 0 1-1 0V5.707L5.354 8.354a.5.5 0 1 1-.708-.708l3-3z"/>
                  <path d="M4.5 11.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z"/>
                </template>
                <template v-else-if="item.icon === 'delete'">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </template>
                <template v-else-if="item.icon === 'ungroup'">
                  <path d="M6.5 2A1.5 1.5 0 0 0 5 3.5v3A1.5 1.5 0 0 0 6.5 8h3A1.5 1.5 0 0 0 11 6.5v-3A1.5 1.5 0 0 0 9.5 2h-3zM6 3.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3z"/>
                  <path d="M2.5 10A1.5 1.5 0 0 0 1 11.5v3A1.5 1.5 0 0 0 2.5 16h3A1.5 1.5 0 0 0 7 14.5v-3A1.5 1.5 0 0 0 5.5 10h-3zm.5 1.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3z"/>
                  <path d="M10.5 10A1.5 1.5 0 0 0 9 11.5v3a1.5 1.5 0 0 0 1.5 1.5h3a1.5 1.5 0 0 0 1.5-1.5v-3A1.5 1.5 0 0 0 13.5 10h-3zm.5 1.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3z"/>
                </template>
                <template v-else-if="item.icon === 'color'">
                  <path d="M8 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm4 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5.5 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm6.5 3a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                  <path d="M2 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10.5-5.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM14 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM7.5 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                </template>
                <template v-else-if="item.icon === 'plus'">
                  <path d="M8 1a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2H9v5a1 1 0 1 1-2 0V9H2a1 1 0 0 1 0-2h5V2a1 1 0 0 1 1-1z"/>
                </template>
              </svg>
              <span class="menu-text">{{ item.text }}</span>
            </span>
            <span v-if="item.shortcut" class="menu-shortcut">{{ item.shortcut }}</span>
          </span>
      </li>
      </template>
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
import { useControlStore, useWidgetStore, useForceStore, useUiStore, useCanvasStore } from '@/store';
import { wTextSetting, getLastSelectedFont } from '@/components/modules/widgets/wText/wTextSetting'

const menuListData = ref<TMenuItemData>({...menu})
const showMenuBg = ref<boolean>(false)
const widgetMenu = ref<TWidgetItemData[]>([...widget])
const pageMenu = ref<TWidgetItemData[]>([...page])

const controlStore = useControlStore()
const widgetStore = useWidgetStore()
const forceStore = useForceStore()
const uiStore = useUiStore()
const canvasStore = useCanvasStore()

const {dActiveElement, dWidgets, dCopyElement} = storeToRefs(widgetStore)
const { dAltDown } = storeToRefs(controlStore)
const { dZoom, dPage } = storeToRefs(canvasStore)

// 保存选中范围的变量
let savedSelectionRange: Range | null = null
let savedTextElement: HTMLElement | null = null

const styleObj = computed(() => {
  const zoomScale = dZoom.value / 100
  return {
    left: menuListData.value.left + 'px',
    top: menuListData.value.top + 'px',
    transform: `scale(${zoomScale})`,
    transformOrigin: 'top left',
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
        icon: 'color',
      },
    ]
    menuListData.value.list = colorMenu.concat(menuListData.value.list)
  }
  
  if (dActiveElement.value?.isContainer) {
    let ungroup: TWidgetItemData[] = [
      {
        type: 'ungroup',
        text: '取消组合',
        icon: 'ungroup',
      },
    ]
    menuListData.value.list = ungroup.concat(menuListData.value.list)
  }
  showMenuBg.value = true
  // 使用 clientX/clientY（相对于视口的坐标），因为 menu-bg 使用 position: fixed
  // fixed 定位相对于视口，不受滚动和父元素定位影响
  const zoomScale = dZoom.value / 100
  let mx = e.clientX
  let my = e.clientY
  // 计算原始菜单宽度（transform scale 不影响布局，但我们需要考虑缩放后的视觉宽度）
  let listWidth = 180
  // 边界检测：检查菜单是否会超出视口右边界（考虑缩放后的视觉宽度）
  if (mx + listWidth * zoomScale > window.innerWidth) {
    mx -= listWidth * zoomScale
  }
  // 边界检测：检查菜单是否会超出视口下边界
  // 计算实际菜单高度（包括分隔线）
  const itemHeight = 36 // 每个菜单项高度（padding 8px * 2 + line-height 1.5 * 14px ≈ 36px）
  const dividerHeight = 13 // 分隔线高度（margin 6px * 2 + 1px）
  let listHeight = menuListData.value.list.reduce((height, item) => {
    return height + (item.divider ? dividerHeight : itemHeight)
  }, 12) // 12px 是上下 padding
  // 考虑缩放后的视觉高度
  if (my + listHeight * zoomScale > window.innerHeight) {
    my -= listHeight * zoomScale
  }
  menuListData.value.left = mx
  menuListData.value.top = my
}

function closeMenu() {
  showMenuBg.value = false
}

function addCustomTextWidget() {
  controlStore.setShowMoveable?.(false)
  const setting = JSON.parse(JSON.stringify(wTextSetting))
  const lastFont = getLastSelectedFont()
  if (lastFont) {
    setting.fontClass = lastFont
    setting.fontFamily = lastFont.value
  }
  setting.text = '自定义文字'
  setting.fontSize = 24
  setting.fontWeight = 'normal'
  setting.name = '文本'
  setting.type = 'w-text'
  setting.sortId = ''
  setting.sortIndex = undefined

  const page = dPage.value
  const textWidth = setting.text.length * setting.fontSize * 0.6
  setting.left = page.width / 2 - textWidth / 2
  setting.top = page.height / 2 - setting.fontSize / 2
  setting.width = Math.max(textWidth || setting.fontSize, setting.fontSize)
  setting.height = setting.fontSize * setting.lineHeight

  widgetStore.addWidget(setting)
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
    case 'add-custom-text':
      addCustomTextWidget()
      break
  }
  closeMenu()
}

</script>

<style lang="less" scoped>
.menu-bg {
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  z-index: 99999;
  .menu-list {
    background-color: @color-white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1);
    padding: 6px 0;
    position: absolute;
    min-width: 180px;
    max-width: 240px;
    animation: menuFadeIn 0.15s ease-out;
    
    .menu-item {
      cursor: pointer;
      font-size: 14px;
      line-height: 1.5;
      padding: 8px 16px;
      width: 100%;
      transition: background-color 0.15s ease;
      user-select: none;
      
      .menu-item-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        
        .menu-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          
          .menu-icon {
            width: 16px;
            height: 16px;
            color: #333;
            flex-shrink: 0;
          }
          
          .menu-text {
            color: #333;
            font-size: 14px;
            line-height: 1.5;
          }
        }
        
        .menu-shortcut {
          color: #999;
          font-size: 12px;
          margin-left: 16px;
          font-family: 'Consolas', 'Monaco', monospace;
        }
      }
      
      &:hover:not(.disable-menu) {
        background-color: #f5f5f5;
        
        .menu-item-content {
          .menu-item-left {
            .menu-icon {
              color: #1890ff;
            }
            .menu-text {
              color: #1890ff;
      }
    }
        }
      }
      
      &:active:not(.disable-menu) {
        background-color: #e6f7ff;
      }
    }
    
    .menu-item.disable-menu {
      background-color: @color-white;
      cursor: not-allowed;
      opacity: 0.5;
      
      .menu-item-content {
        .menu-item-left {
          .menu-icon {
            color: #ccc;
          }
          .menu-text {
            color: #aaa;
          }
        }
        .menu-shortcut {
          color: #ccc;
        }
      }
      
      &:hover {
        background-color: @color-white;
      }
    }
    
    .menu-divider {
      height: 1px;
      background-color: #e8e8e8;
      margin: 6px 0;
      padding: 0;
      list-style: none;
    }
  }
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
