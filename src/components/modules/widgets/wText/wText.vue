<template>
  <div
    :id="`${params.uuid}`"
    ref="widget"
    v-loading="state.loading"
    :class="['w-text', { editing: state.editable, 'layer-lock': params.lock, 'layer-top': params.isTop }, params.uuid]"
    data-type="w-text"
    :data-uuid="params.uuid"
    :style="{
      position: 'absolute',
      left: params.left - parent.left + 'px',
      top: params.top - parent.top + 'px',
      width: params.width + 'px',
      minWidth: params.fontSize + 'px',
      minHeight: params.fontSize * params.lineHeight + 'px',
      height: params.height + 'px',
      lineHeight: params.fontSize * params.lineHeight + 'px',
      letterSpacing: (params.fontSize * params.letterSpacing) / 100 + 'px',
      fontSize: params.fontSize + 'px',
      color: params.color,
      textAlign: params.textAlign,
      textAlignLast: params.textAlignLast,
      fontWeight: params.fontWeight,
      fontStyle: params.fontStyle,
      textDecoration: params.textDecoration,
      opacity: params.opacity,
      backgroundColor: params.backgroundColor,
      writingMode: params.writingMode,
      fontFamily: `'${params.fontClass.value}'`,
    }"
    @dblclick="(e) => dblclickText(e)"
  >
    <div ref="editWrap" :style="{ fontFamily: `'${params.fontClass.value}'` }" class="edit-text" spellcheck="false" :contenteditable="state.editable ? 'true' : false" @input="writingText($event)" @blur="writeDone($event)" @paste="handlePaste($event)" v-html="params.text"></div>
  </div>
</template>

<script lang="ts" setup>
// 文本组件
// const NAME = 'w-text'

import { reactive, toRefs, computed, onUpdated, watch, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fontMinWithDraw } from '@/utils/widgets/loadFontRule'
import { wTextSetting } from './wTextSetting'
import { useForceStore, useHistoryStore, useWidgetStore } from '@/store'

export type TwTextParams = {
  rotate?: number
  lock?: boolean
  width?: number
  height?: number
} & typeof wTextSetting

type TProps = {
  params: TwTextParams
  parent: {
    left: number
    top: number
  }
}

const props = defineProps<TProps>()
const widgetStore = useWidgetStore()
const forceStore = useForceStore()
const historyStore = useHistoryStore()
const route = useRoute()
const state = reactive({
  loading: false,
  editable: false,
  loadFontDone: '',
})
const widget = ref<HTMLElement | null>(null)
const editWrap = ref<HTMLElement | null>(null)

const dActiveElement = computed(() => widgetStore.dActiveElement)
const isDraw = computed(() => route.name === 'Draw')

onUpdated(() => {
  updateRecord()
})

onMounted(() => {
  updateRecord()

  if (!widget.value) return
  props.params.transform && (widget.value.style.transform = props.params.transform)
  props.params.rotate && (widget.value.style.transform += `translate(0px, 0px) rotate(${props.params.rotate}) scale(1, 1)`)
  // store.commit('updateRect')
})

watch(
  () => props.params,
  async (nval) => {
    updateText()
    if (state.loading) {
      return
    }
    let font = nval.fontClass
    const isDone = font.value === state.loadFontDone

    if (font.url && !isDone) {
      if (font.id && isDraw.value) {
        state.loading = false
      }
      if (fontMinWithDraw) {
        return
      }
      state.loading = !isDraw.value
      const loadFont = new window.FontFace(font.value, `url(${font.url})`)
      await loadFont.load()
      document.fonts.add(loadFont)
      state.loadFontDone = font.value
      state.loading = false
    } else {
      state.loading = false
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => state.editable,
  (value) => {
    widgetStore.updateWidgetData({
      uuid: String(props.params.uuid),
      key: 'editable',
      value,
    })
  },
)

function updateRecord() {
  if (!widget.value) return
  if (dActiveElement.value && dActiveElement.value.uuid === String(props.params.uuid)) {
    let record = dActiveElement.value.record
    // 使用 editWrap 的宽度，如果不存在则使用 widget 的宽度
    // 避免在 width 为 0 时获取到错误的 offsetWidth
    const el = editWrap.value || widget.value
    if (el) {
      const newWidth = el.offsetWidth
      const newHeight = el.offsetHeight
      // 只有当宽度合理时才更新（大于 0 且小于画布宽度的 10 倍，避免获取到父容器的宽度）
      const maxReasonableWidth = (dActiveElement.value as any).parent?.width || 10000
      if (newWidth > 0 && newWidth < maxReasonableWidth * 10) {
        record.width = newWidth
      }
      if (newHeight > 0) {
        record.height = newHeight
      }
    }
    record.minWidth = props.params.fontSize
    record.minHeight = props.params.fontSize * props.params.lineHeight
    writingText()
  }
}

function updateText(e?: Event) {
  const value = e && e.target ? (e.target as HTMLElement).innerHTML : props.params.text //.replace(/\n/g, '<br/>')
  if (value !== props.params.text) {
    widgetStore.updateWidgetData({
      uuid: String(props.params.uuid),
      key: 'text',
      value,
    })
  }
}

function writingText(e?: Event) {
  // updateText(e)
  // TODO: 修正文字选框高度
  const el = editWrap.value || widget.value
  if (!el) return
  const newWidth = el.scrollWidth
  const newHeight = el.offsetHeight
  // 输入时同步更新宽高，尽量保持单行不自动换行（宽度随内容扩展）
  widgetStore.updateWidgetMultiple({
    uuid: String(props.params.uuid),
    data: [
      {
        key: 'width',
        value: newWidth,
      },
      {
        key: 'height',
        value: newHeight,
      },
    ],
  })
  forceStore.setUpdateRect()
  // store.commit('updateRect')
}

function writeDone(e: Event) {
  state.editable = false
  updateText(e)
}

function dblclickText(_: MouseEvent) {
  if (state.editable) return
  state.editable = true
  const el = editWrap.value || widget.value
  setTimeout(() => {
    if (!el) return
    el.focus()
    if (document.selection) {
      const range = document.body.createTextRange()
      range.moveToElementText(el)
      range.select()
    } else {
      const range = document.createRange()
      range.selectNodeContents(el)
      window.getSelection()?.removeAllRanges()
      window.getSelection()?.addRange(range)
    }
  }, 100)
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const el = editWrap.value
  if (!el) return
  
  // 获取粘贴的纯文本内容
  const text = e.clipboardData?.getData('text/plain') || ''
  
  // 获取当前选中的范围
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  
  const range = selection.getRangeAt(0)
  
  // 删除选中的内容
  range.deleteContents()
  
  // 创建文本节点并插入
  const textNode = document.createTextNode(text)
  range.insertNode(textNode)
  
  // 移动光标到插入文本的末尾
  range.setStartAfter(textNode)
  range.setEndAfter(textNode)
  selection.removeAllRanges()
  selection.addRange(range)
  
  // 触发 input 事件以更新文本
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

defineExpose({
  updateRecord,
  writingText,
  updateText,
  writeDone,
  dblclickText,
  widget,
  editWrap,
})
</script>

<style lang="less" scoped>
.w-text {
  // cursor: pointer;
  user-select: none;
}
.w-text.editing {
  cursor: text;
  user-select: text;
}
.edit-text {
  display: inline-block;
  padding: 0 4px;
  outline: none;
  /* 默认单行显示，避免自动换行；需要多行时用户可以手动调整高度或回车 */
  white-space: nowrap;
  word-break: normal;
  margin: 0;
}
</style>
