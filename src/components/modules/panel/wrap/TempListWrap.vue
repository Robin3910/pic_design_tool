<!--
 * @Author: ShawnPhang
 * @Date: 2021-08-27 15:16:07
 * @Description: 模板列表 - 已更新为使用48080端口新后端API
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @Date: 2024-03-06 21:16:00
-->
<template>
  <div class="wrap">
    <search-header v-model="state.searchKeyword" @change="cateChange" />

    <el-divider v-show="state.title" style="margin-top: 1.7rem" content-position="left">
      <span style="font-weight: bold">{{ state.title }}</span>
    </el-divider>

    <el-button class="upload-psd" plain type="primary" @click="openPSD">导入 PSD 创建模板</el-button>

    <ul ref="listRef" v-infinite-scroll="load" class="infinite-list" :infinite-scroll-distance="150" style="overflow: auto">
      <img-water-fall :listData="convertedList" @select="selectItem" />
      <div v-show="state.loading" class="loading"><i class="el-icon-loading"></i> 拼命加载中</div>
      <div v-show="state.loadDone" class="loading">全部加载完毕</div>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { LocationQueryValue, useRoute, useRouter } from 'vue-router'
import searchHeader from './components/searchHeader.vue'
import useConfirm from '@/common/methods/confirm'
import imgWaterFall from './components/imgWaterFall.vue'
import { useControlStore, useCanvasStore, useUserStore, useHistoryStore, useWidgetStore, useForceStore, useTemplateStore, useAuthStore } from '@/store'
import { storeToRefs } from 'pinia'
import type { Template } from '@/api/template'

type TState = {
  loading: boolean
  loadDone: boolean
  title: string
  searchKeyword: string
}

type TPageOptions = {
  pageNo: number
  pageSize: number
  state?: number | string
}

const listRef = ref<HTMLElement | null>(null)
const route = useRoute()
const router = useRouter()

const controlStore = useControlStore()
const userStore = useUserStore()
const pageStore = useCanvasStore()
const widgetStore = useWidgetStore()
const forceStore = useForceStore()
const templateStore = useTemplateStore()

const state = reactive<TState>({
  loading: false,
  loadDone: false,
  title: '示例模板',
  searchKeyword: '',
})

// 防抖计时器
let checkHeightTimer: NodeJS.Timeout | null = null

const { dHistoryParams } = storeToRefs(useHistoryStore())

const pageOptions: TPageOptions = { pageNo: 1, pageSize: 20, state: 1 }
const { cate, edit } = route.query
cate && (pageOptions.state = (cate as LocationQueryValue) ?? 1)
edit && userStore.managerEdit(true)

// 将新后端的模板数据转换为旧格式，以兼容现有的imgWaterFall组件
const convertedList = computed(() => {
  return templateStore.templates.map((template: Template) => ({
    id: template.id,
    title: template.title || template.name || '未命名模板',
    cover: template.cover || getDefaultCover(template),
    width: template.width || 750,
    height: template.height || 1334,
    data: template.data, // JSON字符串格式的模板数据
    name: template.name,
    createTime: template.createTime,
    state: template.state,
    // 添加额外的展示信息
    marginTop: template.marginTop,
    marginBottom: template.marginBottom,
    marginLeft: template.marginLeft,
    marginRight: template.marginRight,
    updateTime: template.updateTime,
    // 兼容旧格式的字段
    isDelect: false,
    fail: false,
    top: 0,
    left: 0,
    listWidth: template.width,
    gap: 0,
    thumb: template.cover,
    url: '',
    model: '',
    color: ''
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
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dy=".3em">${template.title || template.name || '模板'}</text>
    </svg>
  `)}`
}

onMounted(async () => {
  // 检查认证状态，如果未登录则不加载数据
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) {
    console.log('用户未登录，跳过模板加载')
    return
  }
  await load(true)
})

const load = async (init: boolean = false, stat?: string) => {
  stat && (pageOptions.state = stat)

  if (init && listRef.value) {
    listRef.value.scrollTop = 0
    state.loadDone = false
    pageOptions.pageNo = 1
  }
  
  // 防止重复加载
  if (state.loadDone || state.loading) {
    console.log('跳过加载: loadDone=', state.loadDone, 'loading=', state.loading)
    return
  }

  state.loading = true
  console.log('开始加载第', pageOptions.pageNo, '页')

  try {
    const result = await templateStore.fetchTemplatePage({
      pageNo: pageOptions.pageNo,
      pageSize: pageOptions.pageSize,
      state: pageOptions.state
    })
    
    console.log('API响应结果:', result)
    
    // 检查是否还有更多数据
    if (templateStore.pageInfo) {
      const { total } = templateStore.pageInfo
      // 使用请求参数而不是API返回的null值
      const currentPageNo = pageOptions.pageNo
      const currentPageSize = pageOptions.pageSize
      const currentCount = currentPageNo * currentPageSize
      
      // 如果API返回的total为0或1，且当前页没有数据，说明没有更多数据了
      const hasData = templateStore.templates.length > 0
      const lastPageHasData = templateStore.templates.length >= currentPageSize
      
      state.loadDone = !hasData || !lastPageHasData || currentCount >= total
      
      console.log('分页信息:', { 
        apiPageNo: templateStore.pageInfo.pageNo, 
        apiPageSize: templateStore.pageInfo.pageSize,
        requestPageNo: currentPageNo, 
        requestPageSize: currentPageSize, 
        total, 
        currentCount, 
        templatesCount: templateStore.templates.length,
        hasData,
        lastPageHasData,
        loadDone: state.loadDone 
      })
    } else {
      state.loadDone = true
      console.log('没有分页信息，设置loadDone=true')
    }
    
    pageOptions.pageNo += 1
  } catch (error) {
    console.error('加载模板失败:', error)
    state.loadDone = true
  } finally {
    state.loading = false
    // 防抖检查高度，避免频繁调用
    if (checkHeightTimer) {
      clearTimeout(checkHeightTimer)
    }
    checkHeightTimer = setTimeout(() => {
      checkHeight()
    }, 300)
  }
}

function cateChange(type: any) {
  state.title = type.name
  const init = pageOptions.state != type.id
  pageOptions.state = type.id
  load(init, pageOptions.state)
}

function checkHeight() {
  if (!listRef.value || state.loadDone || state.loading) return
  
  // 检查容器高度是否大于内容高度
  const containerHeight = listRef.value.offsetHeight
  const contentHeight = listRef.value.scrollHeight
  
  console.log('检查高度:', { containerHeight, contentHeight, loadDone: state.loadDone, loading: state.loading })
  
  // 只有当内容高度小于容器高度且还有更多数据时才继续加载
  if (contentHeight < containerHeight && !state.loadDone) {
    console.log('内容高度不足，继续加载下一页')
    load()
  }
}

let hideReplacePrompt: any = localStorage.getItem('hide_replace_prompt')
async function selectItem(item: any) {
  controlStore.setShowMoveable(false) // 清理掉上一次的选择框
  if (!hideReplacePrompt && dHistoryParams.value.length > 0) {
    const doNotPrompt = await useConfirm('添加到作品', '模板内容将替换页面内容', 'warning', { confirmButtonText: '知道了', cancelButtonText: '不再提示' })
    if (!doNotPrompt) {
      localStorage.setItem('hide_replace_prompt', '1')
      hideReplacePrompt = true
    }
  }
  userStore.managerEdit(false)
  widgetStore.setDWidgets([])
  setTempId(item.id)

  let result = null
  if (!item.data) {
    // 如果没有数据，从新后端获取模板详情
    try {
      const template = await templateStore.fetchTemplateById(item.id)
      result = JSON.parse(template.data || '{}')
    } catch (error) {
      console.error('获取模板详情失败:', error)
      return
    }
  } else {
    result = JSON.parse(item.data)
  }
  
  if (Array.isArray(result)) {
    const { global, layers } = result[0]
    pageStore.setDPage(global)
    widgetStore.setTemplate(layers)
  } else {
    const { page, widgets } = result
    pageStore.setDPage(page)
    widgetStore.setTemplate(widgets)
  }
  setTimeout(() => {
    forceStore.setZoomScreenChange()
  }, 300)
  widgetStore.selectWidget({
    uuid: '-1',
  })
}

function setTempId(tempId: number | string) {
  const { id } = route.query
  router.push({ path: '/home', query: { tempid: tempId, id }, replace: true })
}

const openPSD = () => {
  window.open(router.resolve('/psd').href, '_blank')
}

defineExpose({
  load,
  cateChange,
  listRef,
})
</script>

<style lang="less" scoped>
.wrap {
  width: 100%;
  height: 100%;
}

.infinite-list {
  height: 100%;
  margin-top: 1rem;
  padding-bottom: 150px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.infinite-list::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}
// .list {
//   width: 100%;
//   padding: 4px 0 0 10px;
//   &__img {
//     cursor: pointer;
//     width: 128px;
//     height: auto;
//     position: relative;
//     &-mask {
//       opacity: 0;
//       width: 100%;
//       height: 100%;
//       background: rgba(0, 0, 0, 0.12);
//       position: absolute;
//       z-index: 1;
//       top: 0;
//       left: 0;
//     }
//   }
//   &__img:hover {
//     background: rgba(0, 0, 0, 0.04);
//   }
//   &__img:hover > &__img-mask {
//     opacity: 1;
//   }
// }

.loading {
  padding-top: 1rem;
  text-align: center;
  font-size: 14px;
  color: #999;
}

.upload-psd {
  margin: 0 1rem;
  width: calc(100% - 2rem);
}
</style>
