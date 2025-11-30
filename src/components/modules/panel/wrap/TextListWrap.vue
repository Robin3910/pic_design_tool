<!--
 * @Author: ShawnPhang
 * @Date: 2021-08-27 15:16:07
 * @Description: 文字素材列表 - 从重制任务接口获取custom_text_list字段
 * @LastEditors: Auto
 * @LastEditTime: 2025-01-XX
-->
<template>
  <div class="wrap">
    <div class="header-with-refresh">
      <span class="header-title">文字</span>
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
      class="text-materials-container infinite-list"
      :infinite-scroll-distance="150"
    >
      <div v-if="state.textList.length === 0 && !state.loading" class="empty-state">
        <p>暂无文字素材</p>
        <p>尝试刷新或检查接口数据</p>
      </div>
      <template v-else-if="groupedTexts && groupedTexts.length > 0">
        <div class="groups-container">
          <div 
            v-for="(group, groupIndex) in groupedTexts" 
            :key="group.sortId || groupIndex"
            class="text-group"
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
            <span class="group-count">({{ group.texts.length }})</span>
          </div>
          <div 
            v-show="state.expandedGroups.has(group.sortId)"
            class="group-content"
          >
            <div class="texts-grid">
              <div 
                v-for="(text, index) in group.texts" 
                :key="index"
                class="text-item"
                @click="selectText(text)"
                @mousedown="dragStart($event, text)"
              >
                <div class="text-content">
                  {{ text.text }}
                </div>
                <div class="text-name">{{ getTextDisplayName(text) }}</div>
                <div class="undo-btn" @click.stop="handleDelete(text)" title="撤销">
                  <img src="/删除.svg" alt="删除" />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </template>
      <div v-else-if="!state.loading" class="empty-state">
        <p>暂无文字素材</p>
        <p>尝试刷新或检查接口数据</p>
      </div>
      <div v-show="state.loading" class="loading"><i class="el-icon-loading" /> 拼命加载中</div>
      <div v-show="state.loadDone && state.textList.length > 0" class="loading">全部加载完毕</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, onMounted, onBeforeUnmount, ref, nextTick, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { wTextSetting, getLastSelectedFont } from '../../widgets/wText/wTextSetting'
import RefreshIcon from '@/components/common/Icon/RefreshIcon.vue'
import { useControlStore, useCanvasStore, useWidgetStore, useUiStore } from '@/store'
import api from '@/api'
import eventBus from '@/utils/plugins/eventBus'
import { ElMessage } from 'element-plus'
import { taskRecordCache } from '@/utils/taskRecordCache'

type TTextData = {
  name: string
  text: string
  fontSize: number
  fontWeight: string
  // 排序字段（不显示）
  sortId?: number | string
  sortIndex?: number
  // 显示字段
  orderNo?: string
  categoryName?: string
}

type TTextGroup = {
  sortId: number | string
  texts: TTextData[]
  orderNo?: string
  categoryName?: string
}

type TState = {
  textList: TTextData[]
  refreshing: boolean
  loading: boolean
  loadDone: boolean
  expandedGroups: Set<number | string>
}

const controlStore = useControlStore()
const widgetStore = useWidgetStore()
const uiStore = useUiStore()

const { dPage } = storeToRefs(useCanvasStore())

const state = reactive<TState>({
  textList: [],
  refreshing: false,
  loading: false,
  loadDone: false,
  expandedGroups: new Set<number | string>(),
})

const scrollContainerRef = ref<HTMLElement | null>(null)

const pageOptions = { pageNo: 1, pageSize: 40 }

// 按 sortId 分组文字
const groupedTexts = computed<TTextGroup[]>(() => {
  try {
    if (!state.textList || state.textList.length === 0) {
      return []
    }
    
    const groupsMap = new Map<number | string, TTextGroup>()
    
    state.textList.forEach((text) => {
      const sortId = text.sortId ?? 'unknown'
      if (!groupsMap.has(sortId)) {
        groupsMap.set(sortId, {
          sortId,
          texts: [],
          orderNo: text.orderNo,
          categoryName: text.categoryName,
        })
      }
      groupsMap.get(sortId)!.texts.push(text)
    })
    
    // 转换为数组，保持原始顺序（按第一个文字的顺序）
    return Array.from(groupsMap.values())
  } catch (error) {
    console.error('groupedTexts computed error:', error)
    return []
  }
})

// 获取分组标题
const getGroupTitle = (group: TTextGroup): string => {
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

const getTextDisplayName = (text: TTextData): string => {
  return text.sortIndex != null ? String(text.sortIndex) : ''
}

// 切换分组展开/折叠
const toggleGroup = (sortId: number | string) => {
  if (state.expandedGroups.has(sortId)) {
    state.expandedGroups.delete(sortId)
  } else {
    state.expandedGroups.add(sortId)
  }
}

// 删除文本素材（从 need_redraw_index 中移除对应序号）
const handleDelete = async (text: TTextData | null) => {
  
  if (!text) {
    return
  }
  
  if (!text.sortId || text.sortIndex == null) {
    ElMessage.warning('无法删除：缺少必要的任务信息')
    return
  }

  try {
    // 查询任务记录详情
    const taskId = typeof text.sortId === 'string' ? parseInt(text.sortId, 10) : text.sortId
    if (isNaN(taskId)) {
      ElMessage.error('任务ID格式错误')
      return
    }

    // 优先使用缓存的任务数据
    let taskData = taskRecordCache.get(taskId)
    if (!taskData) {
      // 如果缓存中没有，从接口获取
      taskData = await api.redrawTask.getRedrawTaskById(taskId)
      if (taskData) {
        // 缓存任务数据
        taskRecordCache.set(taskId, taskData)
      } else {
        ElMessage.error('获取任务详情失败')
        return
      }
    }

    // 获取 orderId 和 orderNo（兼容驼峰和蛇形命名）
    const orderId = (taskData as any).orderId ?? (taskData as any).order_id
    const orderNo = (taskData as any).orderNo ?? (taskData as any).order_no

    // 检查必要字段是否存在
    if (!orderId || !orderNo || (typeof orderNo === 'string' && orderNo.trim().length === 0)) {
      // 如果缓存数据缺少必要字段，从接口重新查询
      console.warn(`任务记录 ${taskId} 缓存数据不完整（缺少 orderId 或 orderNo），从接口重新查询`)
      taskData = await api.redrawTask.getRedrawTaskById(taskId)
      if (taskData) {
        taskRecordCache.set(taskId, taskData)
        const retryOrderId = (taskData as any).orderId ?? (taskData as any).order_id
        const retryOrderNo = (taskData as any).orderNo ?? (taskData as any).order_no
        if (!retryOrderId || !retryOrderNo || (typeof retryOrderNo === 'string' && retryOrderNo.trim().length === 0)) {
          ElMessage.error('获取任务详情失败：缺少必要的订单信息')
          return
        }
      } else {
        ElMessage.error('获取任务详情失败')
        return
      }
    }

    // 获取当前的 need_redraw_index
    const raw = taskData.need_redraw_index ?? taskData.needRedrawIndex
    let indices: number[] = []
    if (Array.isArray(raw)) {
      indices = raw.map((n) => parseInt(String(n), 10)).filter((n) => !isNaN(n))
    } else if (typeof raw === 'string') {
      indices = raw
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    } else if (typeof raw === 'number') {
      indices = [raw]
    }

    // 移除对应的序号
    const indexToRemove = text.sortIndex
    const newIndices = indices.filter((idx) => idx !== indexToRemove)

    if (newIndices.length === indices.length) {
      ElMessage.warning('该文本素材不在需重制列表中')
      return
    }

    // 获取最终的 orderId 和 orderNo（如果重新查询了，使用新的值）
    const finalOrderId = (taskData as any).orderId ?? (taskData as any).order_id
    const finalOrderNo = (taskData as any).orderNo ?? (taskData as any).order_no

    // 更新 need_redraw_index（使用驼峰命名）
    const updateData: any = {
      id: taskId,
      orderId: finalOrderId,
      orderNo: finalOrderNo,
      needRedrawIndex: newIndices.length > 0 ? newIndices.join(',') : '',
    }

    // 调用更新接口
    const updateRes = await api.redrawTask.updateRedrawTask(updateData)
    if (updateRes.code === 0) {
      ElMessage.success('删除成功')
      // 更新缓存（兼容驼峰和蛇形命名）
      taskRecordCache.set(taskId, { 
        ...taskData, 
        need_redraw_index: updateData.needRedrawIndex,
        needRedrawIndex: updateData.needRedrawIndex
      })
      // 刷新列表
      await handleRefresh()
    } else {
      ElMessage.error(updateRes.msg || '删除失败')
    }
  } catch (error: any) {
    console.error('删除文本素材失败:', error)
    ElMessage.error(error?.message || '删除失败')
  }
}

onMounted(() => {
  loadTextsFromApi(true)
  // 监听刷新事件
  eventBus.on('refreshTextList', handleRefresh)
})

onBeforeUnmount(() => {
  // 清理事件监听
  eventBus.off('refreshTextList', handleRefresh)
})

const loadTextsFromApi = async (init: boolean = false) => {
  if (init) {
    state.textList = []
    pageOptions.pageNo = 1
    state.loadDone = false
  }
  if (state.loadDone || state.loading) {
    return
  }
  state.loading = true
  try {
    const res = await api.redrawTask.getRedrawTaskPageWithCustomText({ 
      pageNo: pageOptions.pageNo, 
      pageSize: pageOptions.pageSize 
    })
    
    // 根据API文档，返回格式为: {code: 0, data: {list: [...], total: ...}, msg: ...}
    // templateRequest.get 返回 res.data，所以 res = {code: 0, data: {list: [...], total: ...}, msg: ...}
    const list = res.data?.list || []
    
    const results: TTextData[] = []
    const itemsWithTexts = new Set<string | number>()

    list.forEach((item: any) => {
      // 解析需重制序号（支持 number、字符串"1,2,3"、数组）
      // 必须先检查 need_redraw_index，如果没有则跳过整个任务项
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

      // 如果没有 need_redraw_index 或解析后为空，跳过整个任务项
      if (!raw || indices.length === 0) {
        return
      }
      const indexSet = new Set(indices)

      // 支持驼峰和蛇形命名两种格式（API文档使用驼峰 customTextList，但后端可能返回蛇形 custom_text_list）
      const customTextList = item.customTextList || item.custom_text_list
      
      if (!customTextList) {
        return
      }

      let textList: string[] = []

      // 解析 customTextList（一个ID返回的custom_text_list字段可能包含多个文本，用英文逗号分隔）
      // 例如："文本1,文本2,文本3" 需要拆分成独立的文本项，每个文本都可以单独选择
      // 同时兼容数组、JSON字符串、逗号分隔字符串等多种格式
      if (Array.isArray(customTextList)) {
        // 已经是数组格式，直接使用
        textList = customTextList
          .filter((t) => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim())
      } else if (typeof customTextList === 'string') {
        const trimmed = customTextList.trim()
        if (!trimmed) {
          return
        }
        
        // 优先检查是否为JSON数组格式（以 [ 开头）
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed)) {
              // JSON数组格式，例如：'["文本1","文本2"]'
              textList = parsed
                .filter((t) => typeof t === 'string' && t.trim().length > 0)
                .map((t) => t.trim())
            } else {
              // JSON对象但不是数组，当作逗号分隔字符串处理
              textList = trimmed
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0)
            }
          } catch {
            // JSON解析失败，按逗号分隔字符串处理
            textList = trimmed
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0)
          }
        } else {
          // 不是JSON格式，直接按英文逗号分隔处理（最常见的情况）
          // 例如："文本1,文本2,文本3" -> ["文本1", "文本2", "文本3"]
          textList = trimmed
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
        }
      } else {
        return
      }

      // 将文字列表转换为文字素材，只显示need_redraw_index中指定的文字
      // 命名规则和图片素材一样：{id}_{index}
      // textIndex从0开始，但索引从1开始，所以需要 textIndex + 1
      let addedCount = 0
      textList.forEach((text, textIndex) => {
        const idx = textIndex + 1
        // 只显示need_redraw_index中包含的索引
        if (indexSet.has(idx)) {
          const name = `${item.id ?? ''}_${idx}`
          // 去重：如果该名称已添加则跳过
          if (!results.find((r) => r.name === name)) {
            results.push({
              name,
              text,
              fontSize: 24,
              fontWeight: 'normal',
              sortId: item.id ?? '',
              sortIndex: idx,
              orderNo: item.orderNo || item.order_no || '',
              categoryName: item.categoryName || item.category_name || '',
            })
            addedCount++
          }
        }
      })

      if (addedCount > 0 && item.id != null) {
        itemsWithTexts.add(item.id)
      }
    })
    // 不排序，保持接口输出的原始顺序

    let previewUrl: string | null = null
    for (const item of list) {
      if (item.id != null && itemsWithTexts.has(item.id)) {
        const effectiveImgUrl = item.effectiveImgUrl ?? item.effective_img_url
        if (typeof effectiveImgUrl === 'string' && effectiveImgUrl.trim().length > 0) {
          previewUrl = effectiveImgUrl.trim()
          break
        }
      }
    }

    if (previewUrl) {
      controlStore.setPreviewImageUrl(previewUrl)
    } else if (init) {
      controlStore.setPreviewImageUrl(null)
    }
    
    if (init) {
      state.textList = results
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
        if (!state.textList.find(existing => existing.name === newItem.name && existing.text === newItem.text)) {
          state.textList.push(newItem)
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
    console.error('加载文字素材失败:', e)
    if (init) {
      state.textList = []
    }
    state.loadDone = true
  } finally {
    state.loading = false
  }
}

const load = () => {
  loadTextsFromApi(false)
}

const selectText = (text: TTextData) => {
  controlStore.setShowMoveable(false) // 清理掉上一次的选择

  let setting = JSON.parse(JSON.stringify(wTextSetting))
  // 应用记忆的字体
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
  
  // 计算文字宽度（简单估算）
  const textWidth = text.text.length * text.fontSize * 0.6
  setting.left = pW / 2 - textWidth / 2
  setting.top = pH / 2 - text.fontSize / 2

  widgetStore.addWidget(setting)
}

const dragStart = (event: MouseEvent, text: TTextData) => {
  const textData = {
    name: text.name,
    text: text.text,
    fontSize: text.fontSize,
    fontWeight: text.fontWeight,
    sortId: text.sortId ?? '',
    sortIndex: text.sortIndex
  }
  
  widgetStore.setSelectItem({ data: { value: textData }, type: 'text' })
}

const handleRefresh = async () => {
  if (state.refreshing) return
  state.refreshing = true
  await loadTextsFromApi(true)
  // 刷新后重置滚动位置到顶部
  await nextTick()
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0
  }
  state.refreshing = false
}

defineExpose({
  selectText,
  dragStart,
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
  display: flex;
  flex-direction: column;
  position: relative;
  background: transparent;
}

.text-materials-container {
  width: 100%;
  flex: 1;
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

.groups-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.text-group {
  background: @apple-bg;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 12px;
  border: 1px solid @apple-border;
  box-shadow: 0 2px 12px @apple-shadow;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    box-shadow: 0 4px 20px @apple-shadow-hover;
    transform: translateY(-1px);
  }
}

.group-header {
  display: flex;
  align-items: center;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, rgba(45, 159, 95, 0.15) 0%, rgba(43, 168, 154, 0.15) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: @apple-text-primary;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid @apple-border;
  
  &:hover {
    background: linear-gradient(135deg, rgba(45, 159, 95, 0.2) 0%, rgba(43, 168, 154, 0.2) 100%);
  }
  
  .collapse-icon {
    margin-right: 0.75rem;
    font-size: 14px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: #2d9f5f;
  }
  
  .group-title {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: @apple-text-primary;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
  }
  
  .group-count {
    font-size: 12px;
    color: @apple-text-secondary;
    margin-left: 0.5rem;
    font-weight: 500;
  }
}

.group-content {
  padding: 0.875rem;
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

.texts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;
  padding: 0.25rem 0;
}

.text-item {
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid @apple-border;
  box-shadow: 0 2px 8px @apple-shadow;
  position: relative;
  
  &:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 6px 20px @apple-shadow-hover;
    border-color: #2d9f5f;
    
    .undo-btn {
      opacity: 1;
      visibility: visible;
    }
  }
  
  &:active {
    transform: translateY(-1px) scale(1);
  }
}

.text-content {
  width: 100%;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(13, 115, 122, 0.9) 0%, rgba(53, 166, 170, 0.9) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  padding: 0.625rem;
  text-align: center;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

.text-name {
  padding: 0.5rem 0.375rem;
  font-size: 11px;
  color: @apple-text-secondary;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: rgba(250, 250, 250, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-weight: 500;
  letter-spacing: -0.01em;
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
</style>
