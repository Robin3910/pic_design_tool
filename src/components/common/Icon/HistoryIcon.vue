<!--
 * @Author: Auto
 * @Date: 2025-01-23
 * @Description: 历史图标组件
-->
<template>
  <svg
    class="history-icon"
    :class="customClass"
    :style="customStyle"
    viewBox="0 0 1060 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    fill="none"
  >
    <path
      d="M515.762599 958.870845c246.966761 0 447.17029-200.203529 447.17029-447.170289 0-246.966761-200.203529-447.17029-447.17029-447.17029-246.966761 0-447.17029 200.203529-447.170289 447.17029 0 246.966761 200.203529 447.17029 447.170289 447.170289z m0 63.88147c-282.251292 0-511.051759-228.800468-511.051759-511.051759 0-282.251292 228.800468-511.051759 511.051759-511.05176 282.238815 0 511.051759 228.800468 511.05176 511.05176 0 282.251292-228.800468 511.051759-511.05176 511.051759z m0 0"
      :fill="color"
    />
    <path
      d="M547.703334 192.293206c0-17.642265-14.29847-31.940735-31.940735-31.940735s-31.940735 14.29847-31.940735 31.940735v343.362901c0 9.195438 3.955161 17.954187 10.85486 24.017935l191.644409 167.688859c13.262891 11.640901 33.462911 10.318355 45.103812-2.93206 11.640901-13.262891 10.318355-33.462911-2.93206-45.103811L547.703334 521.158008V192.293206z m0 0"
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
.history-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>

