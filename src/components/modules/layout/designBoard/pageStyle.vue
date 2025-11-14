<template>
  <div id="page-style">
    <el-collapse v-model="state.activeNames">
      <el-collapse-item title="背景设置" name="2">
        <div class="color__box">
          <div v-for="c in state.colors" :key="c" :style="{ background: c }" class="color__item" @click="setBGcolor(c)"></div>
        </div>
        <color-select v-model="state.innerElement.backgroundColor" :modes="['纯色', '渐变']" @change="colorChange" />
      </el-collapse-item>
      <el-collapse-item title="画布尺寸" name="1">
        <sizeEditor :params="state.innerElement">
          <i @click="openSizeEdit" class="icon sd-edit"></i>
        </sizeEditor>
      </el-collapse-item>
    </el-collapse>
    <createDesign ref="sizeEditRef" :params="state.innerElement" />
  </div>
</template>

<script lang="ts" setup>
// 画布组件样式
// const NAME = 'page-style'
import { onMounted, reactive, watch, ref, Ref } from 'vue'
import colorSelect, { colorChangeData } from '@/components/modules/settings/colorSelect.vue'
import { useCanvasStore, useWidgetStore } from '@/store'
import { TPageState } from '@/store/design/canvas/d'
import { storeToRefs } from 'pinia'
import sizeEditor from '@/components/business/create-design/sizeEditor.vue'
import createDesign from '@/components/business/create-design'

type TState = {
  activeNames: string[]
  innerElement: Record<string, any>
  tag: boolean
  ingoreKeys: string[]
  colors: string[]
}

const pageStore = useCanvasStore()
const widgetStore = useWidgetStore()
const state = reactive<TState>({
  activeNames: ['1', '2', '3', '4'],
  innerElement: {},
  tag: false,
  ingoreKeys: ['backgroundColor', 'name', 'width', 'height'],
  colors: ['#000000ff', '#999999ff', '#CCCCCCff', '#FFFFFFff', '#E65353ff', '#FFD835ff', '#70BC59ff', '#607AF4ff'],
})
const sizeEditRef: Ref<typeof createDesign | null> = ref(null)
// const { dActiveElement } = useSetupMapGetters(['dActiveElement'])
const { dActiveElement } = storeToRefs(widgetStore)

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

onMounted(() => {
  change()
})

function colorChange(e: colorChangeData) {
  if (e.mode === '渐变') {
    state.innerElement.backgroundGradient = e.color
  } else state.innerElement.backgroundGradient = ''
}

function setBGcolor(color: string) {
  pageStore.updatePageData({
    key: "backgroundImage",
    value: ''
  })
  state.innerElement.backgroundColor = color
  state.innerElement.backgroundGradient = ''
  changeValue()
}
function change() {
  state.tag = true
  state.innerElement = dActiveElement.value || {}
}
function changeValue() {
  if (state.tag) {
    state.tag = false
    return
  }
  for (let key in state.innerElement) {
    if (state.innerElement[key] !== (dActiveElement.value as Record<string, any>)[key]) {
      if (state.ingoreKeys.indexOf(key) !== -1) {
        ;(dActiveElement.value as Record<string, any>)[key] = state.innerElement[key]
      } else {
        pageStore.updatePageData({
          key: key as keyof TPageState,
          value: state.innerElement[key],
        })
      }
    }
  }
}

// 打开
function openSizeEdit() {
  sizeEditRef.value?.open()
}
</script>

<style lang="less" scoped>
#page-style {
  height: 100%;
  width: 100%;
  .sd-edit {
    cursor: pointer;
    color: #666666;
    font-size: 22px;
  }
  .sd-edit:hover {
    color: #333333;
    transform: scale(1.2);
  }
  .color {
    &__box {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    &__item {
      border: 1px solid rgba(0, 0, 0, 0.08);
      margin: 2.8px;
      width: 43px;
      height: 36px;
      border-radius: 2px;
      cursor: pointer;
    }
  }
}
</style>
