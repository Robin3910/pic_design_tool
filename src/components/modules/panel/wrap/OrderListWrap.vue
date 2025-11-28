<template>
  <div class="wrap">
    <div class="header-with-refresh">
      <span class="header-title">订单</span>
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
      class="order-container infinite-list"
      :infinite-scroll-distance="150"
    >
      <div v-if="!state.loading && state.groups.length === 0" class="empty-state">
        <p>暂无订单数据</p>
        <p>尝试刷新或检查接口数据</p>
      </div>
      <template v-else>
        <div class="groups-container">
          <div
            v-for="group in orderedGroups"
            :key="group.sortId"
            class="order-group"
          >
            <div class="group-header" @click="toggleGroup(group.sortId)">
              <i
                :class="[
                  'collapse-icon',
                  state.expandedGroups.has(group.sortId) ? 'el-icon-arrow-down' : 'el-icon-arrow-right'
                ]"
              ></i>
              <span class="group-title">{{ getGroupTitle(group) }}</span>
              <span class="group-count">({{ group.items.length }})</span>
            </div>
            <div v-show="state.expandedGroups.has(group.sortId)" class="group-content">
              <div
                v-for="item in group.items"
                :key="item.key"
                class="order-item"
                :class="{
                  'order-item--text-only': item.text && !item.image,
                  'order-item--image-only': item.image && !item.text
                }"
              >
                <div
                  v-if="item.image"
                  class="order-item__image"
                  @click="selectLocalImage(item.image)"
                  @mousedown="dragImageStart($event, item.image)"
                >
                  <el-image
                    :src="item.image.url"
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
                  <div class="image-name">{{ item.image.name }}</div>
                  <div class="undo-btn" @click.stop="handleDeleteImage(item.image)" title="撤销">
                    <img src="/删除.svg" alt="删除" />
                  </div>
                </div>
                <div
                  v-if="item.text"
                  class="order-item__text"
                  @click="selectText(item.text)"
                  @mousedown="dragTextStart($event, item.text)"
                >
                  <div class="text-content">
                    {{ item.text.text }}
                  </div>
                  <div class="text-name">{{ item.text.name }}</div>
                  <div class="undo-btn" @click.stop="handleDeleteText(item.text)" title="撤销">
                    <img src="/删除.svg" alt="删除" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-show="state.loading" class="loading"><i class="el-icon-loading" /> 拼命加载中</div>
      <div v-show="state.loadDone && state.groups.length > 0" class="loading">全部加载完毕</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import RefreshIcon from '@/components/common/Icon/RefreshIcon.vue'
import { useControlStore, useCanvasStore, useWidgetStore } from '@/store'
import { wTextSetting, getLastSelectedFont } from '../../widgets/wText/wTextSetting'
import wImageSetting from '../../widgets/wImage/wImageSetting'
import setItem2Data from '@/common/methods/DesignFeatures/setImage'
import api from '@/api'
import eventBus from '@/utils/plugins/eventBus'
import { ElMessage } from 'element-plus'
import { taskRecordCache } from '@/utils/taskRecordCache'

type TTextData = {
  name: string
  text: string
  fontSize: number
  fontWeight: string
  sortId?: number | string
  sortIndex?: number
  orderNo?: string
  categoryName?: string
}

type TLocalImage = {
  name: string
  url: string
  thumb?: string
  sortId?: number | string
  sortIndex?: number
  orderNo?: string
  categoryName?: string
}

type TOrderItem = {
  key: string
  sortId: number | string
  sortIndex: number
  orderNo?: string
  categoryName?: string
  text?: TTextData
  image?: TLocalImage
}

type TOrderGroup = {
  sortId: number | string
  orderNo?: string
  categoryName?: string
  items: TOrderItem[]
}

type TState = {
  groups: TOrderGroup[]
  groupOrder: Array<number | string>
  loading: boolean
  loadDone: boolean
  refreshing: boolean
  expandedGroups: Set<number | string>
}

const controlStore = useControlStore()
const widgetStore = useWidgetStore()
const { dPage } = storeToRefs(useCanvasStore())

const state = reactive<TState>({
  groups: [],
  groupOrder: [],
  loading: false,
  loadDone: false,
  refreshing: false,
  expandedGroups: new Set<number | string>(),
})

const scrollContainerRef = ref<HTMLElement | null>(null)
const pageOptions = { pageNo: 1, pageSize: 20 }

const orderedGroups = computed(() => {
  if (!state.groupOrder.length) {
    return state.groups
  }
  const map = new Map<string, TOrderGroup>()
  state.groups.forEach((group) => {
    map.set(String(group.sortId), group)
  })
  return state.groupOrder
    .map((id) => map.get(String(id)))
    .filter((group): group is TOrderGroup => Boolean(group))
})

const toggleGroup = (sortId: number | string) => {
  if (state.expandedGroups.has(sortId)) {
    state.expandedGroups.delete(sortId)
  } else {
    state.expandedGroups.add(sortId)
  }
}

const getGroupTitle = (group: TOrderGroup) => {
  const parts: string[] = []
  if (group.orderNo) {
    parts.push(`订单: ${group.orderNo}`)
  }
  if (group.categoryName) {
    parts.push(`类目: ${group.categoryName}`)
  }
  if (!parts.length) {
    parts.push(`任务ID: ${group.sortId}`)
  }
  return parts.join(' | ')
}

const parseNeedRedrawIndices = (raw: any): number[] => {
  if (Array.isArray(raw)) {
    return raw.map((n) => parseInt(String(n), 10)).filter((n) => !isNaN(n))
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n))
  }
  if (typeof raw === 'number') {
    return [raw]
  }
  return []
}

const parseCustomTextList = (val: any): string[] => {
  if (Array.isArray(val)) {
    return val.filter((t) => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim())
  }
  if (typeof val !== 'string') {
    return []
  }
  const trimmed = val.trim()
  if (!trimmed.length) {
    return []
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.filter((t) => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim())
      }
    } catch {
      // fall through
    }
  }
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

const extractIndexFromUrl = (u: string): number | null => {
  try {
    const withoutQuery = u.split('?')[0]
    const lastSlash = withoutQuery.lastIndexOf('/')
    const fileName = lastSlash >= 0 ? withoutQuery.slice(lastSlash + 1) : withoutQuery
    const nameOnly = fileName.replace(/\.[^.]*$/, '')
    const match = nameOnly.match(/(\d+)$/)
    return match ? parseInt(match[1], 10) : null
  } catch {
    return null
  }
}

const buildIndexMap = (source?: string | null) => {
  const map = new Map<number, string>()
  if (typeof source !== 'string' || source.trim().length === 0) {
    return map
  }
  source
    .split(',')
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0)
    .forEach((u: string) => {
      const idx = extractIndexFromUrl(u)
      if (idx != null && !map.has(idx)) {
        map.set(idx, u)
      }
    })
  return map
}

const buildTextEntries = (list: any[]) => {
  const map = new Map<string, TTextData[]>()
  const order: Array<number | string> = []
  list.forEach((item: any) => {
    const sortId = item.id ?? item.sortId
    if (sortId == null) {
      return
    }
    const indices = parseNeedRedrawIndices(item.need_redraw_index ?? item.needRedrawIndex)
    if (!indices.length) {
      return
    }
    const customTextList = parseCustomTextList(item.customTextList ?? item.custom_text_list)
    if (!customTextList.length) {
      return
    }
    const indexSet = new Set(indices)
    const texts: TTextData[] = []
    customTextList.forEach((text, idx) => {
      const sortIndex = idx + 1
      if (!indexSet.has(sortIndex)) {
        return
      }
      const name = `${sortId}_${sortIndex}`
      texts.push({
        name,
        text,
        fontSize: 24,
        fontWeight: 'normal',
        sortId,
        sortIndex,
        orderNo: item.orderNo || item.order_no || '',
        categoryName: item.categoryName || item.category_name || '',
      })
    })
    if (texts.length) {
      const key = String(sortId)
      map.set(key, texts)
      if (!order.includes(sortId)) {
        order.push(sortId)
      }
    }
  })
  return { map, order }
}

const buildImageEntries = (list: any[]) => {
  const map = new Map<string, TLocalImage[]>()
  const order: Array<number | string> = []
  list.forEach((item: any) => {
    if (item.id != null) {
      taskRecordCache.set(item.id, item)
    }
    const sortId = item.id ?? item.sortId
    if (sortId == null) {
      return
    }
    const indices = parseNeedRedrawIndices(item.need_redraw_index ?? item.needRedrawIndex)
    if (!indices.length) {
      return
    }
    const hdIndexMap = buildIndexMap(item.hdImages ?? item.setImageUrls ?? item.set_image_urls)
    const customIndexMap = buildIndexMap(item.customImageUrls ?? item.custom_image_urls)
    const images: TLocalImage[] = []
    indices.forEach((idx) => {
      const url = hdIndexMap.get(idx) ?? customIndexMap.get(idx)
      if (!url) {
        return
      }
      const name = `${sortId}_${idx}`
      images.push({
        name,
        url,
        thumb: url,
        sortId,
        sortIndex: idx,
        orderNo: item.orderNo || item.order_no || '',
        categoryName: item.categoryName || item.category_name || '',
      })
    })
    if (images.length) {
      const key = String(sortId)
      map.set(key, images)
      if (!order.includes(sortId)) {
        order.push(sortId)
      }
    }
  })
  return { map, order }
}

const mergeGroups = (incoming: TOrderGroup[]) => {
  if (!incoming.length) {
    return
  }
  const map = new Map<string, TOrderGroup>()
  state.groups.forEach((group) => {
    map.set(String(group.sortId), {
      ...group,
      items: [...group.items],
    })
  })

  incoming.forEach((group) => {
    const key = String(group.sortId)
    if (!state.groupOrder.includes(group.sortId)) {
      state.groupOrder.push(group.sortId)
    }
    if (!state.expandedGroups.has(group.sortId)) {
      state.expandedGroups.add(group.sortId)
    }
    const existing = map.get(key)
    if (!existing) {
      map.set(key, {
        ...group,
        items: [...group.items].sort((a, b) => a.sortIndex - b.sortIndex),
      })
      return
    }
    const itemMap = new Map<string, TOrderItem>()
    existing.items.forEach((item) => itemMap.set(item.key, { ...item }))
    group.items.forEach((item) => {
      const current = itemMap.get(item.key)
      if (!current) {
        itemMap.set(item.key, { ...item })
        return
      }
      if (item.text) {
        current.text = item.text
      }
      if (item.image) {
        current.image = item.image
      }
      current.orderNo = current.orderNo || item.orderNo
      current.categoryName = current.categoryName || item.categoryName
    })
    existing.items = Array.from(itemMap.values()).sort((a, b) => a.sortIndex - b.sortIndex)
    existing.orderNo = existing.orderNo || group.orderNo
    existing.categoryName = existing.categoryName || group.categoryName
    map.set(key, existing)
  })

  state.groups = state.groupOrder
    .map((id) => map.get(String(id)))
    .filter((group): group is TOrderGroup => Boolean(group))
}

const buildCombinedGroups = (
  textMap: Map<string, TTextData[]>,
  imageMap: Map<string, TLocalImage[]>,
  textOrder: Array<number | string>,
  imageOrder: Array<number | string>,
) => {
  const order = [...textOrder]
  imageOrder.forEach((id) => {
    if (!order.includes(id)) {
      order.push(id)
    }
  })
  const groups: TOrderGroup[] = []
  const allKeys = new Set([...textMap.keys(), ...imageMap.keys()])
  allKeys.forEach((key) => {
    const textList = textMap.get(key) ?? []
    const imageList = imageMap.get(key) ?? []
    const indexSet = new Set<number>()
    textList.forEach((text) => {
      if (typeof text.sortIndex === 'number') {
        indexSet.add(text.sortIndex)
      }
    })
    imageList.forEach((image) => {
      if (typeof image.sortIndex === 'number') {
        indexSet.add(image.sortIndex)
      }
    })
    const sortId = textList[0]?.sortId ?? imageList[0]?.sortId ?? key
    const orderNo = textList[0]?.orderNo ?? imageList[0]?.orderNo ?? ''
    const categoryName = textList[0]?.categoryName ?? imageList[0]?.categoryName ?? ''
    const items: TOrderItem[] = Array.from(indexSet)
      .sort((a, b) => a - b)
      .map((idx) => {
        const text = textList.find((t) => t.sortIndex === idx)
        const image = imageList.find((img) => img.sortIndex === idx)
        return {
          key: `${sortId}_${idx}`,
          sortId: sortId ?? key,
          sortIndex: idx,
          orderNo,
          categoryName,
          text,
          image,
        }
      })
    if (items.length) {
      groups.push({
        sortId: sortId ?? key,
        orderNo,
        categoryName,
        items,
      })
    }
  })
  groups.sort((a, b) => {
    const aIndex = order.findIndex((id) => String(id) === String(a.sortId))
    const bIndex = order.findIndex((id) => String(id) === String(b.sortId))
    if (aIndex === -1 && bIndex === -1) {
      return 0
    }
    if (aIndex === -1) {
      return 1
    }
    if (bIndex === -1) {
      return -1
    }
    return aIndex - bIndex
  })
  return groups
}

const loadOrderData = async (init = false) => {
  if (init) {
    state.groups = []
    state.groupOrder = []
    state.expandedGroups.clear()
    pageOptions.pageNo = 1
    state.loadDone = false
  }
  if (state.loading || state.loadDone) {
    return
  }
  state.loading = true
  try {
    const [textRes, imageRes] = await Promise.all([
      api.redrawTask.getRedrawTaskPageWithCustomText({
        pageNo: pageOptions.pageNo,
        pageSize: pageOptions.pageSize,
      }),
      api.redrawTask.getRedrawTaskPageWithNeedRedrawIndex({
        pageNo: pageOptions.pageNo,
        pageSize: pageOptions.pageSize,
      }),
    ])
    const textList = textRes.data?.list || []
    const imageList = imageRes.data?.list || []

    const textData = buildTextEntries(textList)
    const imageData = buildImageEntries(imageList)
    const groups = buildCombinedGroups(textData.map, imageData.map, textData.order, imageData.order)
    mergeGroups(groups)

    const latestImage = groups.find((group) => group.items.some((item) => item.image))
    const previewImage = latestImage?.items.find((item) => item.image)?.image?.url
    if (previewImage) {
      controlStore.setPreviewImageUrl(previewImage)
    } else if (init) {
      controlStore.setPreviewImageUrl(null)
    }

    const noMoreText = textList.length < pageOptions.pageSize
    const noMoreImage = imageList.length < pageOptions.pageSize
    if (noMoreText && noMoreImage) {
      state.loadDone = true
    } else {
      pageOptions.pageNo += 1
    }
  } catch (error) {
    console.error('加载订单数据失败:', error)
    if (init) {
      state.groups = []
    }
    state.loadDone = true
  } finally {
    state.loading = false
  }
}

const load = () => {
  loadOrderData(false)
}

const selectText = (text: TTextData) => {
  controlStore.setShowMoveable(false)
  const setting = JSON.parse(JSON.stringify(wTextSetting))
  const lastFont = getLastSelectedFont()
  if (lastFont) {
    setting.fontClass = lastFont
    setting.fontFamily = lastFont.value
  }
  setting.text = text.text
  setting.fontSize = text.fontSize
  setting.fontWeight = text.fontWeight
  setting.sortId = text.sortId ?? ''
  setting.sortIndex = text.sortIndex

  const { width: pW, height: pH } = dPage.value
  const textWidth = text.text.length * text.fontSize * 0.6
  setting.left = pW / 2 - textWidth / 2
  setting.top = pH / 2 - text.fontSize / 2

  widgetStore.addWidget(setting)
}

const dragTextStart = (event: MouseEvent, text: TTextData) => {
  widgetStore.setSelectItem({
    data: {
      value: {
        name: text.name,
        text: text.text,
        fontSize: text.fontSize,
        fontWeight: text.fontWeight,
        sortId: text.sortId ?? '',
        sortIndex: text.sortIndex,
      },
    },
    type: 'text',
  })
}

const selectLocalImage = async (image: TLocalImage) => {
  controlStore.setShowMoveable(false)
  const setting = JSON.parse(JSON.stringify(wImageSetting))
  const imageData = {
    url: image.url,
    thumb: image.thumb || image.url,
    name: image.name,
    width: 0,
    height: 0,
  }
  const img = await setItem2Data(imageData)
  setting.width = img.width
  setting.height = img.height
  setting.imgUrl = image.url
  setting.name = '素材图片'
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

const dragImageStart = (event: MouseEvent, image: TLocalImage) => {
  const imageData: any = {
    url: image.url,
    thumb: image.thumb || image.url,
    name: image.name,
  }
  if (image.sortId) {
    imageData.sortId = image.sortId
  }
  if (image.sortIndex !== undefined) {
    imageData.sortIndex = image.sortIndex
  }
  widgetStore.setSelectItem({ data: { value: imageData }, type: 'image' })
}

const handleDeleteText = async (text: TTextData | null) => {
  if (!text) {
    return
  }
  if (!text.sortId || text.sortIndex == null) {
    ElMessage.warning('无法删除：缺少必要的任务信息')
    return
  }
  try {
    const taskId = typeof text.sortId === 'string' ? parseInt(text.sortId, 10) : text.sortId
    if (isNaN(taskId)) {
      ElMessage.error('任务ID格式错误')
      return
    }
    let taskData = taskRecordCache.get(taskId)
    if (!taskData) {
      taskData = await api.redrawTask.getRedrawTaskById(taskId)
      if (taskData) {
        taskRecordCache.set(taskId, taskData)
      } else {
        ElMessage.error('获取任务详情失败')
        return
      }
    }
    const orderId = (taskData as any).orderId ?? (taskData as any).order_id
    const orderNo = (taskData as any).orderNo ?? (taskData as any).order_no
    if (!orderId || !orderNo || (typeof orderNo === 'string' && orderNo.trim().length === 0)) {
      taskData = await api.redrawTask.getRedrawTaskById(taskId)
      if (taskData) {
        taskRecordCache.set(taskId, taskData)
      } else {
        ElMessage.error('获取任务详情失败')
        return
      }
    }
    const raw = taskData.need_redraw_index ?? taskData.needRedrawIndex
    let indices: number[] = []
    if (Array.isArray(raw)) {
      indices = raw.map((n: any) => parseInt(String(n), 10)).filter((n: number) => !isNaN(n))
    } else if (typeof raw === 'string') {
      indices = raw
        .split(',')
        .map((s: string) => parseInt(s.trim(), 10))
        .filter((n: number) => !isNaN(n))
    } else if (typeof raw === 'number') {
      indices = [raw]
    }
    const newIndices = indices.filter((idx) => idx !== text.sortIndex)
    if (newIndices.length === indices.length) {
      ElMessage.warning('该文字素材不在需重制列表中')
      return
    }
    const finalOrderId = (taskData as any).orderId ?? (taskData as any).order_id
    const finalOrderNo = (taskData as any).orderNo ?? (taskData as any).order_no
    const updateData: any = {
      id: taskId,
      orderId: finalOrderId,
      orderNo: finalOrderNo,
      needRedrawIndex: newIndices.length > 0 ? newIndices.join(',') : '',
    }
    const updateRes = await api.redrawTask.updateRedrawTask(updateData)
    if (updateRes.code === 0) {
      ElMessage.success('删除成功')
      taskRecordCache.set(taskId, {
        ...taskData,
        need_redraw_index: updateData.needRedrawIndex,
        needRedrawIndex: updateData.needRedrawIndex,
      })
      await handleRefresh()
    } else {
      ElMessage.error(updateRes.msg || '删除失败')
    }
  } catch (error: any) {
    console.error('删除文字素材失败:', error)
    ElMessage.error(error?.message || '删除失败')
  }
}

const queryTaskRecord = async (taskId: number) => {
  let task = taskRecordCache.get(taskId) || null
  if (task) {
    return task
  }
  try {
    let pageNo = 1
    const pageSize = 50
    let found = false
    while (!found && pageNo <= 5) {
      const res = await api.redrawTask.getRedrawTaskPageWithNeedRedrawIndex({
        pageNo,
        pageSize,
      })
      const list = res.data?.list || []
      task = list.find((item: any) => item.id === taskId) || null
      if (task) {
        found = true
        taskRecordCache.set(taskId, task)
        break
      }
      if (list.length < pageSize) {
        break
      }
      pageNo++
    }
  } catch (error) {
    console.error(`查询任务记录失败 (ID: ${taskId}):`, error)
  }
  return task
}

const handleDeleteImage = async (image: TLocalImage | null) => {
  if (!image) {
    return
  }
  if (!image.sortId || image.sortIndex == null) {
    ElMessage.warning('无法删除：缺少必要的任务信息')
    return
  }
  try {
    const taskId = typeof image.sortId === 'string' ? parseInt(image.sortId, 10) : image.sortId
    if (isNaN(taskId)) {
      ElMessage.error('任务ID格式错误')
      return
    }
    let task = await queryTaskRecord(taskId)
    if (!task) {
      ElMessage.error('任务记录不存在')
      return
    }
    const rawNeedRedraw = (task as any).need_redraw_index ?? (task as any).needRedrawIndex ?? ''
    const needRedrawIndices = (typeof rawNeedRedraw === 'string' ? rawNeedRedraw : '')
      .split(',')
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((n: number) => !isNaN(n) && n !== image.sortIndex)
    const needRedrawIndex =
      needRedrawIndices.length > 0 ? needRedrawIndices.sort((a, b) => a - b).join(',') : ''
    const rawFinished = (task as any).finished_index ?? (task as any).finishedIndex ?? ''
    const finishedIndices = (typeof rawFinished === 'string' ? rawFinished : '')
      .split(',')
      .map((s: string) => parseInt(s.trim(), 10))
      .filter((n: number) => !isNaN(n))
    if (image.sortIndex != null && !finishedIndices.includes(image.sortIndex)) {
      finishedIndices.push(image.sortIndex)
    }
    const finishedIndex =
      finishedIndices.length > 0 ? finishedIndices.sort((a, b) => a - b).join(',') : ''
    const orderId = (task as any).orderId ?? (task as any).order_id
    const orderNo = (task as any).orderNo ?? (task as any).order_no
    await api.redrawTask.updateRedrawTask({
      id: task.id,
      orderId,
      orderNo,
      finishedIndex,
      needRedrawIndex,
    })
    await handleRefresh()
    ElMessage.success('删除成功')
  } catch (error) {
    console.error('删除图片失败:', error)
    ElMessage.error('删除失败，请稍后重试')
  }
}

const handleRefresh = async () => {
  if (state.refreshing) {
    return
  }
  state.refreshing = true
  await loadOrderData(true)
  await nextTick()
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0
  }
  state.refreshing = false
}

onMounted(() => {
  loadOrderData(true)
  eventBus.on('refreshPhotoList', handleRefresh)
  eventBus.on('refreshTextList', handleRefresh)
  eventBus.on('refreshOrderList', handleRefresh)
})

onBeforeUnmount(() => {
  eventBus.off('refreshPhotoList', handleRefresh)
  eventBus.off('refreshTextList', handleRefresh)
  eventBus.off('refreshOrderList', handleRefresh)
})

defineExpose({
  handleRefresh,
})
</script>

<style lang="less" scoped>
@apple-bg: rgba(255, 255, 255, 0.85);
@apple-border: rgba(0, 0, 0, 0.06);
@apple-text-primary: #1d1d1f;
@apple-text-secondary: #86868b;
@apple-shadow: rgba(0, 0, 0, 0.08);
@apple-accent: #007aff;

.wrap {
  width: 100%;
  height: 100%;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.header-with-refresh {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.5rem;

  .header-title {
    font-size: 14px;
    font-weight: 600;
    color: @apple-text-primary;
  }

  .refresh-btn {
    color: @apple-text-secondary;
  }
}

.order-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 0 0.75rem 120px;
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
  }
}

.groups-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-group {
  border: 1px solid @apple-border;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;

  .group-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    user-select: none;
    background: rgba(255, 255, 255, 0.6);
    border-bottom: 1px solid @apple-border;

    .group-title {
      color: @apple-text-primary;
      font-weight: 600;
      flex: 1;
    }

    .group-count {
      color: @apple-text-secondary;
    }
  }

  .group-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
}

.order-item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid @apple-border;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  position: relative;

  &--text-only {
    grid-template-columns: 1fr;
  }

  &--image-only {
    grid-template-columns: 1fr;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-color: rgba(0, 0, 0, 0.08);
  }
}

.order-item__image,
.order-item__text {
  position: relative;
  border: 1px solid @apple-border;
  border-radius: 10px;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .undo-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover .undo-btn {
    opacity: 1;
  }
}

.order-item__text {
  .text-content {
    font-size: 14px;
    color: @apple-text-primary;
    white-space: pre-wrap;
    line-height: 1.5;
  }

  .text-name {
    margin-top: 0.5rem;
    font-size: 12px;
    color: @apple-text-secondary;
  }
}

.order-item__image {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: stretch;

  .image-thumb {
    width: 100%;
    height: 120px;
    border-radius: 8px;
    object-fit: cover;
  }

  .image-placeholder,
  .image-error {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: @apple-text-secondary;
  }

  .image-name {
    font-size: 12px;
    color: @apple-text-secondary;
    text-align: center;
  }
}

.empty-state {
  margin-top: 4rem;
  text-align: center;
  color: @apple-text-secondary;
}

.loading {
  text-align: center;
  padding: 1rem;
  color: @apple-text-secondary;
}
</style>

