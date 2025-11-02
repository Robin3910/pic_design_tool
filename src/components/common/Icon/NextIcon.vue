<!--
 * @Author: Auto
 * @Date: 2025-01-XX
 * @Description: 下一个图标组件
-->
<template>
  <svg
    class="next-icon"
    :class="customClass"
    :style="customStyle"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
  >
    <path
      d="M910.222222 1024.022756H113.777778a113.891556 113.891556 0 0 1-113.777778-113.777778v-796.444445a113.937067 113.937067 0 0 1 113.777778-113.777777h796.444444a113.959822 113.959822 0 0 1 113.777778 113.777777v796.444445a113.937067 113.937067 0 0 1-113.777778 113.777778zM389.961956 263.418311a40.049778 40.049778 0 0 0-28.194134 10.535822 42.643911 42.643911 0 0 0 0 56.456534l183.432534 183.432533-176.355556 176.355556a42.643911 42.643911 0 0 0 0 56.456533 35.362133 35.362133 0 0 0 56.433778 0l204.549689-204.5952a31.857778 31.857778 0 0 0 15.064177-25.782045 47.399822 47.399822 0 0 0-22.141155-37.728711l-204.5952-204.5952a40.049778 40.049778 0 0 0-28.2624-10.604089z"
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
.next-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>
