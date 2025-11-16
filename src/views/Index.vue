<!--
 * @Author: ShawnPhang
 * @Date: 2023-09-18 17:34:44
 * @Description: 
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastUpdateContent: Support typescript
 * @LastEditTime: 2024-08-12 15:53:20
-->
<template>
  <div id="page-design-index" ref="pageDesignIndex" class="page-design-bg-color">
    <div :style="[state.style, uiZoomStyle]" class="top-nav">
      <div class="top-nav-wrap">
        <div class="top-left">
          <div class="name">{{ state.APP_NAME }}</div>
          <div class="operation">
            <div ref="undoRef" :class="['operation-item', { disable: !undoable }]" @click="undoable ? handleHistory('undo') : ''"><i class="iconfont icon-undo" /></div>
            <div ref="redoRef" :class="['operation-item', { disable: !redoable }]" @click="redoable ? handleHistory('redo') : ''"><i class="iconfont icon-redo" /></div>
          </div>
          <el-divider direction="vertical" />
          <Helper @select="dealWith"> <div class="operation-item"><i class="icon sd-bangzhu" /> <span class="text" >帮助</span></div> </Helper>
          <!-- <el-tooltip effect="dark" :show-after="300" :offset="0" content="标尺" placement="bottom">
            <i style="font-size: 20px" class="icon sd-biaochi operation-item" @click="changeLineGuides" />
          </el-tooltip> -->
          <el-divider direction="vertical" />
          <!-- 全局界面缩放（模拟浏览器缩放） -->
          <div ref="zoomToolbarRef" class="operation">
            <div class="operation-item" @click="uiStore.zoomOut()"><i class="iconfont icon-sub" /></div>
            <div class="operation-item" @click="uiStore.resetZoom()"><span class="text">{{ uiStore.uiZoom }}%</span></div>
            <div class="operation-item" @click="uiStore.zoomIn()"><i class="iconfont icon-add" /></div>
          </div>
        </div>
        <HeaderOptions ref="optionsRef" v-model="state.isContinue" @change="optionsChange">
          <el-button ref="saveButtonRef" size="large" class="primary-btn primary-btn--save" @click="handleSave">保存</el-button>
          <el-button ref="ref4" size="large" class="primary-btn primary-btn--download" @click="dealWith('download')">{{ $t('header.download') }}</el-button>
        </HeaderOptions>
      </div>
    </div>
    <div class="page-design-index-wrap">
      <div :style="uiZoomStyle">
        <widget-panel ref="ref2"></widget-panel>
      </div>
      <design-board class="page-design-wrap" pageDesignCanvasId="page-design-canvas">
        <!-- 用于挡住画布溢出部分，因为使用overflow有bug -->
        <div class="shelter" :style="{ width: Math.floor((dPage.width * dZoom) / 100) + 'px', height: Math.floor((dPage.height * dZoom) / 100) + 'px' }"></div>
        <!-- 提供一个背景图层 -->
        <div class="shelter-bg transparent-bg" :style="{ width: Math.floor((dPage.width * dZoom) / 100) + 'px', height: Math.floor((dPage.height * dZoom) / 100) + 'px' }"></div>
        <!-- 多画板操作组件与缩放控制（跟随画布容器） -->
        <template #bottom>
          <zoom-control ref="zoomControlRef" />
          <multipleBoards />
        </template>
      </design-board>
      <div :style="uiZoomStyle">
        <style-panel ref="ref3"></style-panel>
      </div>
    </div>
    <!-- 标尺 -->
    <line-guides :show="state.showLineGuides" />
    <!-- 右键菜单 -->
    <right-click-menu />
    <!-- 旋转缩放组件 -->
    <Moveable />
    <!-- 遮罩百分比进度条 -->
    <ProgressLoading
      :percent="state.downloadPercent"
      :text="state.downloadText"
      :msg="state.downloadMsg"
      cancelText="取消"
      @cancel="downloadCancel"
      @done="state.downloadPercent = 0"
    />
    <!-- 漫游导航 -->
    <Tour ref="tourRef" :steps="[undoRef, redoRef, saveButtonRef, clearButtonEl, zoomToolbarRef, ref2, ref3, ref4]" />
    <!-- 创建设计 -->
    <createDesign ref="createDesignRef" />
  </div>
</template>

<script lang="ts" setup>
import _config from '../config'
import {
  CSSProperties, computed, nextTick,
  onBeforeUnmount, onMounted, reactive, ref, Ref, watchEffect, isRef
} from 'vue'
import RightClickMenu from '@/components/business/right-click-menu/RcMenu.vue'
import Moveable from '@/components/business/moveable/Moveable.vue'
import designBoard from '@/components/modules/layout/designBoard/index.vue'
import zoomControl from '@/components/modules/layout/zoomControl/index.vue'
import lineGuides from '@/components/modules/layout/lineGuides.vue'
import shortcuts from '@/mixins/shortcuts'
import HeaderOptions from './components/HeaderOptions.vue'
import Helper from './components/Helper.vue'
import ProgressLoading from '@/components/common/ProgressLoading/download.vue'
import { wGroupSetting } from '@/components/modules/widgets/wGroup/groupSetting'
import { storeToRefs } from 'pinia'
import { useCanvasStore, useControlStore, useHistoryStore, useWidgetStore, useGroupStore, useUiStore } from '@/store'
import type { ButtonInstance } from 'element-plus'
import Tour from './components/Tour.vue'
import createDesign from '@/components/business/create-design'
import multipleBoards from '@/components/modules/layout/multipleBoards'
import useHistory from '@/common/hooks/history'
useHistory()

const undoRef = ref<HTMLDivElement | null>(null)
const redoRef = ref<HTMLDivElement | null>(null)
const saveButtonRef = ref<ButtonInstance | null>(null)
const clearButtonEl = ref<HTMLElement | null>(null)
const zoomToolbarRef = ref<HTMLDivElement | null>(null)
const ref2 = ref<ButtonInstance>()
const ref3 = ref<ButtonInstance>()
const ref4 = ref<ButtonInstance>()

type TState = {
  style: CSSProperties
  downloadPercent: number // 下载进度
  downloadText: string
  downloadMsg: string | undefined
  isContinue: boolean
  APP_NAME: string
  showLineGuides: boolean
}

// const {
//   dActiveElement, dCopyElement
// } = useSetupMapGetters(['dActiveElement', 'dCopyElement'])
const widgetStore = useWidgetStore()
const historyStore = useHistoryStore()
const groupStore = useGroupStore()
const { dPage } = storeToRefs(useCanvasStore())
const { dZoom } = storeToRefs(useCanvasStore())
const { dHistoryParams, dHistoryStack } = storeToRefs(useHistoryStore())

const state = reactive<TState>({
  style: {
    left: '0px',
  },
  // openDraw: false,
  downloadPercent: 0, // 下载进度
  downloadText: '',
  downloadMsg: '',
  isContinue: true,
  APP_NAME: _config.APP_NAME,
  showLineGuides: false,
})
type HeaderOptionsExpose = {
  save: () => void
  download: () => void
  load: (cb: () => void) => void
  clearButtonRef?: Ref<HTMLElement | null> | HTMLElement | null
}
const optionsRef = ref<HeaderOptionsExpose | null>(null)
const zoomControlRef = ref<typeof zoomControl | null>(null)
const controlStore = useControlStore()
const createDesignRef: Ref<typeof createDesign | null> = ref(null)
const uiStore = useUiStore()

watchEffect(() => {
  const exposed: Ref<HTMLElement | null> | HTMLElement | null | undefined = optionsRef.value?.clearButtonRef
  if (exposed && isRef(exposed)) {
    clearButtonEl.value = (exposed.value as HTMLElement | null)
    return
  }
  clearButtonEl.value = (exposed as HTMLElement | null | undefined) ?? null
})

// 移除不再使用的 beforeUnload 函数，改用现代浏览器兼容的事件

// 使用现代浏览器兼容的事件监听
if (!_config.isDev) {
  // 使用 pagehide 事件替代 beforeunload（更兼容现代浏览器）
  window.addEventListener('pagehide', (e) => {
    if (dHistoryStack.value.changes.length > 0 && !e.persisted) {
      // 自动保存逻辑
      console.log('页面即将关闭，检测到未保存的更改')
      // 可以在这里添加自动保存到本地存储的逻辑
      try {
        localStorage.setItem('poster_design_autosave', JSON.stringify({
          timestamp: Date.now(),
          changes: dHistoryStack.value.changes
        }))
      } catch (error) {
        console.warn('自动保存失败:', error)
      }
    }
  })
  
  // 使用 visibilitychange 事件作为备用方案
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && dHistoryStack.value.changes.length > 0) {
      console.log('页面隐藏，检测到未保存的更改')
    }
  })
}

const undoable = computed(() => {
  return dHistoryParams.value.stackPointer >= 0
  // return !(
  //   dHistoryParams.value.index === -1 || 
  //   (dHistoryParams.value.index === 0 && dHistoryParams.value.length === dHistoryParams.value.maxLength))
})

const redoable = computed(() => {
  return !(dHistoryParams.value.stackPointer === dHistoryStack.value.changes.length - 1)
})

function zoomSub() {
  if (!zoomControlRef.value) return
  zoomControlRef.value.sub()
}

function zoomAdd() {
  if (!zoomControlRef.value) return
  zoomControlRef.value.add()
}

function save() {
  // 保存功能已注释，依赖后端服务
  // if (!optionsRef.value) return
  // optionsRef.value.save()
  console.log('保存功能已禁用 - 依赖后端服务')
}

function handleSave() {
  // 调用HeaderOptions的save方法上传到OSS
  if (!optionsRef.value) return
  optionsRef.value.save()
}

const { handleKeydowm, handleKeyup, dealCtrl } = shortcuts.methods
let checkCtrl: number | undefined
const instanceFn = { save, zoomAdd, zoomSub }

onMounted(() => {
  groupStore.initGroupJson(JSON.stringify(wGroupSetting))
  // store.dispatch('initGroupJson', JSON.stringify(wGroupSetting))
  // initGroupJson(JSON.stringify(wGroup.setting))
  window.addEventListener('scroll', fixTopBarScroll)
  // window.addEventListener('click', this.clickListener)
  document.addEventListener('keydown', handleKeydowm(controlStore, checkCtrl, instanceFn, dealCtrl), false)
  document.addEventListener('keyup', handleKeyup(controlStore, checkCtrl), false)
  loadData()
  // 恢复 UI 缩放
  try {
    const saved = Number(localStorage.getItem('ui_zoom_percent') || '')
    if (!Number.isNaN(saved) && saved) {
      uiStore.setUiZoom(saved)
    } else {
      // 如果没有保存的值，默认设置为 150%
      uiStore.setUiZoom(150)
    }
  } catch {
    // 如果出错，默认设置为 150%
    uiStore.setUiZoom(150)
  }
  // 绑定浏览器式快捷键：Ctrl + +/-/0
  window.addEventListener('keydown', handleUiZoomKeydown, { passive: false })
  // 绑定 Ctrl + 滚轮（已禁用，只能通过头顶栏按钮缩放）
  // window.addEventListener('wheel', handleUiZoomWheel, { passive: false })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', fixTopBarScroll)
  // window.removeEventListener('click', this.clickListener)
  document.removeEventListener('keydown', handleKeydowm(controlStore, checkCtrl, instanceFn, dealCtrl), false)
  document.removeEventListener('keyup', handleKeyup(controlStore, checkCtrl), false)
  document.oncontextmenu = null
  window.removeEventListener('keydown', handleUiZoomKeydown)
  // window.removeEventListener('wheel', handleUiZoomWheel)
})

function handleHistory(data: "undo" | "redo") {
  historyStore.handleHistory(data)
}

function changeLineGuides() {
  state.showLineGuides = !state.showLineGuides
}

function downloadCancel() {
  state.downloadPercent = 0
  state.isContinue = false
}

function loadData() {
  // 初始化加载页面
  if (!optionsRef.value) return
  optionsRef.value.load(async () => {
    if (!zoomControlRef.value) return
    // await nextTick()
    // zoomControlRef.value.screenChange()
    // 初始化激活的控件为page
    widgetStore.selectWidget({ uuid: '-1' })
  })
}

function fixTopBarScroll() {
  const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
  state.style.left = `-${scrollLeft}px`
}

function optionsChange({ downloadPercent, downloadText, downloadMsg }: { downloadPercent: number, downloadText: string, downloadMsg?: string }) {
  state.downloadPercent = downloadPercent
  state.downloadText = downloadText
  state.downloadMsg = downloadMsg
}

const tourRef = ref<any>()
const fns: any = {
  openTour: () => {
    tourRef.value.open()
  },
  save: () => {
    // 保存功能已注释，依赖后端服务
    // optionsRef.value?.save(false)
    console.log('保存功能已禁用 - 依赖后端服务')
  },
  download: () => {
    optionsRef.value?.download()
  },
  changeLineGuides,
  newDesign: () => {
    createDesignRef.value?.open()
  }
}
const dealWith = (fnName: string, params?: any) => {
  fns[fnName](params)
}

defineExpose({
})

const uiZoomStyle = computed(() => {
  const scale = uiStore.uiZoom / 100
  const supportsZoom = typeof document !== 'undefined' && 'zoom' in (document.body?.style || ({} as any))
  if (supportsZoom) {
    return { zoom: scale } as any
  }
  // 兜底方案：transform 缩放
  const widthPercent = `${100 / scale}%`
  return {
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    width: widthPercent,
  } as any
})

function handleUiZoomKeydown(e: KeyboardEvent) {
  if (!e.ctrlKey && !e.metaKey) return
  // 避免输入框/文本域内拦截
  const target = e.target as HTMLElement | null
  const tag = (target?.tagName || '').toLowerCase()
  const isTyping = tag === 'input' || tag === 'textarea' || (target as any)?.isContentEditable
  if (isTyping) return
  const key = e.key
  if (key === '+' || key === '=' ) {
    e.preventDefault()
    uiStore.zoomIn()
  } else if (key === '-' || key === '_') {
    e.preventDefault()
    uiStore.zoomOut()
  } else if (key === '0') {
    e.preventDefault()
    uiStore.resetZoom()
  }
}

function handleUiZoomWheel(e: WheelEvent) {
  if (!e.altKey) return
  e.preventDefault()
  const delta = e.deltaY
  if (delta > 0) {
    uiStore.zoomOut()
  } else if (delta < 0) {
    uiStore.zoomIn()
  }
}
</script>

<style lang="less" scoped>
@import url('@/assets/styles/design.less');
</style>
