<template>
  <div
    ref="widget"
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
      fontWeight: params.fontWeight,
      fontStyle: params.fontStyle,
      textDecoration: params.textDecoration,
      opacity: params.opacity,
      backgroundColor: params.backgroundColor,
      writingMode: params.writingMode,
      fontFamily: `'${params.fontClass.value}'`,
    }"
  >
    <div
      :style="{ fontFamily: `'${params.fontClass.value}'` }"
      class="edit-text" spellcheck="false" 
      v-html="params.text"></div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, onMounted, ref } from 'vue'
import { wTextSetting } from './wTextSetting'

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
const widget = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!widget.value) return
  props.params.transform && (widget.value.style.transform = props.params.transform)
  props.params.rotate && (widget.value.style.transform += `translate(0px, 0px) rotate(${props.params.rotate}) scale(1, 1)`)
})

defineExpose({
  widget,
})
</script>

<style lang="less" scoped>
.edit-text {
  outline: none;
  word-break: break-word;
  white-space: pre-wrap;
  margin: 0;
}
</style>
