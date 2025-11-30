<template>
  <div id="style-panel">
    <!-- 图层区域 - 上方 -->
    <div class="layer-wrap">
      <div class="layer-header">
        <span class="layer-title">图层</span>
        <el-button
          ref="clearButtonRef"
          size="small"
          class="clear-materials-btn"
          @click="handleClearMaterials"
        >
          清除素材
        </el-button>
      </div>
      <div class="layer-content">
        <layer-list :data="dWidgets" @change="layerChange" />
      </div>
    </div>
    <!-- 分割线 -->
    <div class="divider"></div>
    <!-- 设置区域 - 下方 -->
    <div class="style-wrap">
      <div class="style-content">
        <div v-if="showGroupCombined" class="multi-select-tools">
          <el-button plain type="primary" class="gounp__btn" @click="handleCombine">成组</el-button>
          <icon-item-select label="" :data="iconList" @finish="alignAction" />
        </div>
        <div v-else class="tool-pages">
          <div class="tool-pages__tabs">
            <button
              v-for="tool in styleToolList"
              :key="tool.componentName"
              class="tool-pages__tab"
              :class="{ 'tool-pages__tab--active': activeToolKey === tool.componentName }"
              @click="handleToolTabChange(tool.componentName)"
            >
              {{ tool.label }}
            </button>
          </div>
          <div class="tool-pages__list">
            <div v-if="activeTool" class="tool-card">
              <div class="tool-card__header">
                <span class="tool-card__title">{{ activeTool.label }}</span>
              </div>
              <component :is="activeTool.componentName" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="floating-preview-toggle">
      <div class="toggle-switch" @click="toggleFloatingPreview">
        <span class="toggle-label">预览窗</span>
        <div class="toggle-container" :class="{ 'toggle-active': showFloatingPreview }">
          <div class="toggle-thumb"></div>
        </div>
      </div>
    </div>
    <teleport to="body" v-if="showFloatingPreview">
      <div
        class="floating-preview"
        :class="{ 'floating-preview--dragging': dragState.isDragging }"
        :style="{
          top: `${floatingPreviewPosition.top}px`,
          left: `${floatingPreviewPosition.left}px`,
          width: `${floatingPreviewSize.width}px`,
          height: `${floatingPreviewSize.height}px`
        }"
        ref="floatingPreviewRef"
        @mousedown.stop.prevent="handlePreviewMouseDown"
        @click.stop="handlePreviewClick"
      >
        <div class="floating-preview__body">
          <img 
            v-if="previewImageUrl" 
            :src="previewImageUrl" 
            alt="预览图"
            @error="handleImageError"
            class="floating-preview__img"
          />
          <div v-else class="preview-placeholder">
            <i class="el-icon-picture"></i>
            <p>暂无预览图</p>
          </div>
          </div>
        <div class="floating-preview__resize-handle" @mousedown.stop.prevent="handleResizeMouseDown">
          <span></span>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
// 样式设置面板
// const NAME = 'style-panel'
import alignIconList, { AlignListData } from '@/assets/data/AlignListData'
import iconItemSelect, { TIconItemSelectData } from '../settings/iconItemSelect.vue'
import layerList from './components/layerList.vue'
import { ref, watch, computed, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
// import { useSetupMapGetters } from '@/common/hooks/mapGetters';
import { useControlStore, useGroupStore, useHistoryStore, useWidgetStore, useCanvasStore } from '@/store';
import { storeToRefs } from 'pinia';
import { TdWidgetData } from '@/store/design/widget';
import type { TUpdateAlignData } from '@/store/design/widget/actions/align'
import eventBus from '@/utils/plugins/eventBus'

const widgetStore = useWidgetStore()
const controlStore = useControlStore()
const groupStore = useGroupStore()
const historyStore = useHistoryStore()
const pageStore = useCanvasStore()

// 从 store 获取预览图 URL
const previewImageUrl = computed(() => controlStore.previewImageUrl)

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const iconList = ref<AlignListData[]>(alignIconList)
const showGroupCombined = ref(false)
const clearButtonRef = ref<HTMLElement | null>(null)
const floatingPreviewRef = ref<HTMLElement | null>(null)

const defaultPreviewPosition = { top: 220, left: 0 }
const defaultPreviewSize = { width: 220, height: 180 }
const PREVIEW_STATE_STORAGE_KEY = 'floatingPreviewState'

type FloatingPreviewPersistState = {
  visible: boolean
  position: typeof defaultPreviewPosition
  size: typeof defaultPreviewSize
  contentUrl: string | null
}

const getDefaultPreviewState = (): FloatingPreviewPersistState => ({
  visible: false,
  position: { ...defaultPreviewPosition },
  size: { ...defaultPreviewSize },
  contentUrl: null,
})

const safeNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const loadFloatingPreviewState = (): { state: FloatingPreviewPersistState; fromStorage: boolean } => {
  try {
    const stored = localStorage.getItem(PREVIEW_STATE_STORAGE_KEY)
    if (!stored) return { state: getDefaultPreviewState(), fromStorage: false }
    const parsed = JSON.parse(stored)
    const defaults = getDefaultPreviewState()
    const state: FloatingPreviewPersistState = {
      visible: typeof parsed.visible === 'boolean' ? parsed.visible : defaults.visible,
      position: {
        top: safeNumber(parsed?.position?.top, defaults.position.top),
        left: safeNumber(parsed?.position?.left, defaults.position.left),
      },
      size: {
        width: safeNumber(parsed?.size?.width, defaults.size.width),
        height: safeNumber(parsed?.size?.height, defaults.size.height),
      },
      contentUrl: typeof parsed.contentUrl === 'string' ? parsed.contentUrl : defaults.contentUrl,
    }
    return { state, fromStorage: true }
  } catch (error) {
    console.warn('加载预览窗状态失败:', error)
    return { state: getDefaultPreviewState(), fromStorage: false }
  }
}

const persistFloatingPreviewState = () => {
  try {
    const payload: FloatingPreviewPersistState = {
      visible: showFloatingPreview.value,
      position: { ...floatingPreviewPosition.value },
      size: { ...floatingPreviewSize.value },
      contentUrl: previewImageUrl.value ?? null,
    }
    localStorage.setItem(PREVIEW_STATE_STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.warn('保存预览窗状态失败:', error)
  }
}

const storedPreviewState = loadFloatingPreviewState()
const floatingPreviewPosition = ref({ ...storedPreviewState.state.position })
const floatingPreviewSize = ref({ ...storedPreviewState.state.size })
const showFloatingPreview = ref(storedPreviewState.state.visible)

if (storedPreviewState.state.contentUrl) {
  controlStore.setPreviewImageUrl(storedPreviewState.state.contentUrl)
}
const dragState = reactive({
  isDragging: false,
  offsetX: 0,
  offsetY: 0,
  hasMoved: false,
})
const resizeState = reactive({
  isResizing: false,
  startX: 0,
  startY: 0,
  startWidth: 0,
  startHeight: 0,
})

type StyleToolItem = {
  label: string
  componentName: string
}

const hiddenToolKeys = new Set(['w-svg-style', 'w-qrcode-style', 'w-group-style'])
const styleToolList = ref<StyleToolItem[]>(
  [
    { label: '画布设置', componentName: 'page-style' },
    { label: '文本样式', componentName: 'w-text-style' },
    { label: '图片样式', componentName: 'w-image-style' },
    { label: 'SVG 样式', componentName: 'w-svg-style' },
    { label: '二维码样式', componentName: 'w-qrcode-style' },
    { label: '组合样式', componentName: 'w-group-style' },
  ].filter((tool) => !hiddenToolKeys.has(tool.componentName))
)
const activeToolKey = ref(styleToolList.value[0]?.componentName ?? '')
const activeTool = computed(() => styleToolList.value.find((tool) => tool.componentName === activeToolKey.value))

const VIEWPORT_PADDING = 16
const MIN_PREVIEW_WIDTH = 160
const MIN_PREVIEW_HEIGHT = 120

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

async function setInitialFloatingPreviewPosition() {
  await nextTick()
  const panelEl = document.getElementById('style-panel')
  const previewEl = floatingPreviewRef.value
  if (!panelEl || !previewEl) return
  const panelRect = panelEl.getBoundingClientRect()
  const previewRect = previewEl.getBoundingClientRect()
  floatingPreviewPosition.value = {
    top: panelRect.top + 220,
    left: panelRect.left - previewRect.width - VIEWPORT_PADDING,
  }
  keepPreviewInViewport()
}

function keepPreviewInViewport() {
  const previewEl = floatingPreviewRef.value
  const previewWidth = previewEl?.offsetWidth ?? floatingPreviewSize.value.width
  const previewHeight = previewEl?.offsetHeight ?? floatingPreviewSize.value.height
  const maxLeft = window.innerWidth - previewWidth - VIEWPORT_PADDING
  const maxTop = window.innerHeight - previewHeight - VIEWPORT_PADDING
  const minLeft = VIEWPORT_PADDING
  const minTop = VIEWPORT_PADDING
  const nextLeft = clamp(floatingPreviewPosition.value.left, minLeft, maxLeft)
  const nextTop = clamp(floatingPreviewPosition.value.top, minTop, maxTop)
  floatingPreviewPosition.value = {
    left: nextLeft,
    top: nextTop,
  }
  const maxWidth = Math.max(window.innerWidth - nextLeft - VIEWPORT_PADDING, MIN_PREVIEW_WIDTH)
  const maxHeight = Math.max(window.innerHeight - nextTop - VIEWPORT_PADDING, MIN_PREVIEW_HEIGHT)
  floatingPreviewSize.value = {
    width: clamp(floatingPreviewSize.value.width, MIN_PREVIEW_WIDTH, maxWidth),
    height: clamp(floatingPreviewSize.value.height, MIN_PREVIEW_HEIGHT, maxHeight),
  }
  persistFloatingPreviewState()
}

function handlePreviewMouseDown(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  dragState.isDragging = true
  dragState.hasMoved = false
  // 使用 getBoundingClientRect 获取精确位置
  const previewEl = floatingPreviewRef.value
  if (previewEl) {
    const rect = previewEl.getBoundingClientRect()
    dragState.offsetX = event.clientX - rect.left
    dragState.offsetY = event.clientY - rect.top
  } else {
    dragState.offsetX = event.clientX - floatingPreviewPosition.value.left
    dragState.offsetY = event.clientY - floatingPreviewPosition.value.top
  }
  document.addEventListener('mousemove', handlePreviewMouseMove, { passive: false })
  document.addEventListener('mouseup', handlePreviewMouseUp)
  // 防止文本选择
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'grabbing'
}

function handlePreviewMouseMove(event: MouseEvent) {
  if (!dragState.isDragging) return
  event.preventDefault()
  const nextLeft = event.clientX - dragState.offsetX
  const nextTop = event.clientY - dragState.offsetY
  if (
    Math.abs(nextLeft - floatingPreviewPosition.value.left) > 2 ||
    Math.abs(nextTop - floatingPreviewPosition.value.top) > 2
  ) {
    dragState.hasMoved = true
  }
  const previewEl = floatingPreviewRef.value
  const previewWidth = previewEl?.offsetWidth ?? floatingPreviewSize.value.width
  const previewHeight = previewEl?.offsetHeight ?? floatingPreviewSize.value.height
  const maxLeft = window.innerWidth - previewWidth - VIEWPORT_PADDING
  const maxTop = window.innerHeight - previewHeight - VIEWPORT_PADDING
  const minLeft = VIEWPORT_PADDING
  const minTop = VIEWPORT_PADDING
  floatingPreviewPosition.value = {
    left: clamp(nextLeft, minLeft, maxLeft),
    top: clamp(nextTop, minTop, maxTop),
  }
}

function handlePreviewMouseUp() {
  if (!dragState.isDragging) return
  dragState.isDragging = false
  removeDragListeners()
  // 恢复文本选择和光标
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  keepPreviewInViewport()
}

function handleResizeMouseDown(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  resizeState.isResizing = true
  resizeState.startX = event.clientX
  resizeState.startY = event.clientY
  resizeState.startWidth = floatingPreviewSize.value.width
  resizeState.startHeight = floatingPreviewSize.value.height
  dragState.hasMoved = true
  document.addEventListener('mousemove', handleResizeMouseMove, { passive: false })
  document.addEventListener('mouseup', handleResizeMouseUp)
  // 防止文本选择
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'nwse-resize'
}

function handleResizeMouseMove(event: MouseEvent) {
  if (!resizeState.isResizing) return
  event.preventDefault()
  const deltaX = event.clientX - resizeState.startX
  const deltaY = event.clientY - resizeState.startY
  const maxWidth = Math.max(window.innerWidth - floatingPreviewPosition.value.left - VIEWPORT_PADDING, MIN_PREVIEW_WIDTH)
  const maxHeight = Math.max(window.innerHeight - floatingPreviewPosition.value.top - VIEWPORT_PADDING, MIN_PREVIEW_HEIGHT)
  floatingPreviewSize.value = {
    width: clamp(resizeState.startWidth + deltaX, MIN_PREVIEW_WIDTH, maxWidth),
    height: clamp(resizeState.startHeight + deltaY, MIN_PREVIEW_HEIGHT, maxHeight),
  }
}

function handleResizeMouseUp() {
  if (!resizeState.isResizing) return
  resizeState.isResizing = false
  removeResizeListeners()
  // 恢复文本选择和光标
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
  keepPreviewInViewport()
}

function handlePreviewClick() {
  // 仅阻止事件冒泡，不再展开预览
  dragState.hasMoved = false
}

function toggleFloatingPreview() {
  showFloatingPreview.value = !showFloatingPreview.value
  persistFloatingPreviewState()
}

function removeDragListeners() {
  document.removeEventListener('mousemove', handlePreviewMouseMove)
  document.removeEventListener('mouseup', handlePreviewMouseUp)
}

function removeResizeListeners() {
  document.removeEventListener('mousemove', handleResizeMouseMove)
  document.removeEventListener('mouseup', handleResizeMouseUp)
}

function handleToolTabChange(key: string) {
  activeToolKey.value = key
}

// const { dActiveElement, dWidgets, dSelectWidgets } = useSetupMapGetters(['dActiveElement', 'dWidgets', 'dSelectWidgets'])
const { dActiveElement, dWidgets, dSelectWidgets } = storeToRefs(widgetStore)
const { dLayouts } = storeToRefs(widgetStore)

watch(
  dSelectWidgets,
  (items) => {
    setTimeout(() => {
      showGroupCombined.value = items.length > 1
    }, 100)
  },
  {
    deep: true
  }
)

function handleCombine() {
  groupStore.realCombined()
  // store.dispatch('realCombined')
}

// ...mapActions(['selectWidget', 'updateAlign', 'updateHoverUuid', 'getCombined', 'realCombined', 'ungroup', 'pushHistory']),
function alignAction(item: TIconItemSelectData) {
  const sWidgets: TdWidgetData[] = JSON.parse(JSON.stringify(dSelectWidgets.value))
  
  if (sWidgets.length > 1) {
    // 多个元素：使用组合边界框作为对齐参考
  groupStore.getCombined().then(group => {
    sWidgets.forEach((element) => {
      widgetStore.updateAlign({
        align: (item.value as TUpdateAlignData['align']),
        uuid: element.uuid,
        group,
      })
    });
  })
  } else if (sWidgets.length === 1) {
    // 单个元素：直接对齐到画布
    widgetStore.updateAlign({
      align: (item.value as TUpdateAlignData['align']),
      uuid: sWidgets[0].uuid,
    })
  } else if (dActiveElement.value) {
    // 没有选中元素但有活动元素：对齐活动元素
    widgetStore.updateAlign({
      align: (item.value as TUpdateAlignData['align']),
      uuid: dActiveElement.value.uuid,
    })
  }
}
function layerChange(newLayer: TdWidgetData[]) {
  widgetStore.setDWidgets(newLayer.toReversed())
  controlStore.setShowMoveable(false)
}

// 清除素材（仅保留锁定图层）
function handleClearMaterials() {
  try {
    const currentPage = pageStore.dCurrentPage
    const currentLayout = dLayouts.value[currentPage]
    
    if (!currentLayout || !currentLayout.layers) return
    
    // 保留锁定图层以及模板图片，避免误删模版素材
    const preservedLayers = currentLayout.layers.filter((widget: any) => {
      const isLockedLayer = widget.lock === true
      const isTemplateImage = widget.type === 'w-image' && widget.name === '模板图片'
      return isLockedLayer || isTemplateImage
    })
    
    // 统计要清除的素材数量
    const clearCount = currentLayout.layers.length - preservedLayers.length
    
    if (clearCount === 0) return
    
    // 更新当前页面的图层，只保留已锁定图层
    currentLayout.layers = preservedLayers
    
    // 更新 dWidgets（同步到 dWidgets）
    widgetStore.setDWidgets(widgetStore.getWidgets())
    
    // 清除选中状态
    controlStore.setShowMoveable(false)
    widgetStore.selectWidget({ uuid: '-1' })
    
    // 更新画版
    pageStore.reChangeCanvas()
    
  } catch (error: any) {
    console.error('清除素材失败:', error)
  }
}

const hasStoredPreviewState = storedPreviewState.fromStorage

// 监听清除素材事件以及预览拖拽初始化
onMounted(() => {
  eventBus.on('clearMaterials', handleClearMaterials)
  if (hasStoredPreviewState) {
    nextTick(() => keepPreviewInViewport())
  } else {
    setInitialFloatingPreviewPosition()
  }
  window.addEventListener('resize', keepPreviewInViewport)
})

watch(showFloatingPreview, (visible) => {
  if (visible) {
    nextTick(() => {
      keepPreviewInViewport()
    })
    return
  }
  dragState.isDragging = false
  removeDragListeners()
  resizeState.isResizing = false
  removeResizeListeners()
  persistFloatingPreviewState()
})

watch(previewImageUrl, () => {
  persistFloatingPreviewState()
})

onBeforeUnmount(() => {
  eventBus.off('clearMaterials', handleClearMaterials)
  window.removeEventListener('resize', keepPreviewInViewport)
  removeDragListeners()
  removeResizeListeners()
})

</script>

<style lang="less" scoped>
@color0: #ffffff;
@color1: #999999;
@background-color-transparent: rgba(0,0,0,.08);

// 苹果风格配色
@apple-bg: rgba(255, 255, 255, 0.85);
@apple-bg-blur: rgba(255, 255, 255, 0.7);
@apple-border: rgba(0, 0, 0, 0.06);
@apple-text-primary: #1d1d1f;
@apple-text-secondary: #86868b;
@apple-shadow: rgba(0, 0, 0, 0.08);
@apple-shadow-hover: rgba(0, 0, 0, 0.12);
@apple-accent: #007aff;
@apple-accent-hover: #0051d5;

#style-panel ::-webkit-scrollbar {
  width: 6px;
}

#style-panel ::-webkit-scrollbar-track {
  background: transparent;
}

#style-panel ::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  transition: background 0.2s ease;
}

#style-panel ::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.15);
}

#style-panel {
  background: @apple-bg;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-left: 1px solid @apple-border;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  width: 280px;
  box-shadow: -2px 0 12px @apple-shadow;
  
  // 图层区域 - 上方
  .layer-wrap {
    flex: 0 0 30%;
    min-height: 150px;
    max-height: 35%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-bottom: 1px solid @apple-border;
    
    .layer-header {
      flex-shrink: 0;
      padding: 16px 20px;
      border-bottom: 1px solid @apple-border;
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .layer-title {
        font-size: 15px;
        color: @apple-text-primary;
        font-weight: 600;
        user-select: none;
        letter-spacing: -0.01em;
      }
      
      .clear-materials-btn {
        font-size: 12px;
        padding: 6px 14px;
        border-radius: 8px;
        border: 1px solid @apple-border;
        background: rgba(255, 255, 255, 0.8);
        color: @apple-text-primary;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        
        &:hover {
          background: rgba(0, 0, 0, 0.04);
          border-color: rgba(0, 0, 0, 0.1);
          transform: translateY(-0.5px);
        }
        
        &:active {
          transform: translateY(0);
        }
      }
    }
    
    .layer-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 0;
      background: rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
  }
  
  // 分割线
  .divider {
    flex-shrink: 0;
    height: 1px;
    background: linear-gradient(to right, transparent, @apple-border, transparent);
  }
  
  // 设置区域 - 下方
  .style-wrap {
    flex: 1;
    width: 100%;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    
    .style-content {
      padding-top: 16px;
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding-bottom: 16px;
      min-height: 0;

      .multi-select-tools {
        padding: 12px 0 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;

        :deep(icon-item-select) {
          flex: 1 1 140px;
          min-width: 140px;
        }

        .gounp__btn {
          flex: 1 1 100px;
          margin-bottom: 0;
          border-radius: 10px;
          border: 1px solid @apple-border;
          background: rgba(255, 255, 255, 0.8);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        
        &:hover {
            background: rgba(0, 122, 255, 0.1);
            border-color: @apple-accent;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15);
          }
          }
        }
        
      .tool-pages {
        display: flex;
        flex-direction: column;
        gap: 16px;

        &__tabs {
          display: flex;
          flex-wrap: nowrap;
          gap: 8px;
          padding: 4px;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        &__tab {
          flex: 1;
          border: none;
          border-radius: 8px;
          padding: 8px 0;
          background: transparent;
          color: @apple-text-secondary;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          position: relative;
          letter-spacing: -0.01em;

          &::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 8px;
            background: transparent;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }

          &:hover {
            color: @apple-text-primary;
            transform: translateY(-0.5px);
            
            &::before {
              background: rgba(255, 255, 255, 0.6);
          }
        }
        
          &--active {
            color: @apple-text-primary;
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 
                        0 1px 2px rgba(0, 0, 0, 0.04);
            
            &::before {
              background: transparent;
            }
          }
        }
        
        &__list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tool-card {
          border: 1px solid @apple-border;
          border-radius: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transform: translateY(-1px);
            border-color: rgba(0, 0, 0, 0.08);
          }

          &__header {
            display: flex;
          align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          
          &__title {
            font-size: 14px;
            font-weight: 600;
            color: @apple-text-primary;
            letter-spacing: -0.01em;
          }
        }
      }
    }
  }
  
  .floating-preview-toggle {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid @apple-border;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    
    .toggle-switch {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      cursor: pointer;
      user-select: none;
      
      .toggle-label {
        font-size: 13px;
        font-weight: 500;
        color: @apple-text-primary;
        letter-spacing: -0.01em;
      }
      
      .toggle-container {
        position: relative;
        width: 44px;
        height: 26px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 13px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        
        .toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 22px;
          height: 22px;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateX(0);
        }
        
        &.toggle-active {
          background: @apple-accent;
          
          .toggle-thumb {
            transform: translateX(18px);
            box-shadow: 0 2px 6px rgba(0, 122, 255, 0.4);
          }
        }
        
        &:hover {
          opacity: 0.8;
        }
      }
    }
}

  // Element Plus 按钮样式优化
  :deep(.el-button) {
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: -0.01em;
    
    &.el-button--primary {
      background: @apple-accent;
      border-color: @apple-accent;
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
      
      &:hover {
        background: @apple-accent-hover;
        border-color: @apple-accent-hover;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    &.el-button--small {
      padding: 6px 14px;
      font-size: 12px;
    }
    
    &.el-button--mini {
      padding: 5px 12px;
      font-size: 11px;
    }
  }
  
  // 成组按钮样式
  .gounp__btn {
    border-radius: 10px !important;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
}

.floating-preview {
  position: fixed;
  top: 220px;
  left: 16px;
  width: 188px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid @apple-border;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12),
              0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 12px;
  box-sizing: border-box;
  cursor: grab;
  z-index: 9;
  user-select: none;
  display: flex;
  flex-direction: column;
  // 移除 transition，让拖拽更流畅
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &--dragging {
    cursor: grabbing;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18),
                0 4px 12px rgba(0, 0, 0, 0.12);
    transform: scale(1.01);
    // 拖拽时禁用过渡，确保实时跟随
    transition: none;
  }

  &__body {
    border: 1.5px dashed rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    background: rgba(248, 248, 248, 0.6);
    min-height: 120px;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex: 1;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &__img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
    border-radius: 8px;
  }

  .preview-placeholder {
    text-align: center;
    color: @apple-text-secondary;

    i {
      font-size: 32px;
      margin-bottom: 8px;
      opacity: 0.5;
    }

    p {
      margin: 0;
      font-size: 12px;
      opacity: 0.6;
    }
  }

  &__resize-handle {
    position: absolute;
    right: 8px;
    bottom: 8px;
    width: 20px;
    height: 20px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    cursor: nwse-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

    span {
      display: block;
      width: 60%;
      height: 60%;
      border-right: 2px solid rgba(0, 0, 0, 0.3);
      border-bottom: 2px solid rgba(0, 0, 0, 0.3);
      transform: rotate(0deg);
    }

    &:hover {
      background: rgba(0, 122, 255, 0.1);
      border-color: @apple-accent;
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.2);
    }
  }
}

.floating-preview:hover .floating-preview__body {
  border-color: @apple-accent;
  background: rgba(248, 248, 248, 0.8);
}

.gounp {
  &__btn {
    width: 100%;
    margin-bottom: 0;
  }
}
</style>
