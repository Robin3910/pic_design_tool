<!--
 * @Author: Auto
 * @Date: 2025-01-XX
 * @Description: 上一个图标组件
-->
<template>
  <svg
    class="prev-icon"
    :class="customClass"
    :style="customStyle"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
  >
    <path
      d="M113.800533 0.022756h796.444445a113.914311 113.914311 0 0 1 113.777778 113.777777v796.444445a113.914311 113.914311 0 0 1-113.777778 113.777778h-796.444445a113.914311 113.914311 0 0 1-113.777777-113.777778v-796.444445a113.914311 113.914311 0 0 1 113.777777-113.777777z m513.2288 760.672711a53.020444 53.020444 0 0 0 28.216889-14.108445 42.621156 42.621156 0 0 0 0-56.433778l-176.378311-176.378311 183.432533-183.409777a42.621156 42.621156 0 0 0 0-56.433778 42.894222 42.894222 0 0 0-56.433777 0l-204.5952 204.5952a47.331556 47.331556 0 0 0-22.1184 37.705955 31.857778 31.857778 0 0 0 15.086933 25.782045l204.5952 204.5952a53.953422 53.953422 0 0 0 28.194133 14.085689z"
      :fill="color"
    />
  </svg>
</template>

<script setup lang="ts">
type TProps = {
  size?: string | number
  color?: string
  customClass?: string
  customStyle?: Record<string, any>
}

withDefaults(defineProps<TProps>(), {
  size: '20',
  color: '#A5CFFF',
  customClass: '',
  customStyle: () => ({}),
})
</script>

<style scoped>
.prev-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>
