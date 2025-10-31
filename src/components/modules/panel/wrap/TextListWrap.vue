<!--
 * @Author: ShawnPhang
 * @Date: 2021-08-27 15:16:07
 * @Description: 文字素材列表 - 从重制任务接口获取custom_text_list字段
 * @LastEditors: Auto
 * @LastEditTime: 2025-01-XX
-->
<template>
  <div class="wrap">
    <div class="text-materials-header">
      <h3>文字</h3>
    </div>
    <div style="height: 0.5rem" />
    <div class="text-materials-container">
      <div v-if="state.textList.length === 0" class="empty-state">
        <p>暂无文字素材</p>
        <p>尝试刷新或检查接口数据</p>
      </div>
      <div v-else class="texts-grid">
        <div 
          v-for="(text, index) in state.textList" 
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
    <div class="other-text-wrap">
      <comp-list-wrap />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { wTextSetting } from '../../widgets/wText/wTextSetting'
import { useControlStore, useCanvasStore, useWidgetStore } from '@/store'
import api from '@/api'

type TTextData = {
  name: string
  text: string
  fontSize: number
  fontWeight: string
}

type TState = {
  textList: TTextData[]
}

const controlStore = useControlStore()
const widgetStore = useWidgetStore()

const { dPage } = storeToRefs(useCanvasStore())

const state = reactive<TState>({
  textList: [],
})

onMounted(() => {
  loadTextsFromApi()
})

const loadTextsFromApi = async () => {
  try {
    const res = await api.redrawTask.getRedrawTaskPage({ pageNo: 1, pageSize: 20 })
    console.log('文字素材API响应:', res)
    
    // 根据API文档，返回格式为: {code: 0, data: {list: [...], total: ...}, msg: ...}
    // templateRequest.get 返回 res.data，所以 res = {code: 0, data: {list: [...], total: ...}, msg: ...}
    const list = res.data?.list || []
    console.log('解析后的列表:', list, '列表长度:', list.length)
    
    const results: TTextData[] = []

    list.forEach((item: any) => {
      // 支持驼峰和蛇形命名两种格式（API文档使用驼峰 customTextList，但后端可能返回蛇形 custom_text_list）
      const customTextList = item.customTextList || item.custom_text_list
      console.log('处理任务项:', {
        id: item.id,
        orderNo: item.orderNo || item.order_no,
        customTextList,
        'customTextList类型': typeof customTextList,
        '是否为数组': Array.isArray(customTextList)
      })
      
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

      // 将文字列表转换为文字素材，确保每个文本都可以单独选择
      // 如果custom_text_list是逗号分隔的字符串（如 "文本1,文本2,文本3"），
      // 这里会将它们拆分成独立的文本项，每个文本都可以单独点击选择
      // 命名规则和图片素材一样：{id}_{index}
      textList.forEach((text, textIndex) => {
        const name = `${item.id ?? ''}_${textIndex + 1}`
        // 去重：如果该名称已添加则跳过
        if (!results.find((r) => r.name === name)) {
          results.push({
            name,
            text,
            fontSize: 24,
            fontWeight: 'normal',
          })
        }
      })
    })

    console.log('最终文字素材列表:', results)
    // 反转数组以倒序显示（使用展开运算符避免修改原数组）
    state.textList = [...results].reverse()
  } catch (e) {
    console.error('加载文字素材失败:', e)
    state.textList = []
  }
}

const selectText = (text: TTextData) => {
  controlStore.setShowMoveable(false) // 清理掉上一次的选择

  let setting = JSON.parse(JSON.stringify(wTextSetting))
  setting.text = text.text
  setting.fontSize = text.fontSize
  setting.fontWeight = text.fontWeight
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
    fontWeight: text.fontWeight
  }
  
  widgetStore.setSelectItem({ data: { value: textData }, type: 'text' })
}

defineExpose({
  selectText,
  dragStart,
})
</script>

<style lang="less" scoped>
.wrap {
  width: 100%;
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.text-materials-header {
  text-align: center;
  margin-bottom: 1rem;
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.2rem;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
}

.text-materials-container {
  width: 100%;
  flex: 1;
  overflow-y: auto;
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

.texts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  padding: 0.5rem 0;
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
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
  color: #fff;
  font-size: 14px;
  font-weight: normal;
  padding: 1rem;
  text-align: center;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.text-name {
  padding: 0.5rem;
  font-size: 0.8rem;
  color: #666;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: #fafafa;
}

.other-text-wrap {
  margin-top: 1rem;
  flex-shrink: 0;
  width: 100%;
}
</style>
