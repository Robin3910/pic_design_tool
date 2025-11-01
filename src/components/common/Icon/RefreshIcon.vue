<!--
 * @Author: Auto
 * @Date: 2025-01-23
 * @Description: 刷新图标组件
-->
<template>
  <svg
    class="refresh-icon"
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
      d="M943.662794 656.108172a58.471645 58.471645 0 1 0 58.471644 58.471645 58.471645 58.471645 0 0 0-58.471644-58.471645z"
      :fill="color"
      opacity=".3"
    />
    <path
      d="M875.915194 0a46.214133 46.214133 0 0 0-46.048491 46.048491v231.898874a46.048491 46.048491 0 1 0 92.096982 0v-231.898874A46.214133 46.214133 0 0 0 875.915194 0z"
      :fill="color"
    />
    <path
      d="M875.915194 231.898874h-231.898874a46.048491 46.048491 0 0 0 0 92.096982h231.898874a46.048491 46.048491 0 1 0 0-92.096982z"
      :fill="color"
    />
    <path
      d="M508.852405 1023.999172a490.631761 490.631761 0 0 1-183.697037-35.944326 485.828142 485.828142 0 0 1-6.46004-897.448643 485.828142 485.828142 0 0 1 513.490364 85.636941 41.410513 41.410513 0 0 1-55.324446 61.618844A402.841473 402.841473 0 0 0 136.820353 695.696623a403.007115 403.007115 0 0 0 681.782691 99.385232 41.410513 41.410513 0 1 1 64.6004 52.177246 482.846585 482.846585 0 0 1-374.351039 176.740071z"
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
  size: '16',
  color: '#FF517F',
  customClass: '',
  customStyle: () => ({}),
})
</script>

<style scoped>
.refresh-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>


