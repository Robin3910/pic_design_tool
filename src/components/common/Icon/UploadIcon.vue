<!--
 * @Author: Auto
 * @Date: 2025-01-23
 * @Description: 上传图标组件
-->
<template>
  <svg
    class="upload-icon"
    :class="customClass"
    :style="customStyle"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    fill="none"
  >
    <path
      d="M128 213.333333h768V128H128v85.333333z m426.666667 248.661334l259.029333 259.072 60.330667-60.373334L512 298.666667l-362.026667 362.026666L210.304 721.066667 469.333333 461.994667V896h85.333334V461.994667z"
      :fill="color"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TProps = {
  size?: string | number
  color?: string
  customClass?: string
  customStyle?: Record<string, any>
}

const props = withDefaults(defineProps<TProps>(), {
  size: '200',
  color: '#1B1B1B',
  customClass: '',
  customStyle: () => ({}),
})
</script>

<style scoped>
.upload-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>

