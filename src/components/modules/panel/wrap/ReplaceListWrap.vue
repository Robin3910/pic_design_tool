<!--
 * @Author: AI Assistant
 * @Date: 2025-01-XX
 * @Description: 替换素材列表 - 显示newSetImageUrls字段中的替换图片
-->
<template>
  <div class="wrap">
    <div class="header-with-refresh">
      <span class="header-title">替换</span>
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
      <div v-else class="images-grid">
        <div 
          v-for="(image, index) in state.localImages" 
          :key="index"
          class="image-item readonly"
          @click="handleImageClick(image)"
        >
          <el-image 
            :src="image.url" 
            fit="contain" 
            lazy 
            loading="lazy"
            class="image-thumb"
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
          <div class="image-name">{{ image.name }}</div>
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
        <img 
          v-if="state.previewImage?.url"
          :src="state.previewImage.url" 
          class="preview-image"
          alt="预览图片"
        />
        <el-button 
          class="nav-btn next-btn"
          :disabled="state.previewIndex >= state.localImages.length - 1 && (state.loadDone || state.loading)"
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
        <p v-if="state.localImages.length > 1" class="image-counter">
          {{ state.previewIndex + 1 }} / {{ state.localImages.length }}
        </p>
      </div>
      <template #footer>
        <div class="preview-footer">
          <el-button @click="handlePreviewClose">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 从接口加载替换素材图片（只读展示，不支持编辑添加）
import { reactive, onMounted, ref, nextTick } from 'vue'
import RefreshIcon from '@/components/common/Icon/RefreshIcon.vue'
import PrevIcon from '@/components/common/Icon/PrevIcon.vue'
import NextIcon from '@/components/common/Icon/NextIcon.vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

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
}

type TState = {
  localImages: TLocalImage[]
  refreshing: boolean
  loading: boolean
  loadDone: boolean
  previewVisible: boolean
  previewImage: TLocalImage | null
  previewIndex: number
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
})

const scrollContainerRef = ref<HTMLElement | null>(null)

const pageOptions = { pageNo: 1, pageSize: 20 }

onMounted(() => {
  loadImagesFromApi(true)
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
      // 从 newSetImageUrls 字段获取替换素材
      let str = item.newSetImageUrls ?? item.new_set_image_urls
      if (typeof str !== 'string' || str.trim().length === 0) return

      // 解析需重制序号（支持 number、字符串"1,2,3"、数组）
      const raw = (item as any).need_redraw_index ?? (item as any).needRedrawIndex
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
            results.push({ 
              name, 
              url: u, 
              thumb: u,
              sortId: item.id ?? '',
              sortIndex: idx,
              orderNo: item.orderNo || item.order_no || '',
              categoryName: item.categoryName || item.category_name || '',
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
  await loadImagesFromApi(true)
  // 刷新后重置滚动位置到顶部
  await nextTick()
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0
  }
  state.refreshing = false
}

// 点击图片预览
const handleImageClick = (image: TLocalImage) => {
  const index = state.localImages.findIndex(img => img.url === image.url && img.name === image.name)
  state.previewIndex = index >= 0 ? index : 0
  state.previewImage = image
  state.previewVisible = true
}

// 切换到上一张图片
const handlePrevImage = () => {
  if (state.previewIndex > 0) {
    state.previewIndex--
    state.previewImage = state.localImages[state.previewIndex]
  }
}

// 切换到下一张图片
const handleNextImage = async () => {
  // 如果已经到了当前列表的末尾
  if (state.previewIndex >= state.localImages.length - 1) {
    // 如果还有更多数据未加载，则先加载
    if (!state.loadDone && !state.loading) {
      await loadImagesFromApi(false)
      // 加载完成后，检查是否有新数据
      if (state.previewIndex < state.localImages.length - 1) {
        state.previewIndex++
        state.previewImage = state.localImages[state.previewIndex]
      }
    }
    // 如果没有更多数据，则不进行任何操作（按钮会被禁用）
  } else {
    // 正常切换到下一张
    state.previewIndex++
    state.previewImage = state.localImages[state.previewIndex]
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

defineExpose({
  handleRefresh,
})
</script>

<style lang="less" scoped>
.wrap {
  width: 100%;
  height: 100%;
  padding: 1rem;
  position: relative;
  display: flex;
  flex-direction: column;
}

.local-images-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding-bottom: 150px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.local-images-container::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
  
  p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
  }
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  padding: 0.5rem 0;
}

.image-item {
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &.readonly {
    cursor: pointer;
    opacity: 0.9;
    transition: all 0.3s ease;
    
    &:hover {
      opacity: 1;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
}

.image-thumb {
  width: 100%;
  height: 120px;
  display: block;
}

.image-placeholder,
.image-error {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
  font-size: 2rem;
}

.image-error {
  background: #ffe6e6;
  color: #ff6b6b;
}

.image-name {
  padding: 0.5rem;
  font-size: 0.8rem;
  color: #666;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: #fafafa;
}

.loading {
  padding-top: 1rem;
  text-align: center;
  font-size: 14px;
  color: #999;
}

.header-with-refresh {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 1.7rem 0 0.5rem 0;
  padding: 0 1rem;
}

.header-title {
  font-weight: bold;
  font-size: 14px;
}

.refresh-btn {
  padding: 4px;
  min-width: auto;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

// 图片预览弹窗样式
:deep(.image-preview-dialog) {
  .preview-content {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    min-height: 400px;
    max-height: 75vh;
    overflow: auto;
    background: #f5f5f5;
    border-radius: 8px;
    padding: 20px;
    
    .nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      width: 40px;
      height: 40px;
      font-size: 18px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #e0e0e0;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        transform: translateY(-50%) scale(1.1);
      }
      
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      
      &.prev-btn {
        left: 20px;
      }
      
      &.next-btn {
        right: 20px;
      }
    }
    
    .preview-image {
      width: auto;
      height: auto;
      max-width: 500px;
      max-height: 70vh;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      object-fit: contain;
      display: block;
    }
  }
  
  .preview-info {
    margin-top: 20px;
    padding: 15px;
    background: #fafafa;
    border-radius: 8px;
    
    p {
      margin: 8px 0;
      font-size: 14px;
      color: #333;
      
      strong {
        color: #666;
        margin-right: 8px;
      }
      
      .url-text {
        word-break: break-all;
        color: #666;
        font-size: 12px;
      }
      
      &.image-counter {
        text-align: center;
        margin-top: 12px;
        font-size: 12px;
        color: #999;
      }
    }
  }
  
  .preview-footer {
    display: flex;
    justify-content: center;
  }
}
</style>
