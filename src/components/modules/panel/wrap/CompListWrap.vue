<!--
 * @Author: ShawnPhang
 * @Date: 2021-08-27 15:16:07
 * @Description: 素材列表，主要用于文字组合列表 - 已更新为使用48080端口新后端API
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-14 18:49:06
-->
<template>
  <div class="wrap">
    <!-- <div class="search__wrap">
      <el-input v-model="searchValue" placeholder="输入关键词搜索" class="input-with-select">
        <template #append>
          <el-button><i class="iconfont icon-search"></i></el-button>
        </template>
      </el-input>
    </div>
    <el-divider content-position="left">推荐组件</el-divider> -->
    <classHeader v-show="!state.currentCategory" :types="state.types" @select="selectTypes">
      <template v-slot="{ index }">
        <div class="list-wrap">
          <div v-for="(item, i) in getShowList(index)" :key="i + 'sl'" draggable="false" @mousedown="dragStart($event, item)" @mousemove="mousemove" @mouseup="mouseup" @click.stop="selectItem(item)" @dragstart="dragStart($event, item)">
            <el-image class="list__img-thumb" :src="item.cover" fit="contain" lazy loading="lazy"></el-image>
          </div>
        </div>
      </template>
    </classHeader>

    <ul v-if="state.currentCategory" v-infinite-scroll="load" class="infinite-list" :infinite-scroll-distance="150" style="overflow: auto">
      <classHeader :is-back="true" @back="back">{{ state.currentCategory.name }}</classHeader>
      <el-space fill wrap :fillRatio="30" direction="horizontal" class="list">
        <div v-for="(item, i) in getFilteredList()" :key="i + 'i'" class="list__item" draggable="false" @mousedown="dragStart($event, item)" @mousemove="mousemove" @mouseup="mouseup" @click.stop="selectItem(item)" @dragstart="dragStart($event, item)">
          <!-- <edit-model :isComp="true" @action="action($event, item, i)"> -->
          <el-image class="list__img" :src="item.cover" fit="contain" lazy loading="lazy" />
          <!-- </edit-model> -->
        </div>
      </el-space>
      <div v-show="state.loading" class="loading"><i class="el-icon-loading"></i> 拼命加载中</div>
      <div v-show="state.loadDone" class="loading">全部加载完毕</div>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { reactive, onMounted, computed } from 'vue'
import getComponentsData from '@/common/methods/DesignFeatures/setComponents'
import DragHelper from '@/common/hooks/dragHelper'
import setItem2Data from '@/common/methods/DesignFeatures/setImage'
import { useControlStore, useCanvasStore, useWidgetStore, useTemplateStore, useAuthStore } from '@/store'
import type { Template } from '@/api/template'

type TState = {
  loading: boolean
  loadDone: boolean
  searchValue: string
  currentCategory: { id: string, name: string } | null
  types: {cate: string, name: string}[]
}

// 拖拽效果相关
const dragHelper = new DragHelper()
let isDrag = false
let startPoint = { x: 99999, y: 99999 }
let tempDetail: Template | null = null
// 缓存组件用以减少接口请求的次数
const compsCache: any = {}

const state = reactive<TState>({
  loading: false,
  loadDone: false,
  searchValue: '',
  currentCategory: null,
  types: [
    { cate: 'text', name: '高级特效文字' },
    { cate: 'comp', name: '示例组合模板' },
  ],
})

const controlStore = useControlStore()
const widgetStore = useWidgetStore()
const templateStore = useTemplateStore()
const dPage = useCanvasStore().dPage

// 将新后端的模板数据转换为组件格式
const convertedList = computed(() => {
  return templateStore.templates.map((template: Template) => ({
    id: template.id,
    title: template.title || template.name || '未命名组件',
    cover: template.cover || getDefaultCover(template),
    width: template.width || 200,
    height: template.height || 200,
    name: template.name,
    cate: template.name?.includes('text') ? 'text' : 'comp',
    state: template.state,
    data: template.data
  }))
})

// 生成默认封面（当没有封面时）
function getDefaultCover(template: Template): string {
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7']
  const color = colors[template.id.length % colors.length]
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${template.width}" height="${template.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color}88;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" dy=".3em">${template.title || template.name || '组件'}</text>
    </svg>
  `)}`
}

onMounted(async () => {
  // 检查认证状态，如果未登录则不加载数据
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) {
    console.log('用户未登录，跳过组件加载')
    return
  }
  
  // 加载所有启用的模板作为组件
  try {
    await templateStore.fetchEnabledTemplates()
  } catch (error) {
    console.error('加载组件失败:', error)
  }
})

const mouseup = (e: MouseEvent) => {
  e.preventDefault()
  isDrag = false
  tempDetail = null
  startPoint = { x: 99999, y: 99999 }
}

const mousemove = (e: MouseEvent) => {
  e.preventDefault()
  if (e.x - startPoint.x > 2 || e.y - startPoint.y > 2) {
    isDrag = true
  }
}

const load = async (init: boolean = false) => {
  if (init) {
    state.loadDone = false
  }

  if (state.loadDone || state.loading) {
    return
  }

  state.loading = true

  try {
    // 使用新后端的模板数据
    await templateStore.fetchEnabledTemplates()
    state.loadDone = true
  } catch (error) {
    console.error('加载组件失败:', error)
    state.loadDone = true
  } finally {
    setTimeout(() => {
      state.loading = false
    }, 100)
  }
}

type TActionParam = {
  name: string
  value: string
}

function action({ name, value }: TActionParam, item: any, index: number) {
  switch (name) {
    case 'del':
      delComp(item, index)
      break
  }
}

function delComp({ id }: any, index: number) {
  // 注意：这里可能需要调用删除API，但目前新后端可能没有删除接口
  console.log('删除组件:', id)
  // 从列表中移除
  const templates = templateStore.templates.filter(t => t.id !== id)
  templateStore.setTemplates(templates)
}

// 获取显示列表（根据分类）
const getShowList = (index: number) => {
  const category = state.types[index]
  if (!category) return []
  
  return convertedList.value.filter(item => {
    if (category.cate === 'text') {
      return item.cate === 'text' || item.name?.includes('text')
    } else if (category.cate === 'comp') {
      return item.cate === 'comp' || !item.name?.includes('text')
    }
    return true
  }).slice(0, 6) // 只显示前6个
}

// 获取过滤后的列表
const getFilteredList = () => {
  if (!state.currentCategory) return convertedList.value
  
  return convertedList.value.filter(item => {
    if (state.currentCategory?.cate === 'text') {
      return item.cate === 'text' || item.name?.includes('text')
    } else if (state.currentCategory?.cate === 'comp') {
      return item.cate === 'comp' || !item.name?.includes('text')
    }
    return true
  })
}

const selectTypes = (item: { id: string, name: string }) => {
  state.currentCategory = item
  load(true)
}

const back = () => {
  state.currentCategory = null
}

const dragStart = async (e: MouseEvent, { id, width, height, cover }: any) => {
  startPoint = { x: e.x, y: e.y }
  
  const img = await setItem2Data({ width, height, url: cover })
  dragHelper.start(e, img.canvasWidth)
  
  tempDetail = await getCompDetail({ id })
  if (Array.isArray(JSON.parse(tempDetail.data || '{}'))) {
    widgetStore.setSelectItem({ data: JSON.parse(tempDetail.data || '{}'), type: 'group' })
  } else {
    widgetStore.setSelectItem({ data: JSON.parse(tempDetail.data || '{}'), type: 'text' })
  }
}

const selectItem = async (item: any) => {
  if (isDrag) {
    return
  }
  
  controlStore.setShowMoveable(false) // 清理掉上一次的选择

  tempDetail = tempDetail || (await getCompDetail({ id: item.id }))
  const group: any = await getComponentsData(tempDetail.data || '{}')
  let parent: Record<string, any> = { x: 0, y: 0 }
  const { width: pW, height: pH } = dPage

  Array.isArray(group) &&
    group.forEach((element) => {
      element.type === 'w-group' && (parent = element)
    })
  
  if (parent.isContainer) {
    group.forEach((element: any) => {
      element.left += (pW - parent.width) / 2
      element.top += (pH - parent.height) / 2
    })
    widgetStore.addGroup(group)
  } else {
    group.text && (group.text = decodeURIComponent(group.text))
    group.left = pW / 2 - group.fontSize * (group.text.length / 2)
    group.top = pH / 2 - group.fontSize / 2
    widgetStore.addWidget(group)
  }
}

function getCompDetail(params: { id: string }): Promise<Template> {
  // 有缓存则直接返回组件数据，否则请求获取数据
  return new Promise((resolve) => {
    if (compsCache[params.id]) {
      resolve(compsCache[params.id])
    } else {
      templateStore.fetchTemplateById(params.id).then((res: Template) => {
        resolve(res)
        compsCache[params.id] = res // 缓存请求的组件数据
      }).catch((error) => {
        console.error('获取组件详情失败:', error)
        // 返回一个默认的模板对象
        resolve({
          id: params.id,
          title: '未知组件',
          name: 'unknown',
          width: 200,
          height: 200,
          state: 1,
          createTime: new Date().toISOString(),
          data: '{}'
        })
      })
    }
  })
}

defineExpose({
  load,
  action,
  back,
  selectTypes,
  mouseup,
  mousemove,
  dragStart,
  selectItem,
})
</script>

<style lang="less" scoped>
.wrap {
  width: 100%;
  height: 100%;
}

.search__wrap {
  padding: 1.4rem 1rem 0.8rem 1rem;
}

.infinite-list {
  height: 100%;
  padding-bottom: 150px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.infinite-list::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}
.list {
  width: 100%;
  // padding: 20px 0 0 10px;
  padding: 3.1rem 0 0 1rem;
  gap: 0 !important;
  &__item {
    overflow: hidden;
    background: #f8fafc;
    margin-bottom: 8px;
    margin-right: 8px;
  }
  &__img {
    cursor: grab;
    width: 142px;
    height: 142px;
    padding: 4px;
    border-radius: 4px;
  }
  &__img-thumb {
    cursor: grab;
    width: 90px;
    height: 90px;
    background: #f8fafc;
    padding: 4px;
    border-radius: 4px;
  }
  &__img:hover,
  &__img-thumb:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.loading {
  padding-top: 1rem;
  text-align: center;
  font-size: 14px;
  color: #999;
}
.list-wrap {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.8rem;
}
</style>
