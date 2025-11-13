<!--
 * @Author: ShawnPhang
 * @Date: 2022-02-11 18:48:23
 * @Description: 本地图片库 - 显示public/images目录中的图片
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-14 18:50:09
-->
<template>
  <div class="wrap">
    <div class="header-with-refresh">
      <span class="header-title">图片</span>
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
        <p>暂无图片</p>
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
          class="image-item"
          @click="selectLocalImage(image)"
          @mousedown="dragStart($event, image)"
                @contextmenu.prevent="showContextMenu($event, image)"
        >
          <el-image 
            :src="image.url" 
            fit="cover" 
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
  </div>
</template>

<script setup lang="ts">
// 从接口加载图片
import { reactive, onMounted, onBeforeUnmount, ref, nextTick, computed } from 'vue'
import wImageSetting from '../../widgets/wImage/wImageSetting'
import setItem2Data from '@/common/methods/DesignFeatures/setImage'
import RefreshIcon from '@/components/common/Icon/RefreshIcon.vue'
import { storeToRefs } from 'pinia'
import { useControlStore, useCanvasStore, useWidgetStore, useUiStore } from '@/store'
import api from '@/api'
import { taskRecordCache } from '@/utils/taskRecordCache'
import eventBus from '@/utils/plugins/eventBus'
import { ElMessage } from 'element-plus'

const controlStore = useControlStore()
const uiStore = useUiStore()

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
  expandedGroups: Set<number | string>
}

const props = defineProps<TProps>()

const widgetStore = useWidgetStore()
const { dPage } = storeToRefs(useCanvasStore())

const state = reactive<TState>({
  localImages: [],
  refreshing: false,
  loading: false,
  loadDone: false,
  expandedGroups: new Set<number | string>(),
})

const scrollContainerRef = ref<HTMLElement | null>(null)

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

const pageOptions = { pageNo: 1, pageSize: 20 }

// 按 sortId 分组图片
const groupedImages = computed<TImageGroup[]>(() => {
  if (!state.localImages || state.localImages.length === 0) {
    return []
  }
  
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

onMounted(() => {
  loadImagesFromApi(true)
  // 监听刷新事件
  eventBus.on('refreshPhotoList', handleRefresh)
  // 监听点击事件，点击外部关闭右键菜单
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('contextmenu', handleDocumentClick)
})

onBeforeUnmount(() => {
  // 清理事件监听
  eventBus.off('refreshPhotoList', handleRefresh)
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
    const res = await api.redrawTask.getRedrawTaskPageWithNeedRedrawIndex({ 
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

    // 收集过滤后展示出来的图片素材对应的 effectiveImgUrl，用于更新预览图
    const previewUrls: string[] = []
    // 记录哪些 item 的图片被添加到了 results 中
    const itemsWithFilteredImages = new Set<string | number>()

    list.forEach((item: any) => {
      // 缓存任务记录数据（供保存时使用，避免查询）
      if (item.id != null) {
        taskRecordCache.set(item.id, item)
      }
      // 优先使用 hdImages，如果为空则使用 customImageUrls
      let str = item.hdImages
      if (typeof str !== 'string' || str.trim().length === 0) {
        str = item.customImageUrls ?? item.custom_image_urls
      }
      
      // 处理普通图片（hdImages 或 customImageUrls）
      if (typeof str === 'string' && str.trim().length > 0) {
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

        if (indices.length > 0) {
          const indexSet = new Set(indices)

          const imageList: string[] = str
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)

          imageList.forEach((u) => {
            const idx = extractIndexFromUrl(u)
            if (idx != null && indexSet.has(idx)) {
              const name = `${item.id ?? ''}_${idx}`
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
                // 标记该 item 有图片被添加到 results 中
                if (item.id != null) {
                  itemsWithFilteredImages.add(item.id)
                }
              }
            }
          })
        }
      }
    })

    // 只收集过滤后展示出来的图片素材对应的 effectiveImgUrl
    list.forEach((item: any) => {
      // 只有当该 item 的图片被添加到 results 中时，才收集它的 effectiveImgUrl
      if (item.id != null && itemsWithFilteredImages.has(item.id)) {
        const effectiveImgUrl = item.effectiveImgUrl ?? item.effective_img_url
        if (effectiveImgUrl && typeof effectiveImgUrl === 'string' && effectiveImgUrl.trim().length > 0) {
          const effectiveUrl = effectiveImgUrl.trim()
          if (!previewUrls.includes(effectiveUrl)) {
            previewUrls.push(effectiveUrl)
          }
        }
      }
    })

    // 更新预览图：使用最早的预览图 URL（如果有多个，使用第一个）
    if (previewUrls.length > 0) {
      controlStore.setPreviewImageUrl(previewUrls[0])
    } else if (init) {
      // 如果是初始加载且没有预览图，清空预览图
      controlStore.setPreviewImageUrl(null)
    }
    
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
    console.error('加载图片失败:', e)
    if (init) {
      state.localImages = []
    }
    state.loadDone = true
  } finally {
    state.loading = false
  }
}

const load = () => {
  loadImagesFromApi(false)
}

const selectLocalImage = async (image: TLocalImage) => {
  controlStore.setShowMoveable(false) // 清理掉上一次的选择

  let setting = JSON.parse(JSON.stringify(wImageSetting))
  
  // 创建图片对象用于setImageData - 使用0触发获取原始尺寸
  const imageData = {
    url: image.url,
    thumb: image.thumb || image.url,
    name: image.name,
    width: 0,
    height: 0
  }
  
  const img = await setItem2Data(imageData)
  setting.width = img.width
  setting.height = img.height
  setting.imgUrl = image.url
  setting.name = '素材图片' // 从图片素材添加的图片命名为"素材图片"
  
  // 保存图片素材的关联信息（sortId 和 sortIndex），用于后续保存时更新任务记录
  if (image.sortId) {
    ;(setting as any).sortId = image.sortId
  }
  if (image.sortIndex !== undefined) {
    ;(setting as any).sortIndex = image.sortIndex
  }
  
  const { width: pW, height: pH } = dPage.value
  setting.left = pW / 2 - img.width / 2
  setting.top = pH / 2 - img.height / 2

  widgetStore.addWidget(setting)
}

const dragStart = (event: MouseEvent, image: TLocalImage) => {
  const imageData: any = {
    url: image.url,
    thumb: image.thumb || image.url,
    name: image.name
  }
  
  // 保存图片素材的关联信息到临时数据中
  if (image.sortId) {
    imageData.sortId = image.sortId
  }
  if (image.sortIndex !== undefined) {
    imageData.sortIndex = image.sortIndex
  }
  
  widgetStore.setSelectItem({ data: { value: imageData }, type: 'image' })
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

// 删除图片（从 need_redraw_index 中移除对应序号）
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

  try {
    // 查询任务记录详情
    const taskId = typeof image.sortId === 'string' ? parseInt(image.sortId, 10) : image.sortId
    if (isNaN(taskId)) {
      ElMessage.error('任务ID格式错误')
      return
    }

    // 优先使用缓存的任务数据
    let task = taskRecordCache.get(taskId) || null
    
    // 如果缓存中没有，使用 getRedrawTaskPageWithNeedRedrawIndex 接口查询
    // 由于新接口只返回 need_redraw_index 有数据的记录，需要分页查询来查找
    if (!task) {
      try {
        let pageNo = 1
        const pageSize = 50 // 增加每页数量以提高查询效率
        let found = false
        
        // 最多查询5页，避免无限循环
        while (!found && pageNo <= 5) {
          const res = await api.redrawTask.getRedrawTaskPageWithNeedRedrawIndex({ 
            pageNo,
            pageSize
          })
          const list = res.data?.list || []
          task = list.find((item: any) => item.id === taskId) || null
          
          if (task) {
            found = true
            // 如果找到任务，更新缓存
            taskRecordCache.set(taskId, task)
            break
          }
          
          // 如果当前页数据少于pageSize，说明已经到最后一页了
          if (list.length < pageSize) {
            break
          }
          
          pageNo++
        }
      } catch (error) {
        console.error(`查询任务记录失败 (ID: ${taskId}):`, error)
      }
    }

    if (!task) {
      ElMessage.error('任务记录不存在')
      return
    }

    // 从 need_redraw_index 中移除对应序号（兼容驼峰和蛇形命名）
    const rawNeedRedraw = (task as any).need_redraw_index ?? (task as any).needRedrawIndex ?? ''
    const needRedrawIndices = (typeof rawNeedRedraw === 'string' ? rawNeedRedraw : '')
      .split(',')
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((n: number) => !isNaN(n) && n !== image.sortIndex)
    const needRedrawIndex = needRedrawIndices.length > 0
      ? needRedrawIndices.sort((a: number, b: number) => a - b).join(',')
      : ''

    // 将删除的序号添加到 finishedIndex 中（兼容驼峰和蛇形命名）
    const rawFinished = (task as any).finished_index ?? (task as any).finishedIndex ?? ''
    const finishedIndices = (typeof rawFinished === 'string' ? rawFinished : '')
      .split(',')
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((n: number) => !isNaN(n))
    
    // 如果删除的序号不在 finishedIndex 中，则添加
    if (image.sortIndex != null && !finishedIndices.includes(image.sortIndex)) {
      finishedIndices.push(image.sortIndex)
    }
    const finishedIndex = finishedIndices.length > 0
      ? finishedIndices.sort((a: number, b: number) => a - b).join(',')
      : ''

    // 获取 orderId 和 orderNo（兼容驼峰和蛇形命名）
    const orderId = (task as any).orderId ?? (task as any).order_id
    const orderNo = (task as any).orderNo ?? (task as any).order_no

    // 调用更新接口
    await api.redrawTask.updateRedrawTask({
      id: task.id,
      orderId: orderId,
      orderNo: orderNo,
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
  selectLocalImage,
  dragStart,
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
  background: linear-gradient(135deg, #2d7fc9 0%, #00b8c4 100%);
  color: #fff;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #00b8c4 0%, #2d7fc9 100%);
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
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
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
</style>
