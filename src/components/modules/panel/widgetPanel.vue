<template>
  <div id="widget-panel">
    <div class="widget-classify">
      <ul class="classify-wrap">
        <li v-for="(item, index) in state.widgetClassifyList" :key="index" :class="['classify-item', { 'active-classify-item': state.activeWidgetClassify === index && state.active }]" @click="clickClassify(index)">
          <div class="icon-box">
            <component 
              v-if="item.iconComponent" 
              :is="item.iconComponent" 
              :size="24" 
              :color="state.activeWidgetClassify === index && state.active ? '#ffffff' : '#070707'"
              :class="{ 'svg-icon': true }"
            />
            <img
              v-else-if="item.iconImage"
              :src="item.iconImage"
              alt=""
              class="icon-image"
              draggable="false"
            />
            <i v-else :class="['iconfont', 'icon', item.icon]" :style="item.style" />
          </div>
          <p>{{ item.name }}</p>
        </li>
      </ul>
    </div>
    <div v-show="state.active" class="widget-wrap">
      <keep-alive>
        <component 
          ref="currentComponentRef"
          :is="state.widgetClassifyList[state.activeWidgetClassify].component" 
        />
      </keep-alive>
    </div>
    <!-- <div v-show="active" class="side-wrap"><div class="pack__up" @click="active = false">&lt;</div></div> -->
    <div v-show="state.active" class="side-wrap">
      <el-tooltip :show-after="300" :hide-after="0" effect="dark" content="关闭侧边栏" placement="right">
        <div class="pack__up" @click="state.active = false"></div>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 组件面板
// const NAME = 'widget-panel'
import widgetClassifyListData from '@/assets/data/WidgetClassifyList'
import { reactive, onMounted, watch, nextTick, markRaw, ref } from 'vue'
import { useRoute } from 'vue-router'
import { UploadIcon, HistoryIcon } from '@/components/common/Icon'

const route = useRoute()

// 图标组件映射
const iconComponents: Record<string, any> = {
  UploadIcon: markRaw(UploadIcon),
  HistoryIcon: markRaw(HistoryIcon),
}

const state = reactive({
  widgetClassifyList: widgetClassifyListData.map(item => ({
    ...item,
    iconComponent: item.iconComponent ? iconComponents[item.iconComponent] : null,
  })),
  activeWidgetClassify: 0,
  active: true,
})

// 动态组件的 ref
const currentComponentRef = ref<any>(null)

// 需要自动刷新的页面索引：模板(0)、订单(1)、图片(2)、文字(3)、替换(4)
const AUTO_REFRESH_INDEXES = [0, 1, 2, 3, 4]

const clickClassify = (index: number) => {
  state.activeWidgetClassify = index
  state.active = true
  // 刷新逻辑在 watch 中统一处理，避免重复调用
}

// 触发当前页面的刷新
const triggerRefresh = async () => {
  await nextTick()
  if (currentComponentRef.value?.handleRefresh) {
    currentComponentRef.value.handleRefresh()
  }
}

onMounted(async () => {
  await nextTick()
  const { koutu } = route.query
  if (koutu) {
    state.activeWidgetClassify = 4
  } else {
    // 如果默认显示的是需要自动刷新的页面，触发刷新
    if (AUTO_REFRESH_INDEXES.includes(state.activeWidgetClassify)) {
      await triggerRefresh()
    }
  }
})

watch(
  () => state.activeWidgetClassify,
  async (index) => {
    if (index >= 0 && index < state.widgetClassifyList.length) {
      state.widgetClassifyList[index].show = true
      // 如果切换到需要自动刷新的页面，触发刷新
      if (AUTO_REFRESH_INDEXES.includes(index)) {
        await triggerRefresh()
      }
    }
  },
)

defineExpose({
  clickClassify
})
</script>

<style lang="less" scoped>
// 苹果风格变量
@apple-bg: rgba(255, 255, 255, 0.85);
@apple-bg-blur: rgba(255, 255, 255, 0.7);
@apple-border: rgba(0, 0, 0, 0.06);
@apple-text-primary: #1d1d1f;
@apple-text-secondary: #86868b;
@apple-shadow: rgba(0, 0, 0, 0.08);
@apple-shadow-hover: rgba(0, 0, 0, 0.12);
@apple-accent: #007aff;
@apple-accent-hover: #0051d5;

#widget-panel {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: @apple-text-primary;
  display: flex;
  flex-direction: row;
  font-weight: 500;
  height: 100%;
  position: relative;
  
  .widget-classify {
    position: relative;
    border-right: 1px solid @apple-border;
    background: @apple-bg;
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    height: 100%;
    text-align: center;
    width: 66px;
    box-shadow: 2px 0 12px @apple-shadow;
    
    .icon {
      font-size: 24px;
      color: @apple-text-primary;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .classify-wrap {
      padding-top: 8px;
      user-select: none;
      width: 100%;
      
      .classify-item {
        position: relative;
        align-items: center;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        font-size: 11px;
        font-weight: 500;
        height: 72px;
        justify-content: center;
        width: 100%;
        border-radius: 12px;
        margin: 4px 8px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        
        &:hover {
          background: rgba(0, 0, 0, 0.04);
          transform: translateY(-1px);
        }
        
        p {
          color: @apple-text-secondary;
          font-weight: 500;
          margin-top: 4px;
          letter-spacing: -0.01em;
          transition: color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .icon-box {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .icon {
          color: @apple-text-primary;
        }
        
        .icon-image {
          width: 24px;
          height: 24px;
          object-fit: contain;
          transition: filter 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
        }
        
        .svg-icon {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
      
      .active-classify-item {
        position: relative;
        background: rgba(0, 122, 255, 0.1);
        
        .icon-box {
          background: @apple-accent;
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
        }
        
        p {
          color: @apple-accent;
        }
        
        .icon {
          color: #ffffff;
        }
        
        .icon-image {
          filter: brightness(0) invert(1);
        }
        
        .svg-icon {
          color: #ffffff !important;
          
          :deep(path) {
            fill: #ffffff !important;
          }
        }
        
        &::after {
          position: absolute;
          content: '';
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 32px;
          background: @apple-accent;
          border-radius: 0 3px 3px 0;
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.4);
        }
      }
    }
  }
  
  .widget-wrap {
    width: 328px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: @apple-bg;
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    flex: 1;
    height: 100%;
    overflow: hidden;
  }
  
  .side-wrap {
    position: absolute;
    left: 394px;
    pointer-events: none;
    z-index: 99;
    width: 20px;
    height: 100%;
    display: flex;
    align-items: center;
    
    .pack__up {
      pointer-events: all;
      border-radius: 0 12px 12px 0;
      cursor: pointer;
      width: 20px;
      height: 64px;
      background: @apple-bg;
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid @apple-border;
      border-left: none;
      box-shadow: 4px 0 12px @apple-shadow;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      
      &::before {
        content: '‹';
        font-size: 20px;
        color: @apple-text-secondary;
        font-weight: 300;
        line-height: 1;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      &:hover {
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 4px 0 16px @apple-shadow-hover;
        transform: translateX(-2px);
        
        &::before {
          color: @apple-text-primary;
        }
      }
    }
  }
}
</style>
