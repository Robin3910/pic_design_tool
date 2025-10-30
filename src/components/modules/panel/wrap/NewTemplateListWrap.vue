<!--
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 新后端模板列表组件 (48080端口)
-->
<template>
  <div class="wrap">
    <search-header v-model="state.searchKeyword" @change="cateChange" />

    <el-divider v-show="state.title" style="margin-top: 1.7rem" content-position="left">
      <span style="font-weight: bold">{{ state.title }}</span>
    </el-divider>

    <el-button class="upload-psd" plain type="primary" @click="openPSD">导入 PSD 创建模板</el-button>

    <!-- 错误提示 -->
    <el-alert
      v-if="templateStore.error"
      :title="templateStore.error"
      type="error"
      show-icon
      closable
      @close="templateStore.clearError"
      style="margin: 1rem;"
    />

    <ul ref="listRef" v-infinite-scroll="load" class="infinite-list" :infinite-scroll-distance="150" style="overflow: auto">
      <img-water-fall :listData="convertedList" @select="selectItem" />
      
      <!-- 模板统计信息 -->
      <div v-if="templateStore.templates.length > 0" class="template-stats">
        <el-card shadow="never" style="margin: 1rem;">
          <div class="stats-content">
            <div class="stat-item">
              <span class="stat-label">总模板数:</span>
              <span class="stat-value">{{ templateStore.templates.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">启用模板:</span>
              <span class="stat-value">{{ enabledTemplatesCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">禁用模板:</span>
              <span class="stat-value">{{ disabledTemplatesCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">数据来源:</span>
              <span class="stat-value">新后端 (48080)</span>
            </div>
          </div>
        </el-card>
      </div>
      
      <div v-show="templateStore.loading" class="loading">
        <i class="el-icon-loading"></i> 拼命加载中
      </div>
      <div v-show="state.loadDone" class="loading">全部加载完毕</div>
    </ul>
    
    <!-- 模板详情卡片 -->
    <TemplateDetailCard 
      v-if="selectedTemplate"
      :template="selectedTemplate"
      @select="handleTemplateSelect"
      @preview="handleTemplatePreview"
      @view-data="handleViewTemplateData"
    />
    
    <!-- 模板数据查看器 -->
    <TemplateDataViewer
      :visible="showDataViewer"
      :template="selectedTemplate"
      @close="handleCloseDataViewer"
      @use-template="handleUseTemplate"
    />
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { LocationQueryValue, useRoute, useRouter } from 'vue-router'
import searchHeader from './components/searchHeader.vue'
import useConfirm from '@/common/methods/confirm'
import imgWaterFall from './components/imgWaterFall.vue'
import TemplateDetailCard from './components/TemplateDetailCard.vue'
import TemplateDataViewer from './components/TemplateDataViewer.vue'
import { useControlStore, useCanvasStore, useUserStore, useHistoryStore, useWidgetStore, useForceStore, useTemplateStore } from '@/store'
import { storeToRefs } from 'pinia'
import type { Template } from '@/api/template'

type TState = {
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
  loadDone: false,
  title: '新后端模板',
  searchKeyword: '',
})

// 模板详情相关状态
const selectedTemplate = ref<Template | null>(null)
const showDataViewer = ref(false)

const { dHistoryParams } = storeToRefs(useHistoryStore())

const pageOptions: TPageOptions = { pageNo: 1, pageSize: 20 }
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
    updateTime: template.updateTime
  }))
})

// 生成默认封面（当没有封面时）
function getDefaultCover(template: Template): string {
  // 可以根据模板的宽高比生成一个默认的占位图
  const width = template.width || 750
  const height = template.height || 1334
  const ratio = width / height
  
  // 生成一个简单的SVG占位图
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="#999">
        ${template.title || template.name || '模板'}
      </text>
      <text x="50%" y="60%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="#ccc">
        ${width} × ${height}
      </text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

// 计算启用和禁用的模板数量
const enabledTemplatesCount = computed(() => {
  return templateStore.templates.filter(template => template.state === 1).length
})

const disabledTemplatesCount = computed(() => {
  return templateStore.templates.filter(template => template.state === 0).length
})

onMounted(async () => {
  await load(true)
})

const load = async (init: boolean = false, stat?: number | string) => {
  stat && (pageOptions.state = stat)

  if (init && listRef.value) {
    listRef.value.scrollTop = 0
    templateStore.clearTemplates()
    pageOptions.pageNo = 1
    state.loadDone = false
  }
  
  if (state.loadDone || templateStore.loading) {
    return
  }

  try {
    const result = await templateStore.fetchTemplatePage(pageOptions)
    
    // 检查是否还有更多数据
    if (result.list.length < pageOptions.pageSize) {
      state.loadDone = true
    } else {
      pageOptions.pageNo += 1
    }
    
    setTimeout(() => {
      checkHeight()
    }, 100)
  } catch (error) {
    console.error('加载模板失败:', error)
    state.loadDone = true
  }
}

function cateChange(type: any) {
  state.title = type.name
  const init = pageOptions.state != type.id
  pageOptions.state = type.id
  load(init, pageOptions.state)
}

function checkHeight() {
  if (!listRef.value) return
  // 检查高度是否占满，否则继续请求下一页
  const isLess = listRef.value.offsetHeight > (listRef.value.firstElementChild as HTMLElement)?.offsetHeight
  isLess && load()
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

// 处理模板详情选择
const handleTemplateSelect = (template: Template) => {
  selectedTemplate.value = template
}

// 处理模板预览
const handleTemplatePreview = (template: Template) => {
  console.log('预览模板:', template)
  // 这里可以添加预览逻辑
}

// 处理查看模板数据
const handleViewTemplateData = (template: Template) => {
  selectedTemplate.value = template
  showDataViewer.value = true
}

// 处理使用模板
const handleUseTemplate = (template: Template) => {
  selectItem({
    id: template.id,
    title: template.title,
    cover: template.cover,
    width: template.width,
    height: template.height,
    data: template.data,
    name: template.name,
    createTime: template.createTime,
    state: template.state
  })
  showDataViewer.value = false
}

// 关闭数据查看器
const handleCloseDataViewer = () => {
  showDataViewer.value = false
  selectedTemplate.value = null
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

.template-stats {
  margin-top: 1rem;
  
  .stats-content {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: space-around;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 120px;
      
      .stat-label {
        font-size: 12px;
        color: #999;
        margin-bottom: 4px;
      }
      
      .stat-value {
        font-size: 18px;
        font-weight: bold;
        color: #333;
      }
    }
  }
}
</style>
