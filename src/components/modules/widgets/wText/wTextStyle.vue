<template>
  <div id="w-text-style">
    <el-collapse v-model="state.activeNames">
      <el-collapse-item title="位置尺寸" name="1">
        <div class="line-layout">
          <number-input v-model="state.innerElement.left" label="X" @finish="(value) => finish('left', value)" />
          <number-input v-model="state.innerElement.top" label="Y" @finish="(value) => finish('top', value)" />
          <number-input v-model="state.innerElement.width" style="margin-top: 0.5rem" label="宽" :editable="true" @finish="(value) => finish('width', value)" />
          <number-input v-model="state.innerElement.height" style="margin-top: 0.5rem" label="高" :editable="true" @finish="(value) => finish('height', value)" />
        </div>
      </el-collapse-item>
      <!-- <el-collapse-item title="样式设置" name="2"> -->
      <div class="line-layout style-item font-setting-row">
        <value-select
          class="font-name-select"
          v-model="state.innerElement.fontClass"
          label="文字"
          :data="state.fontClassList"
          inputWidth="100%"
          :readonly="true"
          @finish="(font) => finish('fontClass', font)"
        />
        <value-select
          class="font-size-select"
          v-model="state.innerElement.fontSize"
          label="大小"
          suffix="px"
          :data="state.fontSizeList"
          inputWidth="80px"
          @finish="(value) => finish('fontSize', value)"
        />
      </div>

      <icon-item-select class="style-item" :data="state.styleIconList1" @finish="textStyleAction" />
      <icon-item-select class="style-item" :data="state.styleIconList2" @finish="textStyleAction" />

      <!-- <div style="flex-wrap: nowrap" class="line-layout style-item">
        <value-select v-model="innerElement.lineHeight" label="行距" suffix="倍" :data="lineHeightList" @finish="(value) => finish('lineHeight', value)" />
        <value-select v-model="innerElement.letterSpacing" label="字距" suffix="%" :data="letterSpacingList" @finish="(value) => finish('letterSpacing', value)" />
      </div> -->
      <!-- <el-collapse-item title="位置尺寸" name="1"> -->
      <div class="style-item slide-wrap">
        <number-slider v-model="state.innerElement.letterSpacing" style="font-size: 14px" label="字距" labelWidth="40px" :step="0.05" :minValue="-state.innerElement.fontSize" :maxValue="state.innerElement.fontSize * 2" @finish="(value) => finish('letterSpacing', value)" />
        <number-slider v-model="state.innerElement.lineHeight" style="font-size: 14px" label="行距" labelWidth="40px" :step="0.05" :minValue="0" :maxValue="2.5" @finish="(value) => finish('lineHeight', value)" />
      </div>
      <!-- </el-collapse-item> -->

      <div style="flex-wrap: nowrap" class="line-layout style-item">
        <color-select v-model="state.innerElement.color" label="颜色" @finish="(value) => finish('color', value)" @enter="saveSelectionBeforeColorChange" @change="saveSelectionBeforeColorChange" />
        <color-select v-model="state.textColorSelectionColor" label="染色颜色" @finish="(value) => saveTextColorSelectionColor(value)" />
        <!-- <color-select v-model="innerElement.backgroundColor" label="背景颜色" @finish="(value) => finish('backgroundColor', value)" /> -->
      </div>
      <icon-item-select class="style-item" :data="layerIconList" @finish="layerAction" />
      <icon-item-select class="style-item" :data="alignIconList" @finish="alignAction" />

      <!-- v-show="!innerElement.editable"  -->
      <div style="margin-top: 10px" class="line-layout style-item">
        <text-input-area v-model="state.innerElement.text" @finish="(value) => finish('text', value)" />
      </div>
      <!-- </el-collapse-item> -->
    </el-collapse>
  </div>
</template>

<script lang="ts" setup>
// 文本组件样式
const NAME = 'w-text-style'
import { defineComponent, reactive, toRefs, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { styleIconList1, styleIconList2, alignIconList, TStyleIconData, TStyleIconData2 } from '@/assets/data/TextIconsData'
import layerIconList from '@/assets/data/LayerIconList'
import numberInput from '../../settings/numberInput.vue'
import numberSlider from '../../settings/numberSlider.vue'
import colorSelect from '../../settings/colorSelect.vue'
import iconItemSelect, { TIconItemSelectData } from '../../settings/iconItemSelect.vue'
import textInputArea from '../../settings/textInputArea.vue'
import valueSelect from '../../settings/valueSelect.vue'
import { useFontStore } from '@/common/methods/fonts'
import usePageFontsFilter from './pageFontsFilter'
import { wTextSetting, TwTextData } from './wTextSetting'
import { storeToRefs } from 'pinia'
import { useControlStore, useForceStore, useWidgetStore } from '@/store'
import { TUpdateWidgetPayload } from '@/store/design/widget/actions/widget'
import { TUpdateAlignData } from '@/store/design/widget/actions/align'

type TFontItem = {
  id: number | string
  oid: string
  value: string
  url: string
  alias: string
  preview: string
}

type TState = {
  activeNames: string[]
  innerElement: TwTextData
  tag: boolean
  ingoreKeys: string[]
  fontSizeList: number[]
  fontClassList: TFontItem[] // 不能设空字体系统默认字体，因为截图服务的默认字体无法保证一致
  lineHeightList: number[]
  letterSpacingList: number[]
  layerIconList: TIconItemSelectData[]
  styleIconList1: TStyleIconData[]
  styleIconList2: TStyleIconData2[]
  alignIconList: TIconItemSelectData[]
  textColorSelectionColor: string // 染色颜色
}

const widgetStore = useWidgetStore()
const forceStore = useForceStore()
const route = useRoute()
// 从 localStorage 读取染色颜色，如果没有则使用默认红色
const getDefaultTextColorSelectionColor = (): string => {
  const saved = localStorage.getItem('textColorSelectionColor')
  return saved || '#ff0000ff'
}

const state = reactive<TState>({
  activeNames: [],
  innerElement: JSON.parse(JSON.stringify(wTextSetting)),
  tag: false,
  ingoreKeys: ['left', 'top', 'name', 'width', 'height', 'text', 'color', 'backgroundColor'],
  fontSizeList: [12, 14, 24, 26, 28, 30, 36, 48, 60, 72, 96, 108, 120, 140, 180, 200, 250, 300, 400, 500],
  fontClassList: [], // 不能设空字体系统默认字体，因为截图服务的默认字体无法保证一致
  lineHeightList: [1, 1.5, 2],
  letterSpacingList: [0, 10, 25, 50, 75, 100, 200],
  layerIconList,
  styleIconList1,
  styleIconList2,
  alignIconList,
  textColorSelectionColor: getDefaultTextColorSelectionColor(),
})
const dActiveElement = computed(() => widgetStore.dActiveElement)
// const dMoving = computed(() => store.getters.dMoving)
const { dMoving } = storeToRefs(useControlStore())

// const isDraw = computed(() => route.name === 'Draw')

watch(
  () => dActiveElement.value,
  () => {
    change()
  },
  { deep: true },
)

watch(
  () => state.innerElement,
  () => {
    changeValue()
  },
  { deep: true },
)

let timer: boolean | null = null

onMounted(() => {
  change()
  setTimeout(() => {
    loadFonts()
  }, 100)
  // 设置选中监听器
  setupSelectionListener()
  // 从 localStorage 加载染色颜色
  state.textColorSelectionColor = getDefaultTextColorSelectionColor()
})

onUnmounted(() => {
  // 移除选中监听器
  if (selectionChangeListener) {
    document.removeEventListener('selectionchange', selectionChangeListener)
    selectionChangeListener = null
  }
})

function change() {
  if (timer) {
    return
  }
  timer = true
  setTimeout(() => {
    timer = null
  }, 300)
  state.tag = true
  const activeElement = dActiveElement.value
  if (!activeElement) {
    state.innerElement = JSON.parse(JSON.stringify(wTextSetting))
    resetStyleIconSelections()
    return
  }
  state.innerElement = JSON.parse(JSON.stringify(activeElement))
  changeStyleIconList()
}

function changeValue() {
  if (state.tag) {
    state.tag = false
    return
  }
  if (dMoving.value) {
    return
  }
  // TODO 修改数值
  for (let key in state.innerElement) {
    const itemKey = key as keyof TwTextData
    if (state.ingoreKeys.indexOf(itemKey) !== -1) {
      ;(dActiveElement.value as Record<string, any>)[itemKey] = state.innerElement[itemKey]
    } else if (key !== 'setting' && key !== 'record' && state.innerElement[itemKey] !== (dActiveElement.value as Record<string, any>)[itemKey]) {
      widgetStore.updateWidgetData({
        uuid: dActiveElement.value?.uuid || '',
        key: key as TUpdateWidgetPayload['key'],
        value: state.innerElement[itemKey],
      })
    }
  }
}


function loadFonts() {
  const localFonts = useFontStore.list
  const uniqueFonts: TFontItem[] = []
  const seen = new Set<number | string>()

  function appendFont(item?: Partial<TFontItem>) {
    if (!item || item.id === undefined) {
      return
    }
    if (seen.has(item.id)) {
      return
    }
    seen.add(item.id)
    uniqueFonts.push(item as TFontItem)
  }

  const pageFonts = usePageFontsFilter()
  pageFonts.forEach((font) => appendFont(font))

  for (const font of localFonts) {
    const { id, oid, value, url, alias, preview } = font
    appendFont({ id, oid, value, url, alias, preview })
  }

  state.fontClassList = uniqueFonts
}

// 保存选中范围的全局变量
let savedSelectionRange: Range | null = null
let savedSelectionElement: HTMLElement | null = null
let savedSelectionText: string = ''
let savedStartOffset: number = 0
let savedEndOffset: number = 0
let selectionChangeListener: (() => void) | null = null

// 从保存的信息恢复选中状态
function restoreSelectionFromSavedInfo(textElement: HTMLElement): Range | null {
  if (!savedSelectionText || savedStartOffset === savedEndOffset) {
    return null
  }
  
  try {
    // 获取元素的纯文本内容
    const textContent = textElement.textContent || ''
    
    // 如果保存的偏移量超出范围，返回 null
    if (savedStartOffset > textContent.length || savedEndOffset > textContent.length) {
      return null
    }
    
    // 创建新的范围
    const range = document.createRange()
    const walker = document.createTreeWalker(
      textElement,
      NodeFilter.SHOW_TEXT,
      null
    )
    
    let currentOffset = 0
    let startNode: Node | null = null
    let startOffset = 0
    let endNode: Node | null = null
    let endOffset = 0
    
    let node: Node | null
    while ((node = walker.nextNode())) {
      const nodeLength = node.textContent?.length || 0
      const nodeStart = currentOffset
      const nodeEnd = currentOffset + nodeLength
      
      // 查找起始位置
      if (!startNode && savedStartOffset >= nodeStart && savedStartOffset <= nodeEnd) {
        startNode = node
        startOffset = savedStartOffset - nodeStart
      }
      
      // 查找结束位置
      if (!endNode && savedEndOffset >= nodeStart && savedEndOffset <= nodeEnd) {
        endNode = node
        endOffset = savedEndOffset - nodeStart
      }
      
      if (startNode && endNode) {
        break
      }
      
      currentOffset = nodeEnd
    }
    
    if (startNode && endNode) {
      range.setStart(startNode, startOffset)
      range.setEnd(endNode, endOffset)
      return range
    }
  } catch (e) {
    console.error('恢复选中状态失败:', e)
  }
  
  return null
}

// 直接操作 DOM 来应用颜色到选中文本
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
      console.log('使用 surroundContents 成功')
    } catch (e) {
      // 如果 surroundContents 失败（比如选中内容跨越了多个节点），使用另一种方法
      console.log('surroundContents 失败，使用 extractContents:', e)
      
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

// 保存选中状态的辅助函数
function saveSelectionForElement(textElement: HTMLElement) {
  // 保存原始 contenteditable 状态
  const wasEditable = textElement.contentEditable === 'true'
  const originalContentEditable = textElement.contentEditable
  
  // 临时设置为可编辑，以便能够获取选中状态
  let needRestore = false
  if (!wasEditable) {
    textElement.contentEditable = 'true'
    needRestore = true
  }
  
  const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const isInElement = textElement.contains(range.commonAncestorContainer)
      if (!range.collapsed && isInElement) {
        // 保存选中文本和位置信息，以便在选中状态丢失时恢复
        const newSelectionText = range.toString()
        
        // 计算选中文本在元素中的位置
        const preRange = document.createRange()
        preRange.selectNodeContents(textElement)
        preRange.setEnd(range.startContainer, range.startOffset)
        const newStartOffset = preRange.toString().length
        const newEndOffset = newStartOffset + newSelectionText.length
        
        // 只在状态真正改变时才更新和输出日志
        const stateChanged = 
          savedSelectionText !== newSelectionText ||
          savedStartOffset !== newStartOffset ||
          savedEndOffset !== newEndOffset ||
          savedSelectionElement !== textElement
        
        if (stateChanged) {
          // 保存选中范围
          savedSelectionRange = range.cloneRange()
          savedSelectionElement = textElement
          savedSelectionText = newSelectionText
          savedStartOffset = newStartOffset
          savedEndOffset = newEndOffset
          
          console.log('保存选中状态:', {
            text: savedSelectionText,
            start: savedStartOffset,
            end: savedEndOffset,
            wasEditable
          })
        }
      } else {
      // 如果没有选中文本，但元素匹配，不清除之前保存的状态
      // 只有在元素不匹配时才清除
      if (savedSelectionElement !== textElement) {
        savedSelectionRange = null
        savedSelectionElement = null
        savedSelectionText = ''
        savedStartOffset = 0
        savedEndOffset = 0
      }
    }
  } else {
    // 如果没有选中状态，但元素匹配，不清除之前保存的状态
    // 只有在元素不匹配时才清除
    if (savedSelectionElement !== textElement) {
      savedSelectionRange = null
      savedSelectionElement = null
      savedSelectionText = ''
      savedStartOffset = 0
      savedEndOffset = 0
    }
  }
  
  // 恢复原始 contenteditable 状态
  if (needRestore) {
    textElement.contentEditable = originalContentEditable
  }
}

// 在颜色改变前保存选中状态
function saveSelectionBeforeColorChange() {
  const uuid = dActiveElement.value?.uuid
  if (uuid) {
    // 使用属性选择器，避免 UUID 以数字开头时选择器无效的问题
    const selector = `[id="${uuid}"] .edit-text`
    const textElement = document.querySelector(selector) as HTMLElement
    
    if (textElement) {
      // 检查当前是否有选中状态
      const selection = window.getSelection()
      const hasCurrentSelection = selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed
      
      // 如果当前有选中状态，保存它
      if (hasCurrentSelection) {
        const range = selection!.getRangeAt(0)
        const isInElement = textElement.contains(range.commonAncestorContainer)
        if (isInElement) {
          // 立即保存选中状态
          saveSelectionForElement(textElement)
          return
        }
      }
      
      // 如果当前没有选中状态，但之前保存了选中状态且元素匹配，保留之前保存的状态
      if (savedSelectionElement === textElement && savedSelectionText) {
        console.log('当前没有选中状态，但保留了之前保存的选中状态:', savedSelectionText)
        return
      }
      
      // 否则，尝试保存当前状态（可能为空）
      saveSelectionForElement(textElement)
    }
  }
}

// 设置全局选中监听器，实时保存选中状态
function setupSelectionListener() {
  // 移除旧的监听器
  if (selectionChangeListener) {
    document.removeEventListener('selectionchange', selectionChangeListener)
    selectionChangeListener = null
  }
  
  // 添加新的监听器
  selectionChangeListener = () => {
    const uuid = dActiveElement.value?.uuid
    if (uuid) {
      const selector = `[id="${uuid}"] .edit-text`
      const textElement = document.querySelector(selector) as HTMLElement
      
      if (textElement) {
        // 检查选中状态是否在文本元素内
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const isInElement = textElement.contains(range.commonAncestorContainer)
          if (!range.collapsed && isInElement) {
            // 实时保存选中状态
            saveSelectionForElement(textElement)
          }
        }
      }
    }
  }
  
  document.addEventListener('selectionchange', selectionChangeListener)
}

function finish(key: string, value: number | Record<string, any> | string) {
  // 如果是颜色选择，检查是否有选中文本
  if (key === 'color' && typeof value === 'string') {
    const uuid = dActiveElement.value?.uuid
    if (uuid) {
      // 通过 DOM 查找对应的文本编辑元素
      // 使用属性选择器，避免 UUID 以数字开头时选择器无效的问题
      const selector = `[id="${uuid}"] .edit-text`
      const textElement = document.querySelector(selector) as HTMLElement
      
      if (textElement) {
        // 如果还没有保存选中状态，尝试现在保存（可能在点击色块时丢失了）
        if (!savedSelectionRange || savedSelectionElement !== textElement) {
          saveSelectionBeforeColorChange()
        }
        
        // 首先尝试使用保存的选中范围
        let rangeToUse: Range | null = null
        let selection = window.getSelection()
        
        console.log('应用颜色前检查:', {
          hasSavedRange: !!savedSelectionRange,
          savedElement: savedSelectionElement === textElement,
          savedText: savedSelectionText,
          currentSelection: selection && selection.rangeCount > 0 ? selection.toString() : null
        })
        
        // 如果有保存的选中范围且元素匹配，使用保存的范围
        if (savedSelectionRange && savedSelectionElement === textElement) {
          // 验证保存的范围是否仍然有效
          try {
            // 尝试克隆范围并验证其有效性
            const clonedRange = savedSelectionRange.cloneRange()
            // 验证范围是否仍然指向有效的 DOM 节点
            const startContainer = clonedRange.startContainer
            const endContainer = clonedRange.endContainer
            // 检查节点是否仍然在文档中
            if (document.contains(startContainer) && document.contains(endContainer)) {
              // 检查范围是否仍然在文本元素内
              if (textElement.contains(startContainer) && textElement.contains(endContainer)) {
                rangeToUse = clonedRange
                console.log('使用保存的选中范围')
              } else {
                throw new Error('范围不在文本元素内')
              }
            } else {
              throw new Error('范围的节点不在文档中')
            }
          } catch (e) {
            // 如果保存的范围无效，尝试使用保存的文本和位置信息恢复
            console.log('保存的范围无效，尝试恢复:', e)
            rangeToUse = restoreSelectionFromSavedInfo(textElement)
            if (rangeToUse) {
              console.log('从保存信息恢复选中状态成功')
            }
          }
        } else if (savedSelectionText && savedSelectionElement === textElement) {
          // 如果保存的范围丢失了，但保存了文本信息，尝试恢复选中状态
          console.log('保存的范围丢失，尝试从文本信息恢复')
          rangeToUse = restoreSelectionFromSavedInfo(textElement)
          if (rangeToUse) {
            console.log('从文本信息恢复选中状态成功')
          }
        } else if (selection && selection.rangeCount > 0) {
          // 否则尝试使用当前的选中范围
          const range = selection.getRangeAt(0)
          const isInElement = textElement.contains(range.commonAncestorContainer)
          if (!range.collapsed && isInElement) {
            rangeToUse = range.cloneRange()
            console.log('使用当前选中范围')
          }
        }
        
        // 如果找到了有效的选中范围，应用颜色
        if (rangeToUse && !rangeToUse.collapsed) {
          // 使用保存的颜色值（已经是 #rrggbbaa 格式）
          const colorValue = value
          
          console.log('准备应用颜色到选中文本:', {
            color: colorValue,
            selectedText: rangeToUse.toString()
          })
          
          // 直接操作 DOM 来应用颜色
          const success = applyColorToSelection(textElement, rangeToUse, colorValue)
          
          if (success) {
            // 更新文本内容
            const newText = textElement.innerHTML
            
            console.log('成功应用颜色到选中文本')
            
            // 在应用颜色后，尝试更新保存的选中状态，使其指向新的 DOM 结构
            // 这样用户就可以继续对同一段文本应用不同的颜色
            try {
              // 尝试从保存的文本信息恢复选中状态（因为 DOM 结构已经改变）
              const updatedRange = restoreSelectionFromSavedInfo(textElement)
              if (updatedRange && !updatedRange.collapsed) {
                // 更新保存的选中范围
                savedSelectionRange = updatedRange.cloneRange()
                savedSelectionElement = textElement
                console.log('更新保存的选中状态成功')
              } else {
                // 如果无法恢复，清除保存的状态
                console.log('无法更新保存的选中状态，清除保存的状态')
                savedSelectionRange = null
                savedSelectionElement = null
                savedSelectionText = ''
                savedStartOffset = 0
                savedEndOffset = 0
              }
            } catch (e) {
              console.error('更新保存的选中状态失败:', e)
              // 如果更新失败，清除保存的状态
              savedSelectionRange = null
              savedSelectionElement = null
              savedSelectionText = ''
              savedStartOffset = 0
              savedEndOffset = 0
            }
            
            widgetStore.updateWidgetData({
              uuid: uuid,
              key: 'text',
              value: newText,
            })
            
            // 选中文本时只更新选中部分的颜色，不更新整体颜色属性
            return
          } else {
            console.log('应用颜色到选中文本失败')
          }
        } else {
          console.log('没有找到有效的选中范围，将更新整个文本的颜色')
        }
      }
    }
    // 如果没有选中文本，继续执行下面的逻辑更新整个文本的颜色
  }
  
  // 更新组件属性（包括颜色、字体等）
  widgetStore.updateWidgetData({
    uuid: dActiveElement.value?.uuid || '',
    key: key as TUpdateWidgetPayload['key'],
    value,
  })
  setTimeout(() => {
    if (key === 'fontClass') {
      // 保存字体选择到 localStorage
      if (value && typeof value === 'object') {
        try {
          localStorage.setItem('lastSelectedFont', JSON.stringify(value))
        } catch (e) {
          console.error('保存字体选择失败:', e)
        }
      }
      // 重新加载字体列表以确保显示最新
      loadFonts()
    }
  }, 300)
}

function layerAction(item: TIconItemSelectData) {
  widgetStore.updateLayerIndex({
    uuid: dActiveElement.value?.uuid || '',
    value: Number(item.value),
  })
  // store.dispatch('updateLayerIndex', {
  //   uuid: dActiveElement.value.uuid,
  //   value: item.value,
  // })
}

async function textStyleAction(item: TIconItemSelectData) {
  if (!dActiveElement.value || !item.key) return
  const innerText = state.innerElement as Record<string, any>
  
  // 对于 textAlign 和 textAlignLast，直接使用 item.value（字符串）
  // 对于其他属性（如 fontWeight, fontStyle），从数组中取值
  let value: string | number | undefined
  if (['textAlign', 'textAlignLast'].includes(item.key)) {
    value = item.value as string
    // 分散对齐判断是否选中，选中时则为抹去属性（设置为 'left' 作为默认值）
    if (item.key === 'textAlignLast' && innerText[item.key] === value) {
      value = 'left' // 使用 'left' 作为默认值，而不是 undefined
    }
  } else {
    // 对于其他属性，从数组中取值
    const valueArray = item.value as number[]
    value = valueArray[item.select ? 1 : 0]
  }
  
  // 设置属性
  if (value !== undefined) {
    innerText[item.key] = value
    // 直接调用 updateWidgetData 确保更改被保存
    widgetStore.updateWidgetData({
      uuid: dActiveElement.value.uuid,
      key: item.key as TUpdateWidgetPayload['key'],
      value: value as TUpdateWidgetPayload['value'],
    })
    
    // 如果是 textAlign，需要更新所有 textAlign 按钮的选中状态
    if (item.key === 'textAlign') {
      // 重置所有 textAlign 按钮的选中状态
      state.styleIconList2.forEach((btn) => {
        if (btn.key === 'textAlign') {
          btn.select = btn.value === value
        }
      })
    }
  }
  
  await nextTick()
  forceStore.setUpdateRect()
}

async function alignAction(item: TIconItemSelectData) {
  if (!dActiveElement.value) return
  widgetStore.updateAlign({
    align: item.value as TUpdateAlignData['align'],
    uuid: dActiveElement.value.uuid,
  })
  await nextTick()
  forceStore.setUpdateRect()
}

// 保存染色颜色到 localStorage
function saveTextColorSelectionColor(color: string) {
  state.textColorSelectionColor = color
  localStorage.setItem('textColorSelectionColor', color)
}

function resetStyleIconSelections() {
  state.styleIconList1.forEach((item) => (item.select = false))
  state.styleIconList2.forEach((item) => (item.select = false))
}

function changeStyleIconList() {
  const innerElement = state.innerElement as Record<string, any> | null
  if (!innerElement) {
    resetStyleIconSelections()
    return
  }
  // 更新 styleIconList1 的选中状态（fontWeight, fontStyle）
  for (let i = 0; i < state.styleIconList1.length; ++i) {
    let key = state.styleIconList1[i].key
    state.styleIconList1[i].select = false
    const [unchecked, checked] = state.styleIconList1[i].value as string[]
    switch (key) {
      case 'fontWeight':
      case 'fontStyle':
        if (innerElement[key as keyof typeof innerElement] !== unchecked && innerElement[key as keyof typeof innerElement] == checked) {
          state.styleIconList1[i].select = true
        }
        break
    }
  }
  // 更新 styleIconList2 的选中状态（textAlign, textAlignLast）
  for (let i = 0; i < state.styleIconList2.length; i++) {
    let key = state.styleIconList2[i].key
    state.styleIconList2[i].select = false
    if (['textAlign', 'textAlignLast'].includes(key || '')) {
      const currentValue = innerElement[key as keyof typeof innerElement]
      const buttonValue = state.styleIconList2[i].value
      // 严格比较值，确保类型一致
      if (currentValue === buttonValue) {
        state.styleIconList2[i].select = true
      }
    }
  }
}

defineExpose({
  textStyleAction,
  finish,
  layerAction,
  alignAction,
})
</script>

<style lang="less" scoped>
#w-text-style {
  height: 100%;
  width: 100%;
}
.line-layout {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
}
.style-item {
  margin-bottom: 12px;
}
.font-setting-row {
  flex-wrap: nowrap;
  gap: 8px;
  align-items: flex-end;
  justify-content: flex-start;
}
.font-setting-row :deep(.font-name-select.value-select) {
  flex: 1 1 70%;
  min-width: 0;
  width: auto;
}
.font-setting-row :deep(.font-name-select .input-wrap) {
  width: 100%;
}
.font-setting-row :deep(.font-size-select.value-select) {
  flex: 0 0 80px;
  width: 80px;
}
.font-setting-row :deep(.font-size-select .input-wrap) {
  width: 100%;
}
.setting-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
}

.slide-wrap {
  width: 100%;
  padding: 16px;
  background: #f3f5f7;
  border-radius: 6px;
}

// 确保图层按钮（包括置顶按钮）可见
:deep(.icon-item-select) {
  width: 100% !important;
  
  .btn__bar {
    background: #f3f5f7 !important;
    opacity: 1 !important;
    visibility: visible !important;
    display: flex !important;
    align-items: center !important;
    list-style: none !important;
    padding: 0 12px !important;
    height: 40px !important;
    border-radius: 6px !important;
    margin-bottom: 12px !important;
  }
  
  .list-item {
    color: #444950 !important;
    opacity: 1 !important;
    visibility: visible !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 32px !important;
    height: 32px !important;
    min-width: 32px !important;
    min-height: 32px !important;
    cursor: pointer !important;
    list-style: none !important;
    position: relative !important;
    
    i {
      opacity: 1 !important;
      visibility: visible !important;
      color: #444950 !important;
      display: inline-block !important;
      font-size: 21px !important;
      line-height: 1 !important;
      font-style: normal !important;
    }
    
    &:hover {
      background-color: #e3e4e5 !important;
      border-radius: 7px !important;
    }
  }
  
  .list-item.active {
    color: @main-color !important;
    font-weight: bold !important;
    
    i {
      color: @main-color !important;
    }
  }
  
  // 确保 tooltip 包裹的元素也可见
  .item {
    display: inline-block !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
}
</style>
