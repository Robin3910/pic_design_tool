<!--
 * @Author: ShawnPhang
 * @Date: 2021-12-16 16:20:16
 * @Description: 瀑布流组件
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @Date: 2024-03-06 21:16:00
-->
<template>
  <div ref="imgWaterFall" :style="{ height: state.countHeight + 'px' }" class="img-water-fall">
    <!-- backgroundImage: `url(${item.cover})` -->
    <div
      v-for="(item, i) in state.list" :key="i + 'iwf'"
      :style="{ top: item.top + 'px', left: item.left + 'px', width: state.width + 'px' }"
      class="img-box-wrapper" @click.stop="selectItem(item, i)"
    >
      <div
        class="img-box"
        :style="{ height: item.height + 'px' }"
      >
        <edit-model v-if="edit" :options="props.edit" :data="{ item, i }">
          {{ item.isDelect }}
          <div v-if="item.isDelect" class="list__mask">已删除</div>
          <el-image v-if="!item.fail" class="img" :src="item.cover" lazy loading="lazy" @error="loadError(item)" />
          <div v-else class="fail_img">{{ item.title }}</div>
        </edit-model>
        <el-image v-else class="img" :src="item.cover" lazy loading="lazy" @error="loadError(item)" />
      </div>
      <!-- 模板标题显示在素材下方 -->
      <div v-if="item.title" class="template-title">{{ item.title }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// const NAME = 'img-water-fall'
import { IGetTempListData } from '@/api/home';
import { reactive, watch } from 'vue'

type TProps = {
  listData: IGetTempListData[]
  edit?: Record<string, any>
}

type TState = {
  width: number
  countHeight: number
  list: IGetTempListData[]
}

type TEmits = {
  (event: 'select', data: IGetTempListData): void
  (event: 'load'): void
}

const props = defineProps<TProps>()
const emit = defineEmits<TEmits>()

const state = reactive<TState>({
  width: 146, // 图片的宽度
  list: [],
  countHeight: 0,
})

const columnHeights: number[] = [] // 列的高度
const columnNums = 2 // 总共有多少列
const gap = 7 // 图片之间的间隔
const titleHeight = 32 // 标题高度（包括间距）
const maxHeight = 220 // 图片最大高度限制

watch(
  () => props.listData,
  () => {
    columnHeights.length = 0
    const widthLimit = state.width * columnNums //  + gap * (columnNums - 1) // 每行宽度
    const cloneList = JSON.parse(JSON.stringify(props.listData))
    for (let i = 0; i < cloneList.length; i++) {
      let index = i % columnNums
      const item = cloneList[i]
      item.height = (item.height / item.width) * state.width // 图片高度
      // 限制最大高度，避免素材过长
      if (item.height > maxHeight) {
        item.height = maxHeight
      }
      const itemTotalHeight = item.height + (item.title ? titleHeight : 0) // 图片高度 + 标题高度
      item.left = index * (widthLimit / columnNums + gap) // 定位
      item.top = columnHeights[index] + gap || 0 // 定位
      // columnHeights[index] = isNaN(columnHeights[index]) ? item.height : item.height + columnHeights[index] + gap // 记录列高度
      // 找出最短边
      if (isNaN(columnHeights[index])) {
        columnHeights[index] = itemTotalHeight
      } else {
        index = columnHeights.indexOf(Math.min(...columnHeights))
        item.left = index * (widthLimit / columnNums + gap)
        item.top = columnHeights[index] + gap || 0
        columnHeights[index] = itemTotalHeight + columnHeights[index] + gap
      }
    }
    state.countHeight = Math.max(...columnHeights)
    state.list = cloneList
  },
)

const load = () => {
  emit('load')
}
const selectItem = (value: IGetTempListData, index: number) => {
  emit('select', value)
}
const loadError = (item: IGetTempListData) => {
  item.fail = true
}

defineExpose({
  load,
  selectItem,
  loadError,
})
</script>

<style lang="less" scoped>
// 苹果风格变量
@apple-bg: rgba(255, 255, 255, 0.85);
@apple-border: rgba(0, 0, 0, 0.06);
@apple-text-primary: #1d1d1f;
@apple-text-secondary: #86868b;
@apple-shadow: rgba(0, 0, 0, 0.08);
@apple-shadow-hover: rgba(0, 0, 0, 0.12);
@apple-accent: #007aff;

.fail_img {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: @apple-text-secondary;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.img-water-fall {
  position: relative;
  margin-left: 14px;
  
  .img-box-wrapper {
    position: absolute !important;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      transform: translateY(-2px);
      z-index: 10;
    }
  }
  
  .img-box {
    position: relative;
    width: 100%;
    background-color: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    background-image: 
      linear-gradient(45deg, rgba(240, 240, 240, 0.5) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(240, 240, 240, 0.5) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(240, 240, 240, 0.5) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(240, 240, 240, 0.5) 75%);
    background-size: 12px 12px;
    background-position: 0 0, 0 6px, 6px -6px, -6px 0px;
    border: 1px solid @apple-border;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 8px @apple-shadow;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    .img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .img-box-wrapper:hover .img-box {
    box-shadow: 0 6px 20px @apple-shadow-hover;
    border-color: @apple-accent;
    
    &::before {
      content: ' ';
      background: rgba(0, 122, 255, 0.08);
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none;
      border-radius: 10px;
    }
  }
  
  .template-title {
    margin-top: 8px;
    font-size: 12px;
    color: @apple-text-secondary;
    line-height: 20px;
    height: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 4px;
    font-weight: 500;
    letter-spacing: -0.01em;
    transition: color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .img-box-wrapper:hover .template-title {
    color: @apple-text-primary;
  }
}

.list {
  &__mask {
    position: absolute;
    z-index: 2;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    letter-spacing: -0.01em;
    border-radius: 10px;
  }
}
</style>
