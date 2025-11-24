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
        <div v-show="showGroupCombined" style="padding: 2rem 0">
          <el-button plain type="primary" class="gounp__btn" @click="handleCombine">成组</el-button>
          <icon-item-select label="" :data="iconList" @finish="alignAction" />
        </div>
        <component :is="dActiveElement?.type + '-style'" v-show="!showGroupCombined" v-if="dActiveElement?.type" />
      </div>
      <div class="image-preview-area">
        <div class="preview-label">预览</div>
        <div class="preview-image" @click="showPreviewDialog = true">
          <img 
            v-if="previewImageUrl" 
            :src="previewImageUrl" 
            alt="预览图"
            @error="handleImageError"
            class="preview-img"
          />
          <div v-else class="preview-placeholder">
            <i class="el-icon-picture"></i>
            <p>暂无预览图</p>
          </div>
          <div v-if="previewImageUrl" class="preview-hint">
            <i class="el-icon-zoom-in"></i>
            <span>点击放大</span>
          </div>
        </div>
      </div>
      
      <!-- 放大预览对话框 -->
      <el-dialog
        v-model="showPreviewDialog"
        title="预览图"
        width="80%"
        :before-close="() => showPreviewDialog = false"
        center
        class="preview-dialog"
      >
        <div class="preview-dialog-content">
          <img 
            v-if="previewImageUrl" 
            :src="previewImageUrl" 
            alt="预览图"
            class="preview-dialog-img"
            @error="handleImageError"
          />
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
// 样式设置面板
// const NAME = 'style-panel'
import alignIconList, { AlignListData } from '@/assets/data/AlignListData'
import iconItemSelect, { TIconItemSelectData } from '../settings/iconItemSelect.vue'
import layerList from './components/layerList.vue'
import { ref, watch, computed } from 'vue';
// import { useSetupMapGetters } from '@/common/hooks/mapGetters';
import { useControlStore, useGroupStore, useHistoryStore, useWidgetStore, useCanvasStore } from '@/store';
import { storeToRefs } from 'pinia';
import { TdWidgetData } from '@/store/design/widget';
import type { TUpdateAlignData } from '@/store/design/widget/actions/align'
import useNotification from '@/common/methods/notification'
import eventBus from '@/utils/plugins/eventBus'
import { onMounted, onBeforeUnmount } from 'vue'

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
const showPreviewDialog = ref(false)
const clearButtonRef = ref<HTMLElement | null>(null)

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
  groupStore.getCombined().then(group => {
    sWidgets.forEach((element) => {
      widgetStore.updateAlign({
        align: (item.value as TUpdateAlignData['align']),
        uuid: element.uuid,
        group,
      })
    });
  })
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
    
    if (!currentLayout || !currentLayout.layers) {
      useNotification('提示', '当前画版没有素材', { type: 'info' })
      return
    }
    
    // 过滤出需要保留的图层：仅锁定图层
    const preservedLayers = currentLayout.layers.filter((widget: any) => widget.lock === true)
    
    // 统计要清除的素材数量
    const clearCount = currentLayout.layers.length - preservedLayers.length
    
    if (clearCount === 0) {
      useNotification('提示', '没有需要清除的素材', { type: 'info' })
      return
    }
    
    // 更新当前页面的图层，只保留已锁定图层
    currentLayout.layers = preservedLayers
    
    // 更新 dWidgets（同步到 dWidgets）
    widgetStore.setDWidgets(widgetStore.getWidgets())
    
    // 清除选中状态
    controlStore.setShowMoveable(false)
    widgetStore.selectWidget({ uuid: '-1' })
    
    // 更新画版
    pageStore.reChangeCanvas()
    
    const lockedCount = preservedLayers.length
    useNotification('成功', `已清除 ${clearCount} 个素材，仅保留 ${lockedCount} 个锁定图层`, { type: 'success' })
  } catch (error: any) {
    console.error('清除素材失败:', error)
    useNotification('错误', error.message || '清除素材失败，请重试', { type: 'error' })
  }
}

// 监听清除素材事件
onMounted(() => {
  eventBus.on('clearMaterials', handleClearMaterials)
})

onBeforeUnmount(() => {
  eventBus.off('clearMaterials', handleClearMaterials)
})

</script>

<style lang="less" scoped>
@color0: #ffffff;
@color1: #999999;
@background-color-transparent: rgba(0,0,0,.08);

#style-panel ::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}
#style-panel {
  background-color: @color0;
  border-left: 1px solid @background-color-transparent;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  width: 280px;
  
  // 图层区域 - 上方
  .layer-wrap {
    flex: 0 0 30%; // 固定高度比例，可根据需要调整
    min-height: 150px; // 最小高度
    max-height: 35%; // 最大高度
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-bottom: 1px solid @background-color-transparent;
    
    .layer-header {
      flex-shrink: 0;
      padding: 14px 20px;
      border-bottom: 1px solid @background-color-transparent;
      background-color: @color0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .layer-title {
        font-size: 15px;
        color: #444444;
        font-weight: 600;
        user-select: none;
      }
      
      .clear-materials-btn {
        font-size: 12px;
        padding: 4px 12px;
      }
    }
    
    .layer-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }
  }
  
  // 分割线
  .divider {
    flex-shrink: 0;
    height: 1px;
    background-color: @background-color-transparent;
  }
  
  // 设置区域 - 下方
  .style-wrap {
    flex: 1;
    width: 100%;
    padding: 0px 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden; // 防止整体滚动
    min-height: 0; // 允许 flex 子元素缩小
    
    .style-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding-bottom: 10px; // 给内容一些底部间距
      min-height: 0; // 允许 flex 子元素缩小
    }
    
    .image-preview-area {
      flex-shrink: 0; // 防止被压缩
      padding: 20px 0;
      border-top: 1px solid @background-color-transparent;
      background-color: @color0; // 确保背景色一致
      
      .preview-label {
        font-size: 14px;
        color: @color1;
        margin-bottom: 10px;
        font-weight: 500;
      }
      
      .preview-image {
        width: 100%;
        background-color: #f5f5f5;
        border-radius: 4px;
        overflow: hidden;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          background-color: #eeeeee;
          
          .preview-hint {
            opacity: 1;
          }
          
          .preview-img {
            transform: scale(1.02);
          }
        }
        
        .preview-img {
          width: 100%;
          height: auto;
          display: block;
          transition: transform 0.3s ease;
        }
        
        .preview-hint {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background-color: rgba(0, 0, 0, 0.6);
          color: #fff;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          
          i {
            font-size: 14px;
          }
        }
        
        .preview-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #999;
          padding: 2rem;
          
          i {
            font-size: 3rem;
            margin-bottom: 0.5rem;
          }
          
          p {
            margin: 0;
            font-size: 0.9rem;
          }
        }
      }
    }
  }
  
}

// 预览对话框样式
:deep(.preview-dialog) {
  .preview-dialog-content {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    background-color: #f5f5f5;
    border-radius: 4px;
    padding: 20px;
    
    .preview-dialog-img {
      max-width: 100%;
      max-height: 70vh;
      height: auto;
      display: block;
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

.gounp {
  &__btn {
    width: 100%;
    margin-bottom: 2.7rem;
  }
}
</style>
