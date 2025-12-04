<!--
 * @Author: AI Assistant
 * @Date: 2025-01-XX
 * @Description: 替换素材列表 - 显示newSetImageUrls字段中的替换图片
-->
<template>
  <div class="wrap">
    <div class="header-with-refresh">
      <span class="header-title">历史</span>
      <div class="header-actions">
        <el-button 
          text
          size="small"
          @click="handleOpenDetail"
          class="detail-btn"
          title="查看详情"
          :disabled="state.localImages.length === 0"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;">
            <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5C16.478 5 20.268 7.943 21.542 12C20.268 16.057 16.478 19 12 19C7.523 19 3.732 16.057 2.458 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="margin-left: 4px;">查看详情</span>
        </el-button>
      <el-button 
        text
        size="small"
        :loading="state.refreshing"
        @click="handleRefresh"
        class="refresh-btn"
        title="刷新"
      >
        <RefreshIcon v-if="!state.refreshing" size="16" />
        <i v-else class="el-icon-loading" />
      </el-button>
      </div>
    </div>
    <div style="height: 0.5rem" />
    <div 
      ref="scrollContainerRef"
      v-infinite-scroll="load" 
      class="local-images-container infinite-list"
      :infinite-scroll-distance="150"
    >
      <div v-if="state.localImages.length === 0 && !state.loading" class="empty-state">
        <p>暂无替换素材</p>
        <p>尝试刷新或检查接口数据</p>
      </div>
      <div v-else class="images-grid-wrapper">
        <div 
          v-for="([date, images], groupIndex) in groupedLocalImages"
          :key="`${date}-${groupIndex}`"
          class="date-group"
        >
          <div class="date-header">{{ date }}</div>
          <div class="images-grid">
            <div 
              v-for="(image, index) in images" 
              :key="`${image.url}-${index}`"
              class="image-item readonly"
            >
              <el-image 
                :src="getImageUrlWithTimestamp(image.url)" 
                fit="contain" 
                lazy 
                loading="lazy"
                class="image-thumb"
                :key="`${image.url}-${state.refreshTimestamp}`"
              >
                <template #placeholder>
                  <div class="image-placeholder">
                    <i class="el-icon-picture"></i>
                  </div>
                </template>
                <template #error>
                  <div class="image-error">
                    <i class="el-icon-warning"></i>
                  </div>
                </template>
              </el-image>
              <div class="undo-btn" @click.stop="handleDelete(image)" title="删除">
                <img src="/删除.svg" alt="删除" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-show="state.loading" class="loading"><i class="el-icon-loading" /> 拼命加载中</div>
      <div v-show="state.loadDone && state.localImages.length > 0" class="loading">全部加载完毕</div>
    </div>
    
    <!-- 图片预览弹窗 -->
    <el-dialog
      v-model="state.previewVisible"
      title="图片预览"
      width="70%"
      :before-close="handlePreviewClose"
      class="image-preview-dialog"
      align-center
      :close-on-click-modal="true"
      :append-to-body="true"
    >
      <div class="preview-content">
        <el-button 
          class="nav-btn prev-btn"
          :disabled="state.previewIndex <= 0"
          @click="handlePrevImage"
          circle
        >
          <PrevIcon :size="20" />
        </el-button>
        <div class="preview-images-container">
          <div class="preview-image-wrapper">
            <div class="image-label">预览图片</div>
        <img 
          v-if="state.previewImage?.url"
              :src="getImageUrlWithTimestamp(state.previewImage.url)" 
          class="preview-image"
          alt="预览图片"
              :key="`preview-${state.previewImage.url}-${state.refreshTimestamp}`"
            />
          </div>
          <div class="preview-image-wrapper" v-if="state.previewImage?.effectiveImgUrl">
            <div class="image-label">对比图片 (effective_img_url)</div>
            <img 
              :src="getImageUrlWithTimestamp(state.previewImage.effectiveImgUrl)" 
              class="preview-image compare-image"
              alt="对比图片"
              :key="`compare-${state.previewImage.effectiveImgUrl}-${state.refreshTimestamp}`"
            />
          </div>
        </div>
        <el-button 
          class="nav-btn next-btn"
          :disabled="state.previewIndex >= state.localImages.length - 1"
          @click="handleNextImage"
          circle
        >
          <NextIcon :size="20" />
        </el-button>
      </div>
      <div class="preview-info" v-if="state.previewImage">
        <p><strong>名称:</strong> {{ state.previewImage.name }}</p>
        <p><strong>URL:</strong> <span class="url-text">{{ state.previewImage.url }}</span></p>
        <p v-if="state.previewImage.orderNo">
          <strong>订单编号:</strong> {{ state.previewImage.orderNo }}
        </p>
        <p v-if="state.previewImage.categoryName">
          <strong>类目名称:</strong> {{ state.previewImage.categoryName }}
        </p>
        <p v-if="state.previewImage.sortIndex != null">
          <strong>需重制图片的序号:</strong> {{ state.previewImage.sortIndex }}
        </p>
        <p v-if="state.localImages.length > 0" class="image-counter">
          {{ state.previewIndex + 1 }} / {{ state.localImages.length }}
        </p>
      </div>
      <template #footer>
        <div class="preview-footer">
          <el-button type="danger" @click="handleDeleteFromPreview">删除</el-button>
          <el-button @click="handlePreviewClose">关闭</el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 详情弹窗 -->
    <el-dialog
      v-model="state.detailVisible"
      title="历史详情"
      width="90%"
      :before-close="handleCloseDetail"
      class="detail-dialog"
      align-center
      :close-on-click-modal="true"
      :append-to-body="true"
      top="5vh"
    >
      <div 
        ref="detailScrollRef"
        v-infinite-scroll="loadDetailMore"
        class="detail-images-container"
        :infinite-scroll-distance="200"
        style="max-height: 80vh; overflow-y: auto;"
      >
        <div v-if="state.detailImages.length === 0 && !state.detailLoading" class="empty-state">
          <p>暂无图片</p>
        </div>
        <div v-else class="detail-groups">
          <div
            v-for="([date, images], groupIndex) in groupedDetailImages"
            :key="`detail-${date}-${groupIndex}`"
            class="detail-date-group"
          >
            <div class="date-header">{{ date }}</div>
          <div class="detail-images-grid">
            <div 
              v-for="(image, index) in images" 
              :key="`detail-${image.url}-${index}`"
              class="detail-image-item"
              @click="handleImageClick(image)"
            >
              <el-image 
                :src="getImageUrlWithTimestamp(image.url)" 
                fit="contain" 
                lazy 
                loading="lazy"
                class="detail-image-thumb"
                :key="`detail-${image.url}-${state.refreshTimestamp}`"
              >
                <template #placeholder>
                  <div class="image-placeholder">
                    <i class="el-icon-picture"></i>
                  </div>
                </template>
                <template #error>
                  <div class="image-error">
                    <i class="el-icon-warning"></i>
                  </div>
                </template>
              </el-image>
              <div class="detail-delete-btn" @click.stop="handleDelete(image)" title="删除">
                <img src="/删除.svg" alt="删除" />
              </div>
            </div>
          </div>
          </div>
        </div>
        <div v-show="state.detailLoading" class="loading"><i class="el-icon-loading" /> 加载中...</div>
        <div v-show="state.detailLoadDone && state.detailImages.length > 0" class="loading">全部加载完毕</div>
      </div>
      <template #footer>
        <div class="detail-footer">
          <span class="image-count">共 {{ state.detailImages.length }} 张图片</span>
          <el-button @click="handleCloseDetail">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 从接口加载替换素材图片（只读展示，不支持编辑添加）
import { reactive, onMounted, onBeforeUnmount, ref, nextTick, computed } from 'vue'
import RefreshIcon from '@/components/common/Icon/RefreshIcon.vue'
import PrevIcon from '@/components/common/Icon/PrevIcon.vue'
import NextIcon from '@/components/common/Icon/NextIcon.vue'
import api from '@/api'
import { ElMessage } from 'element-plus'
import { useUiStore } from '@/store'

type TProps = {
  active?: boolean
}

type TLocalImage = {
  name: string
  url: string
  thumb?: string
  // 排序字段（不显示）
  sortId?: number | string
  sortIndex?: number
  // 显示字段
  orderNo?: string
  categoryName?: string
  // 对比图片URL
  effectiveImgUrl?: string
  // 创建时间原始值
  createdAt?: string | number
  // 分组用的日期（yyyy-MM-dd），按 create_time/created_at 等字段解析
  groupDate?: string
}

type TState = {
  localImages: TLocalImage[]
  refreshing: boolean
  loading: boolean
  loadDone: boolean
  previewVisible: boolean
  previewImage: TLocalImage | null
  previewIndex: number
  total: number
  refreshTimestamp: number
  detailVisible: boolean
  detailLoading: boolean
  detailLoadDone: boolean
  detailImages: TLocalImage[]
}

const props = defineProps<TProps>()

const state = reactive<TState>({
  localImages: [],
  refreshing: false,
  loading: false,
  loadDone: false,
  previewVisible: false,
  previewImage: null,
  previewIndex: -1,
  total: 0,
  refreshTimestamp: Date.now(),
  detailVisible: false,
  detailLoading: false,
  detailLoadDone: false,
  detailImages: [],
})

const scrollContainerRef = ref<HTMLElement | null>(null)
const detailScrollRef = ref<HTMLElement | null>(null)
const uiStore = useUiStore()

const pageOptions = { pageNo: 1, pageSize: 20 }
const detailPageOptions = { pageNo: 1, pageSize: 50 }

// 任务数据缓存：key 为 taskId，value 为任务数据
const taskCache = new Map<number, any>()

// 获取图片在原始列表中的索引
const getImageIndex = (image: TLocalImage): number => {
  return state.localImages.findIndex(
    img => img.url === image.url && img.name === image.name
  )
}

// 获取带时间戳的图片URL，用于强制刷新图片缓存
const getImageUrlWithTimestamp = (url: string): string => {
  if (!url) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}_t=${state.refreshTimestamp}`
}

onMounted(() => {
  loadImagesFromApi(true)
})

onBeforeUnmount(() => {
  // 清理事件监听
})

const loadImagesFromApi = async (init: boolean = false) => {
  if (init) {
    state.localImages = []
    pageOptions.pageNo = 1
    state.loadDone = false
  }
  if (state.loadDone || state.loading) {
    return
  }
  state.loading = true
  try {
    const res = await api.redrawTask.getRedrawTaskPage({ 
      pageNo: pageOptions.pageNo, 
      pageSize: pageOptions.pageSize 
    })
    const list = res.data?.list || []
    // 保存总数（只在初始化时更新）
    if (init) {
      state.total = res.data?.total ?? 0
    }
    const results: TLocalImage[] = []
    // 提取 URL 文件名结尾的数字作为序号（如 xxx_12.jpg => 12）
    const extractIndexFromUrl = (u: string): number | null => {
      try {
        const withoutQuery = u.split('?')[0]
        const lastSlash = withoutQuery.lastIndexOf('/')
        const fileName = lastSlash >= 0 ? withoutQuery.slice(lastSlash + 1) : withoutQuery
        const nameOnly = fileName.replace(/\.[^.]*$/, '')
        const match = nameOnly.match(/(\d+)$/)
        return match ? parseInt(match[1], 10) : null
      } catch (e) {
        return null
      }
    }

    list.forEach((item: any) => {
      // 缓存任务数据，用于删除操作
      if (item.id) {
        taskCache.set(item.id, item)
      }

      // 从 newSetImageUrls 字段获取替换素材
      let str = item.newSetImageUrls ?? item.new_set_image_urls
      if (typeof str !== 'string' || str.trim().length === 0) return

      // 解析已完成序号（支持 number、字符串"1,2,3"、数组）
      const raw = (item as any).finished_index ?? (item as any).finishedIndex
      let indices: number[] = []
      if (Array.isArray(raw)) {
        indices = raw.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n))
      } else if (typeof raw === 'string') {
        indices = raw
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n))
      } else if (typeof raw === 'number') {
        indices = [raw]
      }

      if (indices.length === 0) return
      const indexSet = new Set(indices)

      const imageList: string[] = str
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)

      imageList.forEach((u) => {
        const idx = extractIndexFromUrl(u)
        if (idx != null && indexSet.has(idx)) {
          const name = `${item.id ?? ''}_replace_${idx}`
          // 去重：如果该 URL 已添加则跳过
          if (!results.find((r) => r.url === u)) {
            // 获取 effectiveImgUrl（兼容驼峰和蛇形命名）
            const effectiveImgUrl = (item as any).effectiveImgUrl ?? (item as any).effective_img_url ?? ''
            // 原始创建时间（优先使用 create_time 字段）
            const createdAtRaw =
              (item as any).create_time ??
              (item as any).createTime ??
              (item as any).created_at ??
              (item as any).createdAt ??
              (item as any).gmt_create ??
              (item as any).gmtCreate ??
              ''

            // 计算按天分组用的日期（yyyy-MM-dd）
            let groupDate = '未知日期'
            if (createdAtRaw != null && createdAtRaw !== '') {
              // 统一转字符串，兼容字符串/时间戳
              const rawStr = String(createdAtRaw).trim()
              // 如果是纯数字，按时间戳处理
              if (/^\d+$/.test(rawStr)) {
                const num = Number(rawStr)
                // 10 位视为秒，13 位视为毫秒
                const ts = rawStr.length === 10 ? num * 1000 : num
                const d = new Date(ts)
                if (!isNaN(d.getTime())) {
                  const y = d.getFullYear()
                  const m = String(d.getMonth() + 1).padStart(2, '0')
                  const day = String(d.getDate()).padStart(2, '0')
                  groupDate = `${y}-${m}-${day}`
                }
              } else {
                // 字符串时间，优先匹配 yyyy-MM-dd
                const match = rawStr.match(/\d{4}-\d{2}-\d{2}/)
                if (match && match[0]) {
                  groupDate = match[0]
                } else {
                  const datePart = rawStr.split('T')[0].split(' ')[0]
                  if (datePart) {
                    groupDate = datePart
                  }
                }
              }
            }

            results.push({ 
              name, 
              url: u, 
              thumb: u,
              sortId: item.id ?? '',
              sortIndex: idx,
              orderNo: item.orderNo || item.order_no || '',
              categoryName: item.categoryName || item.category_name || '',
              effectiveImgUrl: effectiveImgUrl && typeof effectiveImgUrl === 'string' && effectiveImgUrl.trim() ? effectiveImgUrl.trim() : undefined,
              createdAt: createdAtRaw,
              groupDate,
            })
          }
        }
      })
    })
    
    // 不排序，保持接口输出的原始顺序
    if (init) {
      state.localImages = results
      // 初始加载完成后，重置滚动位置到顶部
      await nextTick()
      if (scrollContainerRef.value) {
        scrollContainerRef.value.scrollTop = 0
      }
    } else {
      // 追加新数据，需要去重
      results.forEach(newItem => {
        if (!state.localImages.find(existing => existing.name === newItem.name && existing.url === newItem.url)) {
          state.localImages.push(newItem)
        }
      })
      // 不排序，保持接口输出的原始顺序
    }
    
    // 判断是否还有更多数据
    if (results.length === 0 || list.length < pageOptions.pageSize) {
      state.loadDone = true
    } else {
      pageOptions.pageNo += 1
    }
  } catch (e) {
    console.error('加载替换素材失败:', e)
    if (init) {
      state.localImages = []
    }
    state.loadDone = true
    ElMessage.error('加载替换素材失败')
  } finally {
    state.loading = false
  }
}

const load = () => {
  loadImagesFromApi(false)
}

const handleRefresh = async () => {
  if (state.refreshing) return
  state.refreshing = true
  // 更新时间戳，强制浏览器重新加载图片
  state.refreshTimestamp = Date.now()
  await loadImagesFromApi(true)
  // 刷新后重置滚动位置到顶部
  await nextTick()
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0
  }
  state.refreshing = false
}

// 打开详情弹窗
const handleOpenDetail = () => {
  state.detailVisible = true
  state.detailImages = []
  detailPageOptions.pageNo = 1
  state.detailLoadDone = false
  loadDetailImages(true)
}

// 关闭详情弹窗
const handleCloseDetail = () => {
  state.detailVisible = false
  state.detailImages = []
  detailPageOptions.pageNo = 1
  state.detailLoadDone = false
}

// 加载详情弹窗中的图片
const loadDetailImages = async (init: boolean = false) => {
  if (init) {
    state.detailImages = []
    detailPageOptions.pageNo = 1
    state.detailLoadDone = false
  }
  if (state.detailLoadDone || state.detailLoading) {
    return
  }
  state.detailLoading = true
  try {
    const res = await api.redrawTask.getRedrawTaskPage({ 
      pageNo: detailPageOptions.pageNo, 
      pageSize: detailPageOptions.pageSize 
    })
    const list = res.data?.list || []
    const results: TLocalImage[] = []
    
    const extractIndexFromUrl = (u: string): number | null => {
      try {
        const withoutQuery = u.split('?')[0]
        const lastSlash = withoutQuery.lastIndexOf('/')
        const fileName = lastSlash >= 0 ? withoutQuery.slice(lastSlash + 1) : withoutQuery
        const nameOnly = fileName.replace(/\.[^.]*$/, '')
        const match = nameOnly.match(/(\d+)$/)
        return match ? parseInt(match[1], 10) : null
      } catch (e) {
        return null
      }
    }

    list.forEach((item: any) => {
      if (item.id) {
        taskCache.set(item.id, item)
      }

      let str = item.newSetImageUrls ?? item.new_set_image_urls
      if (typeof str !== 'string' || str.trim().length === 0) return

      const raw = (item as any).finished_index ?? (item as any).finishedIndex
      let indices: number[] = []
      if (Array.isArray(raw)) {
        indices = raw.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n))
      } else if (typeof raw === 'string') {
        indices = raw
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n))
      } else if (typeof raw === 'number') {
        indices = [raw]
      }

      if (indices.length === 0) return
      const indexSet = new Set(indices)

      const imageList: string[] = str
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)

      imageList.forEach((u) => {
        const idx = extractIndexFromUrl(u)
        if (idx != null && indexSet.has(idx)) {
          const name = `${item.id ?? ''}_replace_${idx}`
          if (!results.find((r) => r.url === u)) {
            const effectiveImgUrl = (item as any).effectiveImgUrl ?? (item as any).effective_img_url ?? ''

            const createdAtRaw =
              (item as any).create_time ??
              (item as any).createTime ??
              (item as any).created_at ??
              (item as any).createdAt ??
              (item as any).gmt_create ??
              (item as any).gmtCreate ??
              ''

            let groupDate = '未知日期'
            if (createdAtRaw != null && createdAtRaw !== '') {
              const rawStr = String(createdAtRaw).trim()
              if (/^\d+$/.test(rawStr)) {
                const num = Number(rawStr)
                const ts = rawStr.length === 10 ? num * 1000 : num
                const d = new Date(ts)
                if (!isNaN(d.getTime())) {
                  const y = d.getFullYear()
                  const m = String(d.getMonth() + 1).padStart(2, '0')
                  const day = String(d.getDate()).padStart(2, '0')
                  groupDate = `${y}-${m}-${day}`
                }
              } else {
                const match = rawStr.match(/\d{4}-\d{2}-\d{2}/)
                if (match && match[0]) {
                  groupDate = match[0]
                } else {
                  const datePart = rawStr.split('T')[0].split(' ')[0]
                  if (datePart) {
                    groupDate = datePart
                  }
                }
              }
            }
            results.push({ 
              name, 
              url: u, 
              thumb: u,
              sortId: item.id ?? '',
              sortIndex: idx,
              orderNo: item.orderNo || item.order_no || '',
              categoryName: item.categoryName || item.category_name || '',
              effectiveImgUrl: effectiveImgUrl && typeof effectiveImgUrl === 'string' && effectiveImgUrl.trim() ? effectiveImgUrl.trim() : undefined,
              createdAt: createdAtRaw,
              groupDate,
            })
          }
        }
      })
    })
    
    if (init) {
      state.detailImages = results
      await nextTick()
      if (detailScrollRef.value) {
        detailScrollRef.value.scrollTop = 0
      }
    } else {
      results.forEach(newItem => {
        if (!state.detailImages.find(existing => existing.name === newItem.name && existing.url === newItem.url)) {
          state.detailImages.push(newItem)
        }
      })
    }
    
    if (results.length === 0 || list.length < detailPageOptions.pageSize) {
      state.detailLoadDone = true
    } else {
      detailPageOptions.pageNo += 1
    }
  } catch (e) {
    console.error('加载详情图片失败:', e)
    if (init) {
      state.detailImages = []
    }
    state.detailLoadDone = true
    ElMessage.error('加载图片失败')
  } finally {
    state.detailLoading = false
  }
}

// 按日期分组工具函数
const groupImagesByDate = (images: TLocalImage[]) => {
  const map = new Map<string, TLocalImage[]>()

  images.forEach((img) => {
    const dateKey = img.groupDate || '未知日期'
    if (!map.has(dateKey)) {
      map.set(dateKey, [])
    }
    map.get(dateKey)!.push(img)
  })

  // 按日期倒序排序（新的在上面）
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
}

const groupedLocalImages = computed(() => groupImagesByDate(state.localImages))
const groupedDetailImages = computed(() => groupImagesByDate(state.detailImages))

// 详情弹窗滚动加载
const loadDetailMore = () => {
  loadDetailImages(false)
}

// 点击图片预览
const handleImageClick = (image: TLocalImage) => {
  const images = state.detailVisible ? state.detailImages : state.localImages
  const index = images.findIndex(img => img.url === image.url && img.name === image.name)
  state.previewIndex = index >= 0 ? index : 0
  state.previewImage = image
  state.previewVisible = true
}

// 切换到上一张图片
const handlePrevImage = () => {
  const images = state.detailVisible ? state.detailImages : state.localImages
  if (state.previewIndex > 0) {
    state.previewIndex--
    state.previewImage = images[state.previewIndex]
  }
}

// 切换到下一张图片
const handleNextImage = async () => {
  const images = state.detailVisible ? state.detailImages : state.localImages
  const loadMore = state.detailVisible ? loadDetailImages : loadImagesFromApi
  const loadDone = state.detailVisible ? state.detailLoadDone : state.loadDone
  const loading = state.detailVisible ? state.detailLoading : state.loading
  
  if (state.previewIndex < images.length - 1) {
    const nextIndex = state.previewIndex + 1
    if (nextIndex < images.length) {
      state.previewIndex = nextIndex
      state.previewImage = images[nextIndex]
    } else {
      if (!loadDone && !loading) {
        await loadMore(false)
        if (nextIndex < images.length) {
          state.previewIndex = nextIndex
          state.previewImage = images[nextIndex]
        }
      }
    }
  }
}

// 关闭预览弹窗
const handlePreviewClose = () => {
  state.previewVisible = false
  // 延迟清空预览图片，等待弹窗关闭动画完成
  setTimeout(() => {
    state.previewImage = null
  }, 300)
}

// 从预览界面删除图片
const handleDeleteFromPreview = async () => {
  if (!state.previewImage) {
    ElMessage.warning('没有可删除的图片')
    return
  }
  
  const currentImage = state.previewImage
  const currentIndex = state.previewIndex
  
  // 调用删除函数（会刷新数据）
  await handleDelete(currentImage)
  
  // 删除成功后，由于数据已刷新，需要重新计算索引
  // 如果还有图片，尝试显示下一张；如果没有下一张，显示上一张；如果都没有，关闭预览
  if (state.localImages.length === 0) {
    // 没有图片了，关闭预览
    handlePreviewClose()
  } else if (currentIndex < state.localImages.length) {
    // 如果当前索引还在范围内，显示当前索引的图片（删除后，后面的图片会前移）
    state.previewIndex = currentIndex
    state.previewImage = state.localImages[currentIndex]
  } else if (currentIndex > 0 && state.localImages.length > 0) {
    // 如果当前索引超出范围，显示最后一张
    state.previewIndex = state.localImages.length - 1
    state.previewImage = state.localImages[state.previewIndex]
  } else {
    // 没有图片了，关闭预览
    handlePreviewClose()
  }
}

// 删除图片
const handleDelete = async (image: TLocalImage | null) => {
  
  if (!image) {
    return
  }
  
  if (!image.sortId || image.sortIndex == null) {
    ElMessage.warning('无法删除：缺少必要的任务信息')
    return
  }
  
  const index = getImageIndex(image)

  try {
    // 查询任务记录详情
    const taskId = typeof image.sortId === 'string' ? parseInt(image.sortId, 10) : image.sortId
    if (isNaN(taskId)) {
      ElMessage.error('任务ID格式错误')
      return
    }

    // 优先使用缓存的任务数据
    let task = taskCache.get(taskId) || null
    
    // 如果缓存中没有，使用 getRedrawTaskPage 接口查询（通过 taskId 参数）
    if (!task) {
      console.log(`任务 ${taskId} 不在缓存中，从接口查询`)
      try {
        const res = await api.redrawTask.getRedrawTaskPage({ 
          taskId: String(taskId),
          pageNo: 1,
          pageSize: 1
        })
        const list = res.data?.list || []
        task = list.find((item: any) => item.id === taskId) || null
        
        // 如果找到任务，更新缓存
        if (task) {
          taskCache.set(taskId, task)
        }
      } catch (error) {
        console.error(`查询任务记录失败 (ID: ${taskId}):`, error)
      }
    } else {
      console.log(`任务 ${taskId} 使用缓存数据`)
    }

    if (!task) {
      ElMessage.error('任务记录不存在')
      return
    }

    // 从 newSetImageUrls 中移除对应 URL（兼容驼峰和蛇形命名）
    const rawNewSetImageUrls = (task as any).newSetImageUrls ?? (task as any).new_set_image_urls ?? ''
    const existingUrls = rawNewSetImageUrls
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0)
    
    // 移除匹配的 URL
    const newUrls = existingUrls.filter((url: string) => url !== image.url)
    const newSetImageUrls = newUrls.length > 0 ? newUrls.join(',') : ''

    // 从 finishedIndex 中移除对应序号（兼容驼峰和蛇形命名）
    const rawFinished = (task as any).finished_index ?? (task as any).finishedIndex ?? ''
    const finishedIndices = (typeof rawFinished === 'string' ? rawFinished : '')
      .split(',')
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((n: number) => !isNaN(n) && n !== image.sortIndex)
    const finishedIndex = finishedIndices.length > 0
      ? finishedIndices.sort((a: number, b: number) => a - b).join(',')
      : ''

    // 将删除的序号添加到 needRedrawIndex 中（兼容驼峰和蛇形命名）
    const rawNeedRedraw = (task as any).need_redraw_index ?? (task as any).needRedrawIndex ?? ''
    const needRedrawIndices = (typeof rawNeedRedraw === 'string' ? rawNeedRedraw : '')
      .split(',')
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((n: number) => !isNaN(n))
    
    // 如果删除的序号不在 needRedrawIndex 中，则添加
    if (image.sortIndex != null && !needRedrawIndices.includes(image.sortIndex)) {
      needRedrawIndices.push(image.sortIndex)
    }
    const needRedrawIndex = needRedrawIndices.length > 0
      ? needRedrawIndices.sort((a: number, b: number) => a - b).join(',')
      : ''

    // 获取 orderId 和 orderNo（兼容驼峰和蛇形命名）
    const orderId = (task as any).orderId ?? (task as any).order_id
    const orderNo = (task as any).orderNo ?? (task as any).order_no

    // 调用更新接口
    await api.redrawTask.updateRedrawTask({
      id: task.id,
      orderId: orderId,
      orderNo: orderNo,
      newSetImageUrls,
      finishedIndex,
      needRedrawIndex,
    })

    // 删除成功后，刷新数据以确保显示最新状态
    await handleRefresh()
    // 如果详情弹窗打开，也刷新详情数据
    if (state.detailVisible) {
      await loadDetailImages(true)
    }

    ElMessage.success('删除成功')
  } catch (error) {
    console.error('删除图片失败:', error)
    ElMessage.error('删除失败，请稍后重试')
  }
}

defineExpose({
  handleRefresh,
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

.wrap {
  width: 100%;
  height: 100%;
  padding: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  /* 稍微加深灰度，让白色图片边框更清晰 */
  background: #e5e5ea;
}

.local-images-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 0 0.75rem 150px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: @apple-text-secondary;
  
  p {
    margin: 0.5rem 0;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
}

.images-grid-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.date-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  padding-top: 1.5rem;
}

.date-header {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 13px;
  font-weight: 600;
  color: #111;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  /* 胶囊背景 */
  background: linear-gradient(135deg, #fefefe 0%, #f2f2f7 100%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0.25rem 0.8rem 0.25rem 2.25rem;
  border-radius: 999px;
  width: fit-content;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  margin-left: 0.5rem;
  
  &:before {
    content: '';
    position: absolute;
    left: 0.75rem;
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #007aff, #0040dd);
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
  }
  
  &:after {
    content: '';
    position: absolute;
    left: 1rem;
    top: -1rem;
    bottom: -2rem;
    width: 1px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.02) 100%);
  }
}

.category-group,
.detail-category-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category-header {
  font-size: 12px;
  font-weight: 500;
  color: @apple-text-secondary;
  padding: 0 0.25rem;
}

.images-grid {
  /* 使用弹性布局，让每张图片的卡片尺寸尽量贴合图片本身，而不是统一网格尺寸 */
  display: flex;
  flex-wrap: wrap;
  gap: 0.875rem;
  padding: 0.25rem 0;
  align-items: flex-start;
}

.image-item {
  /* 不做圆角裁切，也不裁剪内容，保证图片可以完整显示 */
  overflow: visible;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid @apple-border;
  box-shadow: 0 2px 8px @apple-shadow;
  border-radius: 0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* 左侧栏宽度有限，这里固定为一行两张，保证不会只剩一张一行 */
  flex: 0 1 calc(50% - 0.5rem);
  max-width: calc(50% - 0.5rem);
  
  &.readonly {
    cursor: default;
    opacity: 0.95;
    
    &:hover {
      opacity: 1;
      box-shadow: 0 4px 12px @apple-shadow-hover;
      transform: translateY(-2px);
      border-color: rgba(0, 0, 0, 0.1);
      
      .undo-btn {
        opacity: 1;
        visibility: visible;
      }
    }
  }
}

.image-thumb {
  /* 让图片尺寸尽量决定卡片尺寸，必要时在列内收敛 */
  width: auto;
  max-width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  background: #ffffff;
  margin: 0 auto;
}

.image-placeholder,
.image-error {
  width: 100%;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(245, 245, 245, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: @apple-text-secondary;
  font-size: 2rem;
}

.image-error {
  background: rgba(255, 230, 230, 0.6);
  color: #ff6b6b;
}


.undo-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 50%;
  border: 1px solid @apple-border;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  color: #f56c6c;
  
  &:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  img {
    width: 14px;
    height: 14px;
    object-fit: contain;
  }
}

.loading {
  padding-top: 1.5rem;
  text-align: center;
  font-size: 13px;
  color: @apple-text-secondary;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.header-with-refresh {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 1.5rem 0 0.75rem 0;
  padding: 0 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-btn {
  padding: 6px 12px;
  min-width: auto;
  border-radius: 8px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: @apple-text-primary;
  
  &:hover:not(:disabled) {
    background: rgba(0, 122, 255, 0.1);
    color: #007AFF;
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.header-title {
  font-weight: 600;
  font-size: 15px;
  color: @apple-text-primary;
  letter-spacing: -0.02em;
}

:deep(.refresh-btn) {
  padding: 6px;
  min-width: auto;
  border-radius: 8px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: rgba(0, 0, 0, 0.06);
    transform: rotate(90deg);
  }
}

// 图片预览弹窗样式
:deep(.image-preview-dialog) {
  .el-dialog {
    border-radius: 0;
    overflow: hidden;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
    background: #e5e5ea;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  
  .el-dialog__header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid @apple-border;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    
    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: @apple-text-primary;
      letter-spacing: -0.02em;
    }
  }
  
  .preview-content {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    min-height: 400px;
    max-height: 75vh;
    overflow: auto;
    background: rgba(248, 248, 248, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 0;
    padding: 24px;
    
    .nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      width: 44px;
      height: 44px;
      font-size: 18px;
      background: @apple-bg;
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid @apple-border;
      box-shadow: 0 4px 16px @apple-shadow-hover;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 6px 24px @apple-shadow-hover;
        transform: translateY(-50%) scale(1.1);
        border-color: @apple-accent;
      }
      
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      
      &.prev-btn {
        left: 24px;
      }
      
      &.next-btn {
        right: 24px;
      }
    }
    
    .preview-images-container {
      display: flex;
      gap: 24px;
      width: 100%;
      max-width: 1200px;
      justify-content: center;
      align-items: flex-start;
      
      .preview-image-wrapper {
        flex: 1;
        min-width: 0;
        max-width: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        
        &:only-child {
          max-width: 100%;
        }
        
        .image-label {
          font-size: 14px;
          font-weight: 600;
          color: @apple-text-primary;
          text-align: center;
          letter-spacing: -0.01em;
        }
        
        .preview-image {
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: 70vh;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12),
                      0 2px 8px rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          object-fit: contain;
          display: block;
        }
      }
    }
  }
  
  .preview-info {
    margin-top: 20px;
    padding: 20px;
    background: rgba(250, 250, 250, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid @apple-border;
    
    p {
      margin: 10px 0;
      font-size: 14px;
      color: @apple-text-primary;
      letter-spacing: -0.01em;
      
      strong {
        color: @apple-text-secondary;
        margin-right: 8px;
        font-weight: 600;
      }
      
      .url-text {
        word-break: break-all;
        color: @apple-text-secondary;
        font-size: 12px;
      }
      
      &.image-counter {
        text-align: center;
        margin-top: 16px;
        font-size: 13px;
        color: @apple-text-secondary;
        font-weight: 500;
      }
    }
  }
  
  .preview-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
  }
}

// 详情弹窗样式
:deep(.detail-dialog) {
  .el-dialog {
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2),
                0 8px 24px rgba(0, 0, 0, 0.12);
    background: @apple-bg;
    backdrop-filter: blur(30px) saturate(180%);
    -webkit-backdrop-filter: blur(30px) saturate(180%);
  }
  
  .el-dialog__header {
    padding: 20px 24px;
    border-bottom: 1px solid @apple-border;
    background: #e5e5ea;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    
    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: @apple-text-primary;
      letter-spacing: -0.02em;
    }
  }
  
  .el-dialog__body {
    padding: 0;
  }
  
  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid @apple-border;
    background: #e5e5ea;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}

.detail-images-container {
  padding: 24px;
  padding-bottom: 140px; // 底部留白，避免最后一排被弹窗底部遮挡
  /* 和侧栏背景保持一致但略有层次，增强与白色图片边框的对比 */
  background: #e5e5ea;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
}

.detail-groups {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.detail-date-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  padding-top: 1.5rem;
}

.detail-date-group .date-header {
  margin-left: 0.25rem;
  
  &::after {
    display: none;
  }
}

.detail-images-grid {
  /* 详情里也改成弹性布局，让不同尺寸的图片卡片高度/宽度随图片变化 */
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.25rem 0;
  align-items: flex-start;
}

.detail-image-item {
  /* 详情卡片同样不裁剪内容，保持图片完整可见 */
  overflow: visible;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid @apple-border;
  box-shadow: 0 2px 8px @apple-shadow;
  border-radius: 0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1 1 clamp(200px, 18vw, 320px);
  max-width: clamp(200px, 18vw, 360px);
  cursor: pointer;
  
  &:hover {
    opacity: 1;
    box-shadow: 0 6px 20px @apple-shadow-hover;
    transform: translateY(-4px);
    border-color: rgba(0, 122, 255, 0.3);
    
    .detail-delete-btn {
      opacity: 1;
      visibility: visible;
    }
  }
}

.detail-image-thumb {
  width: auto;
  max-width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  background: #ffffff;
  margin: 0 auto;
}

.detail-delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 50%;
  border: 1px solid @apple-border;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  
  &:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  img {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }
}

.detail-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .image-count {
    font-size: 14px;
    color: @apple-text-secondary;
    font-weight: 500;
  }
}

</style>
