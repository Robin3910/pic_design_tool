<template>
  <div id="style-panel">
    <div class="style-tab">
      <span :class="['tab', { 'active-tab': activeTab === 0 }]" @click="activeTab = 0">设置</span>
      <span :class="['tab', { 'active-tab': activeTab === 1 }]" @click="activeTab = 1">图层</span>
    </div>
    <div v-show="activeTab === 0" class="style-wrap">
      <div class="style-content">
        <div v-show="showGroupCombined" style="padding: 2rem 0">
          <el-button plain type="primary" class="gounp__btn" @click="handleCombine">成组</el-button>
          <icon-item-select label="" :data="iconList" @finish="alignAction" />
        </div>
        <component :is="dActiveElement?.type + '-style'" v-show="!showGroupCombined" v-if="dActiveElement?.type" />
      </div>
      <div class="image-preview-area">
        <div class="preview-label">预览</div>
        <div class="preview-image">
          <img 
            v-if="previewImageUrl" 
            :src="previewImageUrl" 
            alt="预览图"
            @error="handleImageError"
          />
          <div v-else class="preview-placeholder">
            <i class="el-icon-picture"></i>
            <p>暂无预览图</p>
          </div>
        </div>
      </div>
    </div>
    <div v-show="activeTab === 1" class="layer-wrap">
      <layer-list :data="dWidgets" @change="layerChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 样式设置面板
// const NAME = 'style-panel'
import alignIconList, { AlignListData } from '@/assets/data/AlignListData'
import iconItemSelect, { TIconItemSelectData } from '../settings/iconItemSelect.vue'
import { ref, watch, computed } from 'vue';
// import { useSetupMapGetters } from '@/common/hooks/mapGetters';
import { useControlStore, useGroupStore, useHistoryStore, useWidgetStore } from '@/store';
import { storeToRefs } from 'pinia';
import { TdWidgetData } from '@/store/design/widget';
import type { TUpdateAlignData } from '@/store/design/widget/actions/align'

const widgetStore = useWidgetStore()
const controlStore = useControlStore()
const groupStore = useGroupStore()
const historyStore = useHistoryStore()

// 从 store 获取预览图 URL
const previewImageUrl = computed(() => controlStore.previewImageUrl)

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const activeTab = ref(0)
const iconList = ref<AlignListData[]>(alignIconList)
const showGroupCombined = ref(false)

// const { dActiveElement, dWidgets, dSelectWidgets } = useSetupMapGetters(['dActiveElement', 'dWidgets', 'dSelectWidgets'])
const { dActiveElement, dWidgets, dSelectWidgets } = storeToRefs(widgetStore)

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
  .style-tab {
    box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: row;
    text-align: center;
    width: 100%;
    z-index: 10;
    .tab {
      user-select: none;
      background-color: @color0;
      font-size: 14px;
      color: @color1;
      cursor: pointer;
      flex: 1;
      padding: 14px 10px;
    }
    .tab.active-tab {
      // background-color: #3e4651;
      font-size: 15px;
      color: #444444;
      font-weight: 600;
    }
  }
  .style-wrap {
    flex: 1;
    width: 100%;
    padding: 0px 20px;
    display: flex;
    flex-direction: column;
    overflow: hidden; // 防止整体滚动
    .style-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding-bottom: 10px; // 给内容一些底部间距
    }
    .image-preview-area {
      flex-shrink: 0; // 防止被压缩
      padding: 20px 0;
      border-top: 1px solid @background-color-transparent;
      background-color: @color0; // 确保背景色一致
      margin-top: auto; // 确保在底部
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
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        img {
          width: 100%;
          height: auto;
          display: block;
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
  .layer-wrap {
    flex: 1;
    overflow: auto;
    width: 100%;
  }
}

.gounp {
  &__btn {
    width: 100%;
    margin-bottom: 2.7rem;
  }
}
</style>
