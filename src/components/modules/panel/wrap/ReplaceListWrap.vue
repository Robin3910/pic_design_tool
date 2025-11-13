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
      <div v-else class="groups-container">
        <div 
          v-for="(group, groupIndex) in groupedImages" 
          :key="group.sortId || groupIndex"
          class="image-group"
        >
          <div 
            class="group-header"
            @click="toggleGroup(group.sortId)"
          >
            <i 
              :class="['collapse-icon', state.expandedGroups.has(group.sortId) ? 'el-icon-arrow-down' : 'el-icon-arrow-right']"
            ></i>
            <span class="group-title">
              {{ getGroupTitle(group) }}
            </span>
            <span class="group-count">({{ group.images.length }})</span>
          </div>
          <div 
            v-show="state.expandedGroups.has(group.sortId)"
            class="group-content"
          >
            <div class="images-grid">
              <div 
                v-for="(image, index) in group.images" 
          :key="index"
          class="image-item readonly"
          @click="handleImageClick(image)"
                @contextmenu.prevent="showContextMenu($event, image)"
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
          <div class="image-name">{{ image.name }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-show="state.loading" class="loading"><i class="el-icon-loading" /> 拼命加载中</div>
      <div v-show="state.loadDone && state.localImages.length > 0" class="loading">全部加载完毕</div>
    </div>
    
    <!-- 右键菜单 -->
    <div 
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
      @contextmenu.prevent.stop
    >
      <div class="context-menu-item" @click.stop="handleDelete(contextMenu.image)">
        <i class="el-icon-delete"></i>
        <span>删除</span>
      </div>
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
}

type TImageGroup = {
  sortId: number | string
  images: TLocalImage[]
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
  total: number
  expandedGroups: Set<number | string>
  refreshTimestamp: number
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
  expandedGroups: new Set<number | string>(),
  refreshTimestamp: Date.now(),
})

const scrollContainerRef = ref<HTMLElement | null>(null)
const uiStore = useUiStore()

const pageOptions = { pageNo: 1, pageSize: 20 }

// 右键菜单状态
const contextMenu = reactive<{
  visible: boolean
  x: number
  y: number
  image: TLocalImage | null
}>({
  visible: false,
  x: 0,
  y: 0,
  image: null,
})

// 任务数据缓存：key 为 taskId，value 为任务数据
const taskCache = new Map<number, any>()

// 按 sortId 分组图片
const groupedImages = computed<TImageGroup[]>(() => {
  const groupsMap = new Map<number | string, TImageGroup>()
  
  state.localImages.forEach((image) => {
    const sortId = image.sortId ?? 'unknown'
    if (!groupsMap.has(sortId)) {
      groupsMap.set(sortId, {
        sortId,
        images: [],
        orderNo: image.orderNo,
        categoryName: image.categoryName,
      })
    }
    groupsMap.get(sortId)!.images.push(image)
  })
  
  // 转换为数组，保持原始顺序（按第一个图片的顺序）
  return Array.from(groupsMap.values())
})

// 获取分组标题
const getGroupTitle = (group: TImageGroup): string => {
  const parts: string[] = []
  if (group.orderNo) {
    parts.push(`订单: ${group.orderNo}`)
  }
  if (group.categoryName) {
    parts.push(`类目: ${group.categoryName}`)
  }
  if (parts.length === 0) {
    parts.push(`任务ID: ${group.sortId}`)
  }
  return parts.join(' | ')
}

// 切换分组展开/折叠
const toggleGroup = (sortId: number | string) => {
  if (state.expandedGroups.has(sortId)) {
    state.expandedGroups.delete(sortId)
  } else {
    state.expandedGroups.add(sortId)
  }
}

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

// 显示右键菜单
const showContextMenu = (event: MouseEvent, image: TLocalImage) => {
  event.preventDefault()
  event.stopPropagation()
  contextMenu.visible = true
  // 获取缩放比例，调整坐标以适配缩放
  const scale = uiStore.uiZoom / 100
  // 由于菜单在应用了 transform: scale() 的容器内，position: fixed 会相对于该容器定位
  // 需要将坐标除以缩放比例
  contextMenu.x = event.clientX / scale
  contextMenu.y = event.clientY / scale
  contextMenu.image = image
}

// 隐藏右键菜单
const hideContextMenu = () => {
  contextMenu.visible = false
  contextMenu.image = null
}

// 处理文档点击事件，点击外部关闭右键菜单
const handleDocumentClick = (e: MouseEvent) => {
  if (contextMenu.visible) {
    hideContextMenu()
  }
}

onMounted(() => {
  loadImagesFromApi(true)
  // 监听点击事件，点击外部关闭右键菜单
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('contextmenu', handleDocumentClick)
})

onBeforeUnmount(() => {
  // 清理事件监听
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('contextmenu', handleDocumentClick)
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
            results.push({ 
              name, 
              url: u, 
              thumb: u,
              sortId: item.id ?? '',
              sortIndex: idx,
              orderNo: item.orderNo || item.order_no || '',
              categoryName: item.categoryName || item.category_name || '',
              effectiveImgUrl: effectiveImgUrl && typeof effectiveImgUrl === 'string' && effectiveImgUrl.trim() ? effectiveImgUrl.trim() : undefined,
            })
          }
        }
      })
    })
    
    // 不排序，保持接口输出的原始顺序
    if (init) {
      state.localImages = results
      // 初始化时，默认展开所有分组
      state.expandedGroups.clear()
      results.forEach(item => {
        if (item.sortId) {
          state.expandedGroups.add(item.sortId)
        }
      })
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
          // 新数据的分组默认展开
          if (newItem.sortId && !state.expandedGroups.has(newItem.sortId)) {
            state.expandedGroups.add(newItem.sortId)
          }
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
  // 如果还没到已加载图片的最后一个
  if (state.previewIndex < state.localImages.length - 1) {
    // 检查下一张是否已在已加载的列表中
    const nextIndex = state.previewIndex + 1
    if (nextIndex < state.localImages.length) {
      // 下一张已经在列表中，直接切换
      state.previewIndex = nextIndex
      state.previewImage = state.localImages[nextIndex]
    } else {
      // 下一张不在列表中，需要加载更多数据
      if (!state.loadDone && !state.loading) {
        await loadImagesFromApi(false)
        // 加载完成后，检查是否有新数据
        if (nextIndex < state.localImages.length) {
          state.previewIndex = nextIndex
          state.previewImage = state.localImages[nextIndex]
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
  // 先隐藏右键菜单
  hideContextMenu()
  
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

.groups-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.image-group {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
}

.group-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #c95a7a 0%, #d4b835 100%);
  color: #fff;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #d4b835 0%, #c95a7a 100%);
  }
  
  .collapse-icon {
    margin-right: 0.5rem;
    font-size: 14px;
    transition: transform 0.3s ease;
  }
  
  .group-title {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
  }
  
  .group-count {
    font-size: 12px;
    opacity: 0.9;
    margin-left: 0.5rem;
  }
}

.group-content {
  padding: 0.75rem;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 2000px;
  }
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.image-item {
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  
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
    
    .preview-images-container {
      display: flex;
      gap: 20px;
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
        gap: 10px;
        
        &:only-child {
          max-width: 100%;
        }
        
        .image-label {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          text-align: center;
        }
        
        .preview-image {
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: 70vh;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          object-fit: contain;
          display: block;
        }
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
    gap: 12px;
  }
}

.context-menu {
  position: fixed;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  z-index: 9999;
  min-width: 120px;
  
  .context-menu-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    color: #333;
    
    &:hover {
      background-color: #f5f5f5;
    }
    
    i {
      margin-right: 8px;
      font-size: 14px;
      color: #f56c6c;
    }
    
    span {
      font-size: 14px;
    }
  }
}
</style>
