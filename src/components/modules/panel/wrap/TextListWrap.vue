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
                <div class="text-name">{{ text.name }}</div>
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
import { wTextSetting } from '../../widgets/wText/wTextSetting'
import RefreshIcon from '@/components/common/Icon/RefreshIcon.vue'
import { useControlStore, useCanvasStore, useWidgetStore } from '@/store'
import api from '@/api'
import eventBus from '@/utils/plugins/eventBus'

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

// 切换分组展开/折叠
const toggleGroup = (sortId: number | string) => {
  if (state.expandedGroups.has(sortId)) {
    state.expandedGroups.delete(sortId)
  } else {
    state.expandedGroups.add(sortId)
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
    console.log('文字素材API响应:', res)
    console.log('API响应结构:', {
      code: res.code,
      hasData: !!res.data,
      dataType: typeof res.data,
      dataKeys: res.data ? Object.keys(res.data) : [],
      dataValue: res.data
    })
    
    // 根据API文档，返回格式为: {code: 0, data: {list: [...], total: ...}, msg: ...}
    // templateRequest.get 返回 res.data，所以 res = {code: 0, data: {list: [...], total: ...}, msg: ...}
    const list = res.data?.list || []
    console.log('解析后的列表:', list, '列表长度:', list.length)
    
    const results: TTextData[] = []

    list.forEach((item: any) => {
      // 解析需重制序号（支持 number、字符串"1,2,3"、数组）
      // 必须先检查 need_redraw_index，如果没有则跳过整个任务项
      const raw = (item as any).need_redraw_index ?? (item as any).needRedrawIndex
      console.log('处理任务项:', {
        id: item.id,
        orderNo: item.orderNo || item.order_no,
        need_redraw_index: raw,
        'need_redraw_index类型': typeof raw
      })
      
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
        console.log('任务项无need_redraw_index或解析为空，跳过整个任务项')
        return
      }
      const indexSet = new Set(indices)
      console.log('need_redraw_index解析后的索引集合:', Array.from(indexSet))

      // 支持驼峰和蛇形命名两种格式（API文档使用驼峰 customTextList，但后端可能返回蛇形 custom_text_list）
      const customTextList = item.customTextList || item.custom_text_list
      console.log('customTextList:', customTextList, '类型:', typeof customTextList)
      
      if (!customTextList) {
        console.log('任务项无customTextList，跳过')
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
          console.log('customTextList为空字符串，跳过')
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
              console.log('解析为JSON数组:', textList)
            } else {
              // JSON对象但不是数组，当作逗号分隔字符串处理
              textList = trimmed
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0)
              console.log('JSON解析后非数组，按逗号分隔处理:', textList)
            }
          } catch {
            // JSON解析失败，按逗号分隔字符串处理
            textList = trimmed
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0)
            console.log('JSON解析失败，按逗号分隔字符串解析:', textList)
          }
        } else {
          // 不是JSON格式，直接按英文逗号分隔处理（最常见的情况）
          // 例如："文本1,文本2,文本3" -> ["文本1", "文本2", "文本3"]
          textList = trimmed
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
          console.log('按英文逗号分隔字符串解析:', textList)
        }
      } else {
        console.log('customTextList格式不支持:', typeof customTextList, customTextList)
        return
      }
      
      console.log('解析后的文字列表:', textList, '数量:', textList.length)

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
            console.log(`添加文字素材: ${name}, 文本: ${text}, 索引: ${idx}`)
          }
        } else {
          console.log(`跳过文字索引 ${idx}，不在need_redraw_index中`)
        }
      })
      console.log(`任务项 ${item.id} 共添加了 ${addedCount} 个文字素材`)
    })

    console.log('最终文字素材列表:', results)
    // 不排序，保持接口输出的原始顺序
    
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
.wrap {
  width: 100%;
  height: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  position: relative;
}

.text-materials-container {
  width: 100%;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 150px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.text-materials-container::-webkit-scrollbar {
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

.text-group {
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
  background: linear-gradient(135deg, #2d9f5f 0%, #2ba89a 100%);
  color: #fff;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #2ba89a 0%, #2d9f5f 100%);
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

.texts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  padding: 0.25rem 0;
}

.text-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.text-content {
  width: 100%;
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0d737a 0%, #35a6aa 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: normal;
  padding: 0.5rem;
  text-align: center;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.text-name {
  padding: 0.35rem;
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
</style>
