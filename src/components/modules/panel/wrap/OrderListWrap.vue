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
    <div class="order-meta" v-if="groupStats.totalItems > 0">
      <div class="meta-counts">
        <div class="meta-item">
          <span class="meta-label">订单</span>
          <span class="meta-value">{{ groupStats.totalGroups }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">素材</span>
          <span class="meta-value">{{ groupStats.totalItems }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">图片</span>
          <span class="meta-value">{{ groupStats.imageCount }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">文字</span>
          <span class="meta-value">{{ groupStats.textCount }}</span>
        </div>
      </div>
    </div>
    <div style="height: 0.25rem" />
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
              <div class="group-header__content">
                <div class="group-title-row">
                  <div v-if="group.categoryName" class="group-category-chip">
                    <span class="group-category__value">{{ group.categoryName }}</span>
                  </div>
                </div>
              </div>
              <el-button
                text
                size="small"
                class="detail-btn"
                @click.stop="handleViewDetail(group)"
                title="查看详情"
              >
                查看详情
              </el-button>
              <span class="group-count">({{ group.items.length }})</span>
            </div>
            <div v-show="state.expandedGroups.has(group.sortId)" class="group-content">
              <div
                v-for="item in group.items"
                :key="item.key"
                class="order-item"
                :class="{
                  'order-item--text-only': item.text && !item.image,
                  'order-item--image-only': item.image && !item.text,
                  'order-item--stacked': item.image && item.text
                }"
              >
                <div v-if="getItemSubtitle(item) || (item.image && item.text)" class="order-item__subtitle-row">
                  <div v-if="getItemSubtitle(item)" class="order-item__subtitle">
                    {{ getItemSubtitle(item) }}
                  </div>
                  <div
                    v-if="item.image && item.text"
                    class="undo-btn order-item__undo-inline"
                    @click.stop="handleDeleteOrderItem(item)"
                    title="撤销"
                  >
                    <img src="/删除.svg" alt="删除" />
                  </div>
                  <div
                    v-else-if="item.image && !item.text && getItemSubtitle(item)"
                    class="undo-btn order-item__undo-inline"
                    @click.stop="handleDeleteImage(item.image)"
                    title="撤销"
                  >
                    <img src="/删除.svg" alt="删除" />
                  </div>
                  <div
                    v-else-if="item.text && !item.image && getItemSubtitle(item)"
                    class="undo-btn order-item__undo-inline"
                    @click.stop="handleDeleteText(item.text)"
                    title="撤销"
                  >
                    <img src="/删除.svg" alt="删除" />
                  </div>
                </div>
                <div
                  v-if="item.image"
                  class="order-item__image"
                  @click="selectLocalImage(item.image)"
                  @mousedown="dragImageStart($event, item.image)"
                >
                  <el-image
                    :src="item.image.url"
                    fit="cover"
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
                  <div
                    v-if="item.image && !item.text && !getItemSubtitle(item)"
                    class="undo-btn"
                    @click.stop="handleDeleteImage(item.image)"
                    title="撤销"
                  >
                    <img src="/删除.svg" alt="删除" />
                  </div>
                </div>
                <div
                  v-if="item.text"
                  class="order-item__text-wrapper"
                >
                  <div
                    class="order-item__text"
                    @click="selectText(item.text)"
                    @mousedown="dragTextStart($event, item.text)"
                  >
                    <div class="text-content">
                      {{ item.text.text }}
                    </div>
                    <div
                      v-if="item.text && !item.image && !getItemSubtitle(item)"
                      class="undo-btn"
                      @click.stop="handleDeleteText(item.text)"
                      title="撤销"
                    >
                      <img src="/删除.svg" alt="删除" />
                    </div>
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
    
    <!-- 订单详情弹窗 - 使用 Teleport 传送到 body -->
    <Teleport to="body">
      <el-dialog
        v-model="state.detailVisible"
        title="订单详情"
        width="1400px"
        :before-close="handleDetailClose"
        class="order-detail-dialog"
        align-center
      >
      <div v-if="state.loadingDetail" class="detail-loading">
        <i class="el-icon-loading" /> 加载中...
      </div>
      <div v-else-if="state.taskDetail" class="detail-content">
        <div class="detail-item detail-item--inline">
          <div class="detail-inline-group">
            <span class="detail-label">订单号：</span>
            <span class="detail-value">{{ state.taskDetail.orderNo || state.taskDetail.order_no || '-' }}</span>
          </div>
          <div class="detail-inline-group">
            <span class="detail-label">类目名称：</span>
            <span class="detail-value">{{ state.taskDetail.categoryName || state.taskDetail.category_name || '-' }}</span>
          </div>
          <div class="detail-inline-group">
            <span class="detail-label">SKU编号：</span>
            <span class="detail-value">{{ state.taskDetail.sku || '-' }}</span>
          </div>
        </div>
        <div class="detail-item detail-item--images">
          <span class="detail-label">原始套图URL：</span>
          <div class="detail-images">
            <div
              v-for="(url, index) in parseUrlList(state.taskDetail.setImageUrls || state.taskDetail.set_image_urls)"
              :key="`original-${index}`"
              class="detail-image-item"
            >
              <el-image
                :src="url"
                :preview-src-list="parseUrlList(state.taskDetail.setImageUrls || state.taskDetail.set_image_urls)"
                :initial-index="index"
                fit="contain"
                lazy
                loading="lazy"
                class="detail-image"
                preview-teleported
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
            </div>
            <div v-if="parseUrlList(state.taskDetail.setImageUrls || state.taskDetail.set_image_urls).length === 0" class="detail-empty">
              暂无图片
            </div>
          </div>
        </div>
        <div class="detail-item detail-item--images">
          <span class="detail-label">新套图URL：</span>
          <div class="detail-images">
            <div
              v-for="(url, index) in parseUrlList(state.taskDetail.newSetImageUrls || state.taskDetail.new_set_image_urls)"
              :key="`new-${index}`"
              class="detail-image-item"
            >
              <el-image
                :src="url"
                :preview-src-list="parseUrlList(state.taskDetail.newSetImageUrls || state.taskDetail.new_set_image_urls)"
                :initial-index="index"
                fit="contain"
                lazy
                loading="lazy"
                class="detail-image"
                preview-teleported
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
            </div>
            <div v-if="parseUrlList(state.taskDetail.newSetImageUrls || state.taskDetail.new_set_image_urls).length === 0" class="detail-empty">
              暂无图片
            </div>
          </div>
        </div>
        <div class="detail-item detail-item--images">
          <span class="detail-label">定制图片URL：</span>
          <div class="detail-images">
            <div
              v-for="(url, index) in parseUrlList(state.taskDetail.customImageUrls || state.taskDetail.custom_image_urls)"
              :key="`custom-${index}`"
              class="detail-image-item"
            >
              <el-image
                :src="url"
                :preview-src-list="parseUrlList(state.taskDetail.customImageUrls || state.taskDetail.custom_image_urls)"
                :initial-index="index"
                fit="contain"
                lazy
                loading="lazy"
                class="detail-image"
                preview-teleported
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
            </div>
            <div v-if="parseUrlList(state.taskDetail.customImageUrls || state.taskDetail.custom_image_urls).length === 0" class="detail-empty">
              暂无图片
            </div>
          </div>
        </div>
        <div class="detail-item">
          <span class="detail-label">定制文字列表：</span>
          <div class="detail-value">
            {{ state.taskDetail.customTextList || state.taskDetail.custom_text_list || '-' }}
          </div>
        </div>
        <div class="detail-item detail-item--images">
          <span class="detail-label">合成预览图：</span>
          <div class="detail-images">
            <div
              v-if="state.taskDetail.effectiveImgUrl || state.taskDetail.effective_img_url"
              class="detail-image-item"
            >
              <el-image
                :src="state.taskDetail.effectiveImgUrl || state.taskDetail.effective_img_url"
                :preview-src-list="[state.taskDetail.effectiveImgUrl || state.taskDetail.effective_img_url]"
                :initial-index="0"
                fit="contain"
                lazy
                loading="lazy"
                class="detail-image"
                preview-teleported
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
            </div>
            <div v-else class="detail-empty">
              暂无图片
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleDetailClose">关闭</el-button>
      </template>
      </el-dialog>
    </Teleport>
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

type TTaskDetail = {
  id?: number
  orderNo?: string
  categoryName?: string
  setImageUrls?: string
  sku?: string
  newSetImageUrls?: string
  hdImages?: string
  customImageUrls?: string
  customTextList?: string
  effectiveImgUrl?: string
  [key: string]: any
}

type TState = {
  groups: TOrderGroup[]
  groupOrder: Array<number | string>
  loading: boolean
  loadDone: boolean
  refreshing: boolean
  expandedGroups: Set<number | string>
  lastUpdated: string | null
  detailVisible: boolean
  selectedGroup: TOrderGroup | null
  taskDetail: TTaskDetail | null
  loadingDetail: boolean
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
  lastUpdated: null,
  detailVisible: false,
  selectedGroup: null,
  taskDetail: null,
  loadingDetail: false,
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

const groupStats = computed(() => {
  const totals = {
    totalGroups: state.groups.length,
    totalItems: 0,
    imageCount: 0,
    textCount: 0,
  }
  state.groups.forEach((group) => {
    totals.totalItems += group.items.length
    group.items.forEach((item) => {
      if (item.image) {
        totals.imageCount += 1
      }
      if (item.text) {
        totals.textCount += 1
      }
    })
  })
  return totals
})

const lastUpdatedText = computed(() => {
  if (!state.lastUpdated) {
    return ''
  }
  const date = new Date(state.lastUpdated)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
})

const toggleGroup = (sortId: number | string) => {
  if (state.expandedGroups.has(sortId)) {
    state.expandedGroups.delete(sortId)
  } else {
    state.expandedGroups.add(sortId)
  }
}

const getGroupOrderLabel = (group: TOrderGroup) => {
  return group.orderNo ? '订单号' : '任务ID'
}

const getGroupOrderValue = (group: TOrderGroup) => {
  return group.orderNo || String(group.sortId)
}

const getItemSubtitle = (item: TOrderItem) => {
  if (item.orderNo && item.sortIndex != null) {
    return `${item.orderNo}（${item.sortIndex}）`
  }
  
  if (item.orderNo) {
    return item.orderNo
  }
  
  if (item.sortIndex != null) {
    return String(item.sortIndex)
  }
  
  return ''
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
    // 默认不展开，由用户手动展开
    const existing = map.get(key)
    if (!existing) {
      map.set(key, {
        ...group,
        items: [...group.items],
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
    // 保持原始顺序，不排序
    existing.items = Array.from(itemMap.values())
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
  order: Array<number | string>,
) => {
  const groups: TOrderGroup[] = []
  const itemMap = new Map<string, TOrderItem>()
  
  // 按照接口返回的原始顺序处理
  order.forEach((sortId) => {
    const key = String(sortId)
    const textList = textMap.get(key) ?? []
    const imageList = imageMap.get(key) ?? []
    
    // 合并文字和图片，保持原始顺序
    textList.forEach((text) => {
      if (text.sortIndex == null) return
      const itemKey = `${text.sortId}_${text.sortIndex}`
      const existing = itemMap.get(itemKey)
      if (existing) {
        existing.text = text
        existing.orderNo = existing.orderNo || text.orderNo
        existing.categoryName = existing.categoryName || text.categoryName
      } else {
        itemMap.set(itemKey, {
          key: itemKey,
          sortId: text.sortId ?? key,
          sortIndex: text.sortIndex,
          orderNo: text.orderNo,
          categoryName: text.categoryName,
          text,
        })
      }
    })
    
    imageList.forEach((image) => {
      if (image.sortIndex == null) return
      const itemKey = `${image.sortId}_${image.sortIndex}`
      const existing = itemMap.get(itemKey)
      if (existing) {
        existing.image = image
        existing.orderNo = existing.orderNo || image.orderNo
        existing.categoryName = existing.categoryName || image.categoryName
      } else {
        itemMap.set(itemKey, {
          key: itemKey,
          sortId: image.sortId ?? key,
          sortIndex: image.sortIndex,
          orderNo: image.orderNo,
          categoryName: image.categoryName,
          image,
        })
      }
    })
    
    // 收集当前 sortId 的所有 items
    const items: TOrderItem[] = []
    itemMap.forEach((item) => {
      if (String(item.sortId) === key) {
        items.push(item)
      }
    })
    
    if (items.length) {
      const firstItem = items[0]
      groups.push({
        sortId: firstItem.sortId,
        orderNo: firstItem.orderNo,
        categoryName: firstItem.categoryName,
        items,
      })
      // 从 itemMap 中移除已处理的 items
      items.forEach((item) => itemMap.delete(item.key))
    }
  })
  
  // 处理不在 order 中的其他 keys（如果有）
  const allKeys = new Set([...textMap.keys(), ...imageMap.keys()])
  allKeys.forEach((key) => {
    if (!order.includes(key)) {
      const textList = textMap.get(key) ?? []
      const imageList = imageMap.get(key) ?? []
      const items: TOrderItem[] = []
      
      textList.forEach((text) => {
        if (text.sortIndex == null) return
        items.push({
          key: `${text.sortId}_${text.sortIndex}`,
          sortId: text.sortId ?? key,
          sortIndex: text.sortIndex,
          orderNo: text.orderNo,
          categoryName: text.categoryName,
          text,
        })
      })
      
      imageList.forEach((image) => {
        if (image.sortIndex == null) return
        const itemKey = `${image.sortId}_${image.sortIndex}`
        const existing = items.find((item) => item.key === itemKey)
        if (existing) {
          existing.image = image
        } else {
          items.push({
            key: itemKey,
            sortId: image.sortId ?? key,
            sortIndex: image.sortIndex,
            orderNo: image.orderNo,
            categoryName: image.categoryName,
            image,
          })
        }
      })
      
      if (items.length) {
        const firstItem = items[0]
        groups.push({
          sortId: firstItem.sortId,
          orderNo: firstItem.orderNo,
          categoryName: firstItem.categoryName,
          items,
        })
      }
    }
  })
  
  // 不排序，保持原始顺序
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
    const res = await api.redrawTask.getRedrawTaskPageWithNeedRedrawIndex({
      pageNo: pageOptions.pageNo,
      pageSize: pageOptions.pageSize,
    })
    const list = res.data?.list || []

    // 从同一个接口的数据中同时提取图片和文字素材
    const textData = buildTextEntries(list)
    const imageData = buildImageEntries(list)
    
    // 按照接口返回的原始顺序构建 order（保持 list 中的顺序）
    const order: Array<number | string> = []
    const processedIds = new Set<string | number>()
    list.forEach((item: any) => {
      const sortId = item.id ?? item.sortId
      if (sortId != null && !processedIds.has(sortId)) {
        // 只有当该 sortId 有图片或文字素材时才添加到 order
        const hasText = textData.map.has(String(sortId))
        const hasImage = imageData.map.has(String(sortId))
        if (hasText || hasImage) {
          order.push(sortId)
          processedIds.add(sortId)
        }
      }
    })
    
    const groups = buildCombinedGroups(textData.map, imageData.map, order)
    mergeGroups(groups)

    // 默认展开所有组
    groups.forEach((group) => {
      if (group.sortId) {
        state.expandedGroups.add(group.sortId)
      }
    })

    // 设置预览窗图片 - 查找第一条数据的 effectiveImgUrl
    if (init) {
      let previewUrl: string | null = null
      
      // 查找第一条有 effectiveImgUrl 的数据
      for (const group of groups) {
        if (group.items.length > 0) {
          const sortId = group.items[0].sortId
          if (sortId) {
            const taskId = typeof sortId === 'string' ? parseInt(sortId, 10) : sortId
            if (!isNaN(taskId)) {
              const taskData = taskRecordCache.get(taskId)
              if (taskData) {
                const effectiveImgUrl = (taskData as any).effectiveImgUrl ?? (taskData as any).effective_img_url
                if (effectiveImgUrl && typeof effectiveImgUrl === 'string' && effectiveImgUrl.trim().length > 0) {
                  previewUrl = effectiveImgUrl.trim()
                  break
                }
              }
            }
          }
        }
      }
      
      if (previewUrl) {
        controlStore.setPreviewImageUrl(previewUrl)
      } else {
        controlStore.setPreviewImageUrl(null)
      }
    }

    // 判断是否还有更多数据
    if (list.length < pageOptions.pageSize) {
      state.loadDone = true
    } else {
      pageOptions.pageNo += 1
    }
    state.lastUpdated = new Date().toISOString()
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

const selectText = async (text: TTextData) => {
  controlStore.setShowMoveable(false)
  
  // 设置预览窗图片 - 查找对应的 effectiveImgUrl
  if (text.sortId) {
    const taskId = typeof text.sortId === 'string' ? parseInt(text.sortId, 10) : text.sortId
    if (!isNaN(taskId)) {
      let taskData = taskRecordCache.get(taskId)
      if (!taskData) {
        try {
          taskData = await api.redrawTask.getRedrawTaskById(taskId)
          if (taskData) {
            taskRecordCache.set(taskId, taskData)
          }
        } catch (error) {
          console.error('获取任务详情失败:', error)
        }
      }
      if (taskData) {
        const effectiveImgUrl = (taskData as any).effectiveImgUrl ?? (taskData as any).effective_img_url
        if (effectiveImgUrl && typeof effectiveImgUrl === 'string' && effectiveImgUrl.trim().length > 0) {
          controlStore.setPreviewImageUrl(effectiveImgUrl.trim())
        }
      }
    }
  }
  
  const setting = JSON.parse(JSON.stringify(wTextSetting))
  const lastFont = getLastSelectedFont()
  if (lastFont) {
    setting.fontClass = lastFont
    setting.fontFamily = lastFont.value
  }
  setting.text = text.text
  setting.fontSize = text.fontSize
  setting.fontWeight = text.fontWeight
  setting.name = '文本'
  setting.type = 'w-text'
  setting.sortId = text.sortId ?? ''
  setting.sortIndex = text.sortIndex

  const { width: pW, height: pH } = dPage.value
  const textWidth = text.text.length * text.fontSize * 0.6
  setting.left = pW / 2 - textWidth / 2
  setting.top = pH / 2 - text.fontSize / 2
  // 设置初始宽度和高度，避免第一次移动时宽度突然变大
  setting.width = Math.max(textWidth, text.fontSize)
  setting.height = text.fontSize * setting.lineHeight

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
  
  // 设置预览窗图片 - 查找对应的 effectiveImgUrl
  if (image.sortId) {
    const taskId = typeof image.sortId === 'string' ? parseInt(image.sortId, 10) : image.sortId
    if (!isNaN(taskId)) {
      let taskData = taskRecordCache.get(taskId)
      if (!taskData) {
        try {
          taskData = await api.redrawTask.getRedrawTaskById(taskId)
          if (taskData) {
            taskRecordCache.set(taskId, taskData)
          }
        } catch (error) {
          console.error('获取任务详情失败:', error)
        }
      }
      if (taskData) {
        const effectiveImgUrl = (taskData as any).effectiveImgUrl ?? (taskData as any).effective_img_url
        if (effectiveImgUrl && typeof effectiveImgUrl === 'string' && effectiveImgUrl.trim().length > 0) {
          controlStore.setPreviewImageUrl(effectiveImgUrl.trim())
        }
      }
    }
  }
  
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

const handleDeleteOrderItem = async (item: TOrderItem) => {
  if (!item) {
    return
  }
  if (item.image) {
    await handleDeleteImage(item.image)
    return
  }
  if (item.text) {
    await handleDeleteText(item.text)
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

const parseUrlList = (urls?: string | null): string[] => {
  if (!urls || typeof urls !== 'string') {
    return []
  }
  return urls
    .split(',')
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
}

const parseTextList = (textList?: string | null): string[] => {
  if (!textList || typeof textList !== 'string') {
    return []
  }
  // 尝试解析JSON格式
  if (textList.trim().startsWith('[') && textList.trim().endsWith(']')) {
    try {
      const parsed = JSON.parse(textList)
      if (Array.isArray(parsed)) {
        return parsed.filter((t) => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim())
      }
    } catch {
      // fall through
    }
  }
  // 按逗号分隔
  return textList
    .split(',')
    .map((text) => text.trim())
    .filter((text) => text.length > 0)
}

const handleViewDetail = async (group: TOrderGroup) => {
  state.selectedGroup = group
  state.detailVisible = true
  state.loadingDetail = true
  state.taskDetail = null

  try {
    const taskId = typeof group.sortId === 'string' ? parseInt(group.sortId, 10) : group.sortId
    if (isNaN(taskId)) {
      ElMessage.error('任务ID格式错误')
      state.loadingDetail = false
      return
    }

    // 先尝试从缓存获取
    let taskData = taskRecordCache.get(taskId)
    if (!taskData) {
      // 从接口获取
      taskData = await api.redrawTask.getRedrawTaskById(taskId)
      if (taskData) {
        taskRecordCache.set(taskId, taskData)
      }
    } else {
      // 即使有缓存，也检查数据是否完整，如果不完整则重新获取
      const cachedOrderId = (taskData as any).orderId ?? (taskData as any).order_id
      const cachedOrderNo = (taskData as any).orderNo ?? (taskData as any).order_no
      if (!cachedOrderId || !cachedOrderNo) {
        taskData = await api.redrawTask.getRedrawTaskById(taskId)
        if (taskData) {
          taskRecordCache.set(taskId, taskData)
        }
      }
    }

    if (taskData) {
      state.taskDetail = taskData as TTaskDetail
    } else {
      ElMessage.error('获取任务详情失败')
    }
  } catch (error: any) {
    console.error('获取任务详情失败:', error)
    ElMessage.error(error?.message || '获取任务详情失败')
  } finally {
    state.loadingDetail = false
  }
}

const handleDetailClose = () => {
  state.detailVisible = false
  state.selectedGroup = null
  state.taskDetail = null
}

// 处理图片预览器遮罩层点击关闭
const handleImageViewerMaskClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  // 检查是否点击的是遮罩层（不是图片本身或工具栏）
  if (target.classList.contains('el-image-viewer__mask')) {
    // 查找关闭按钮并触发点击
    const closeBtn = document.querySelector('.el-image-viewer__close') as HTMLElement
    if (closeBtn) {
      closeBtn.click()
      e.stopPropagation()
    }
  }
}

onMounted(() => {
  // 监听图片预览器的遮罩层点击事件
  document.addEventListener('click', handleImageViewerMaskClick, true)
  // 自动触发刷新按钮
  handleRefresh()
  eventBus.on('refreshPhotoList', handleRefresh)
  eventBus.on('refreshTextList', handleRefresh)
  eventBus.on('refreshOrderList', handleRefresh)
})

onBeforeUnmount(() => {
  // 移除事件监听
  document.removeEventListener('click', handleImageViewerMaskClick, true)
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
  padding: 1rem 1rem 0.75rem;
  margin-bottom: 0.75rem;

  .header-title {
    font-size: 17px;
    font-weight: 600;
    color: #1d1d1f;
    letter-spacing: -0.02em;
  }

  .refresh-btn {
    color: #007aff;
    padding: 0.4rem;
    border-radius: 8px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      color: #0051d5;
      background: rgba(0, 122, 255, 0.1);
      transform: rotate(90deg);
    }
    
    &:active {
      transform: rotate(90deg) scale(0.95);
    }
  }
}

.order-meta {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 1rem;
  margin-bottom: 0.75rem;

  .meta-counts {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .meta-item {
    border: none;
    border-radius: 12px;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      background: rgba(255, 255, 255, 0.8);
    }
  }

  .meta-label {
    font-size: 11px;
    color: #86868b;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .meta-value {
    font-size: 22px;
    font-weight: 600;
    color: #1d1d1f;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .meta-refresh {
    font-size: 11px;
    color: #9BA5B7;
    text-align: right;
    padding: 0.25rem 0.5rem;
    background: rgba(240, 245, 255, 0.5);
    border-radius: 8px;
    border: 1px solid rgba(200, 220, 255, 0.3);
  }
}

.order-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 0 1rem 120px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
}

.groups-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-group {
  border: none;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
  
  .group-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    cursor: pointer;
    user-select: none;
    background: transparent;
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
    transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      background: rgba(0, 0, 0, 0.02);
    }
    
    &:active {
      background: rgba(0, 0, 0, 0.04);
    }
    
    .collapse-icon {
      color: #6B7A99;
      font-size: 14px;
      transition: all 0.3s ease;
      flex-shrink: 0;
      
      &:hover {
        color: #4A90E2;
        transform: scale(1.1);
      }
    }

    .group-title {
      color: @apple-text-primary;
      font-weight: 600;
      flex: 1;
    }

    .group-count {
      color: #86868b;
      font-size: 13px;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      border: none;
      flex-shrink: 0;
      white-space: nowrap;
    }

    .group-header__content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      min-width: 0;
    }

    .group-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .group-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: nowrap;
      min-width: 0;
      flex: 1;
      overflow: hidden;
    }

    .detail-btn {
      color: #007aff;
      font-size: 13px;
      font-weight: 500;
      padding: 0.4rem 0.75rem;
      margin-left: 0.75rem;
      flex-shrink: 0;
      border-radius: 8px;
      background: rgba(0, 122, 255, 0.1);
      border: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      white-space: nowrap;
      
      &:hover {
        color: #ffffff;
        background: #007aff;
        border: none;
        transform: none;
        box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
      }
      
      &:active {
        transform: scale(0.96);
      }
    }

    .group-category-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.65rem;
      border-radius: 10px;
      border: none;
      background: rgba(52, 199, 89, 0.12);
      color: #34c759;
      font-size: 12px;
      font-weight: 500;
      flex-shrink: 1;
      min-width: 0;
      max-width: 100%;
      box-shadow: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      
      &:hover {
        transform: none;
        box-shadow: none;
        background: rgba(52, 199, 89, 0.18);
      }
    }

    .group-category__label {
      font-weight: 500;
      color: rgba(45, 153, 80, 0.7);
      font-size: 11px;
    }

    .group-category__value {
      font-weight: 600;
      color: #2d9950;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
  }

  .group-content {
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: transparent;
  }
}

.chip {
  padding: 0.35rem 0.75rem;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &.chip-order {
    background: rgba(0, 122, 255, 0.12);
    color: #007aff;
    
    &:hover {
      background: rgba(0, 122, 255, 0.18);
      box-shadow: 0 2px 6px rgba(0, 122, 255, 0.2);
    }
  }

  &.chip-category {
    background: rgba(52, 199, 89, 0.12);
    color: #34c759;
    
    &:hover {
      background: rgba(52, 199, 89, 0.18);
      box-shadow: 0 2px 6px rgba(52, 199, 89, 0.2);
    }
  }
}

.order-item {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }

  &--text-only {
    grid-template-columns: 1fr;
  }

  &--image-only {
    grid-template-columns: 1fr;
  }

  &--stacked {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  &--stacked .order-item__image,
  &--stacked .order-item__text-wrapper {
    grid-column: 1 / -1;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(0, 0, 0, 0.12);
  }
}

.order-item__subtitle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  width: 100%;
}

.order-item__subtitle {
  font-size: 11px;
  color: #86868b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 6px;
  display: inline-block;
  width: fit-content;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
}

// 统一的撤销按钮样式
.order-item__undo,
.undo-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;
  border: none;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  opacity: 1;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
  padding: 0;

  img {
    width: 18px;
    height: 18px;
    pointer-events: none;
    opacity: 0.6;
    display: block;
  }

  &:hover {
    transform: none;
    background: transparent;
    box-shadow: none;
    
    img {
      opacity: 1;
    }
  }
  
  &:active {
    transform: scale(0.95);
  }
}

// 小标题行中的撤销按钮（内联样式）
.order-item__undo-inline {
  position: relative;
  top: auto;
  right: auto;
  flex-shrink: 0;
  width: auto;
  height: auto;
  border: none;
  background: transparent;
  box-shadow: none;
  margin-left: auto;
  padding: 0;
  
  img {
    width: 18px;
    height: 18px;
  }
}

.order-item__image {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: stretch;
  overflow: hidden;
  border: none;
  border-radius: 0;
  padding: 0;
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: none;
  flex: 1;

  &:hover {
    transform: none;
    box-shadow: none;
    border-color: transparent;
    background: transparent;
  }
  
  &:active {
    transform: none;
  }

  .image-thumb {
    width: 100%;
    height: 120px;
    border-radius: 10px;
    object-fit: cover;
    box-shadow: none;
    transition: none;
  }
  
  &:hover .image-thumb {
    box-shadow: none;
    transform: none;
  }

  .image-placeholder,
  .image-error {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #86868b;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 10px;
    font-size: 12px;
  }
}

.order-item__text {
  position: relative;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  flex: 1;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border-color: rgba(0, 0, 0, 0.12);
    background: rgba(255, 255, 255, 0.8);
  }
  
  &:active {
    transform: translateY(0);
  }

  // 文字容器中的撤销按钮使用统一样式，已在上面定义
}

.order-item__text {
  .text-content {
    font-size: 14px;
    color: @apple-text-primary;
    white-space: pre-wrap;
    line-height: 1.5;
  }
}


.empty-state {
  margin-top: 4rem;
  text-align: center;
  padding: 3rem 2rem;
  color: #86868b;
  
  p {
    margin: 0.5rem 0;
    font-size: 14px;
    letter-spacing: -0.01em;
    
    &:first-child {
      font-size: 17px;
      font-weight: 600;
      color: #1d1d1f;
      margin-bottom: 0.75rem;
    }
  }
}

.loading {
  text-align: center;
  padding: 1rem;
  color: @apple-text-secondary;
}

// 订单详情弹窗样式 - 苹果风格
:deep(.order-detail-dialog) {
  .el-dialog {
    border-radius: 20px;
    width: 1400px !important;
    max-width: 90vw;
    max-height: 70vh;
    margin-top: 10vh !important;
    margin-bottom: 10vh !important;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, rgba(240, 248, 255, 0.95) 0%, rgba(245, 240, 255, 0.95) 100%);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    box-shadow: 0 25px 80px rgba(100, 120, 200, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.3);
    overflow: hidden;
  }

  .el-dialog__header {
    padding: 1.75rem 2.5rem;
    border-bottom: 1px solid rgba(200, 220, 255, 0.3);
    background: linear-gradient(135deg, rgba(230, 240, 255, 0.9) 0%, rgba(240, 235, 255, 0.9) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    flex-shrink: 0;
    border-radius: 20px 20px 0 0;

    .el-dialog__title {
      font-size: 22px;
      font-weight: 600;
      background: linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }
    
    .el-dialog__headerbtn {
      .el-dialog__close {
        color: #6B7A99;
        font-size: 20px;
        transition: all 0.2s ease;
        
        &:hover {
          color: #4A90E2;
          transform: scale(1.1);
        }
      }
    }
  }

  .el-dialog__body {
    padding: 2.5rem;
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    background: linear-gradient(180deg, rgba(250, 252, 255, 0.5) 0%, rgba(248, 250, 255, 0.3) 100%);
    
    &::-webkit-scrollbar {
      width: 10px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(240, 245, 255, 0.3);
      border-radius: 10px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, rgba(100, 150, 255, 0.4) 0%, rgba(150, 100, 255, 0.4) 100%);
      border-radius: 10px;
      border: 2px solid transparent;
      background-clip: padding-box;
      
      &:hover {
        background: linear-gradient(135deg, rgba(100, 150, 255, 0.6) 0%, rgba(150, 100, 255, 0.6) 100%);
        background-clip: padding-box;
      }
    }
  }

  .el-dialog__footer {
    padding: 1.5rem 2.5rem;
    border-top: 1px solid rgba(200, 220, 255, 0.3);
    background: linear-gradient(135deg, rgba(245, 250, 255, 0.8) 0%, rgba(250, 245, 255, 0.8) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    flex-shrink: 0;
    border-radius: 0 0 20px 20px;
    
    .el-button {
      background: linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%);
      border: none;
      color: white;
      font-weight: 500;
      padding: 0.75rem 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
  }
}

.detail-loading {
  text-align: center;
  padding: 4rem 3rem;
  color: #6B7A99;
  font-size: 15px;
  font-weight: 500;
  
  i {
    margin-right: 0.75rem;
    color: #4A90E2;
    font-size: 18px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-right: 0.5rem;
  
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

.detail-item {
  display: flex;
  padding: 1.25rem 1.5rem;
  border: 1px solid rgba(200, 220, 255, 0.4);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(100, 150, 255, 0.08);
  transition: all 0.3s ease;
  
  &:nth-child(1) {
    background: linear-gradient(135deg, rgba(230, 245, 255, 0.7) 0%, rgba(240, 250, 255, 0.7) 100%);
    border-color: rgba(100, 180, 255, 0.3);
  }
  
  &:nth-child(2) {
    background: linear-gradient(135deg, rgba(240, 250, 255, 0.7) 0%, rgba(245, 240, 255, 0.7) 100%);
    border-color: rgba(150, 150, 255, 0.3);
  }
  
  &:nth-child(3) {
    background: linear-gradient(135deg, rgba(245, 255, 250, 0.7) 0%, rgba(240, 255, 245, 0.7) 100%);
    border-color: rgba(100, 220, 180, 0.3);
  }
  
  &:nth-child(4) {
    background: linear-gradient(135deg, rgba(255, 250, 240, 0.7) 0%, rgba(255, 245, 230, 0.7) 100%);
    border-color: rgba(255, 180, 100, 0.3);
  }
  
  &:nth-child(5) {
    background: linear-gradient(135deg, rgba(250, 240, 255, 0.7) 0%, rgba(255, 235, 250, 0.7) 100%);
    border-color: rgba(255, 150, 200, 0.3);
  }
  
  &:nth-child(6) {
    background: linear-gradient(135deg, rgba(240, 255, 250, 0.7) 0%, rgba(235, 255, 245, 0.7) 100%);
    border-color: rgba(100, 255, 200, 0.3);
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(100, 150, 255, 0.15);
    border-color: rgba(100, 150, 255, 0.5);
  }
  
  &--images {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  &--inline {
    flex-direction: row !important;
    align-items: center;
    gap: 2rem;
    flex-wrap: nowrap;
    background: linear-gradient(135deg, rgba(235, 245, 255, 0.8) 0%, rgba(245, 240, 255, 0.8) 100%);
    border-color: rgba(120, 160, 255, 0.4);
    
    .detail-inline-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
      white-space: nowrap;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 10px;
      border: 1px solid rgba(200, 220, 255, 0.3);
      
      .detail-label {
        font-size: 15px;
        color: #6B7A99;
        font-weight: 600;
        min-width: auto !important;
        flex-shrink: 0;
        line-height: 1.5;
        white-space: nowrap;
      }
      
      .detail-value {
        font-size: 15px;
        color: #4A90E2;
        font-weight: 600;
        flex: 0 0 auto;
        word-break: normal;
        white-space: nowrap;
      }
    }
  }
  
  .detail-label {
    font-size: 15px;
    color: #6B7A99;
    font-weight: 600;
    min-width: 140px;
    flex-shrink: 0;
    line-height: 1.5;
    letter-spacing: 0.01em;
  }

  .detail-value {
    font-size: 15px;
    color: #2C3E50;
    font-weight: 500;
    flex: 1;
    word-break: break-all;
    line-height: 1.6;
  }
  
  .detail-images {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
    width: 100%;
    margin-top: 0.25rem;
  }
  
  .detail-image-item {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border: 2px solid rgba(200, 220, 255, 0.4);
    border-radius: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(230, 235, 245, 0.95) 0%, rgba(235, 230, 240, 0.95) 100%);
    transition: all 0.3s ease;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(100, 150, 255, 0.1);
    
    &:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 8px 24px rgba(100, 150, 255, 0.25);
      border-color: rgba(100, 150, 255, 0.6);
    }
  }
  
  .detail-image {
    width: 100%;
    height: 100%;
    
    :deep(.el-image__inner) {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  
  .image-placeholder,
  .image-error {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: @apple-text-secondary;
    background: linear-gradient(135deg, rgba(230, 235, 245, 0.95) 0%, rgba(235, 230, 240, 0.95) 100%);
    
    i {
      font-size: 24px;
    }
  }
  
  .detail-text-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    margin-top: 0.25rem;
  }
  
  .detail-text-item {
    padding: 0.75rem 1rem;
    border: 1px solid @apple-border;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.8);
    font-size: 15px;
    color: @apple-text-primary;
    line-height: 1.6;
    word-break: break-all;
  }
  
  .detail-empty {
    color: #9BA5B7;
    font-size: 14px;
    font-style: italic;
    padding: 1.5rem 0;
    text-align: center;
    background: rgba(240, 245, 255, 0.3);
    border-radius: 10px;
    border: 1px dashed rgba(150, 180, 255, 0.3);
  }
}

// 图片预览器样式 - 点击遮罩层关闭
:deep(.el-image-viewer__mask) {
  cursor: pointer;
}

:deep(.el-image-viewer__wrapper) {
  cursor: default;
  
  .el-image-viewer__canvas {
    cursor: default;
  }
}
</style>

