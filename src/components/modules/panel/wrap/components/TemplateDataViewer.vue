<!--
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 模板数据查看器 - 以JSON格式展示模板数据
-->
<template>
  <el-dialog
    title="模板数据查看器"
    :visible.sync="visible"
    width="80%"
    :before-close="handleClose"
    class="template-data-viewer"
  >
    <div class="viewer-content">
      <!-- 模板基本信息 -->
      <el-card shadow="never" class="info-card">
        <div slot="header">
          <span>模板基本信息</span>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">模板ID:</span>
            <span class="value">{{ template?.id }}</span>
          </div>
          <div class="info-item">
            <span class="label">标题:</span>
            <span class="value">{{ template?.title || '无' }}</span>
          </div>
          <div class="info-item">
            <span class="label">名称:</span>
            <span class="value">{{ template?.name || '无' }}</span>
          </div>
          <div class="info-item">
            <span class="label">尺寸:</span>
            <span class="value">{{ template?.width }} × {{ template?.height }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态:</span>
            <el-tag :type="template?.state === 1 ? 'success' : 'danger'" size="small">
              {{ template?.state === 1 ? '启用' : '禁用' }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="label">创建时间:</span>
            <span class="value">{{ formatTime(template?.createTime) }}</span>
          </div>
        </div>
      </el-card>
      
      <!-- 模板数据 -->
      <el-card shadow="never" class="data-card">
        <div slot="header">
          <span>模板数据 (JSON)</span>
          <div class="header-actions">
            <el-button size="mini" @click="copyToClipboard">复制</el-button>
            <el-button size="mini" @click="downloadData">下载</el-button>
            <el-button size="mini" @click="toggleFormat">{{ formatButtonText }}</el-button>
          </div>
        </div>
        
        <div class="data-content">
          <pre v-if="!isFormatted" class="json-data">{{ template?.data || '{}' }}</pre>
          <pre v-else class="json-data formatted">{{ formattedData }}</pre>
        </div>
      </el-card>
      
      <!-- 数据统计 -->
      <el-card shadow="never" class="stats-card" v-if="dataStats">
        <div slot="header">
          <span>数据统计</span>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">数据大小:</span>
            <span class="stat-value">{{ dataStats.size }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">层级深度:</span>
            <span class="stat-value">{{ dataStats.depth }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">元素数量:</span>
            <span class="stat-value">{{ dataStats.elementCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">数据类型:</span>
            <span class="stat-value">{{ dataStats.dataType }}</span>
          </div>
        </div>
      </el-card>
    </div>
    
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handleUseTemplate" :disabled="template?.state !== 1">
        使用此模板
      </el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Template } from '@/api/template'

type TProps = {
  visible: boolean
  template: Template | null
}

type TEmits = {
  (event: 'close'): void
  (event: 'use-template', template: Template): void
}

const props = defineProps<TProps>()
const emit = defineEmits<TEmits>()

const isFormatted = ref(true)

// 格式化JSON数据
const formattedData = computed(() => {
  if (!props.template?.data) return '{}'
  
  try {
    const parsed = JSON.parse(props.template.data)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return props.template.data
  }
})

// 格式化按钮文本
const formatButtonText = computed(() => {
  return isFormatted.value ? '原始格式' : '格式化'
})

// 数据统计
const dataStats = computed(() => {
  if (!props.template?.data) return null
  
  try {
    const parsed = JSON.parse(props.template.data)
    const dataStr = JSON.stringify(parsed)
    
    return {
      size: `${(dataStr.length / 1024).toFixed(2)} KB`,
      depth: getObjectDepth(parsed),
      elementCount: countElements(parsed),
      dataType: Array.isArray(parsed) ? 'Array' : typeof parsed
    }
  } catch {
    return {
      size: `${(props.template.data.length / 1024).toFixed(2)} KB`,
      depth: 0,
      elementCount: 0,
      dataType: 'String'
    }
  }
})

// 获取对象深度
const getObjectDepth = (obj: any, depth = 0): number => {
  if (typeof obj !== 'object' || obj === null) return depth
  
  let maxDepth = depth
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const currentDepth = getObjectDepth(obj[key], depth + 1)
      maxDepth = Math.max(maxDepth, currentDepth)
    }
  }
  return maxDepth
}

// 计算元素数量
const countElements = (obj: any): number => {
  if (typeof obj !== 'object' || obj === null) return 1
  
  let count = 0
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      count += countElements(obj[key])
    }
  }
  return count
}

// 格式化时间
const formatTime = (timeStr?: string): string => {
  if (!timeStr) return '无'
  
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN')
  } catch {
    return timeStr
  }
}

// 复制到剪贴板
const copyToClipboard = async () => {
  try {
    const text = isFormatted.value ? formattedData.value : props.template?.data || '{}'
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 下载数据
const downloadData = () => {
  if (!props.template) return
  
  const text = isFormatted.value ? formattedData.value : props.template.data || '{}'
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `template_${props.template.id}_data.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('数据已下载')
}

// 切换格式
const toggleFormat = () => {
  isFormatted.value = !isFormatted.value
}

// 关闭对话框
const handleClose = () => {
  emit('close')
}

// 使用模板
const handleUseTemplate = () => {
  if (props.template) {
    emit('use-template', props.template)
  }
}

// 监听visible变化，重置格式状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    isFormatted.value = true
  }
})
</script>

<style lang="less" scoped>
.template-data-viewer {
  .viewer-content {
    max-height: 70vh;
    overflow-y: auto;
    
    .info-card, .data-card, .stats-card {
      margin-bottom: 20px;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      
      .info-item {
        display: flex;
        flex-direction: column;
        
        .label {
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
        }
        
        .value {
          font-size: 14px;
          color: #333;
          word-break: break-all;
        }
      }
    }
    
    .data-content {
      .json-data {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 15px;
        margin: 0;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.5;
        max-height: 400px;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-all;
        
        &.formatted {
          white-space: pre;
        }
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      
      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 4px;
        
        .stat-label {
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
        }
        
        .stat-value {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }
      }
    }
  }
  
  .header-actions {
    float: right;
    
    .el-button {
      margin-left: 8px;
    }
  }
  
  .dialog-footer {
    text-align: right;
  }
}

@media (max-width: 768px) {
  .template-data-viewer {
    .viewer-content {
      .info-grid, .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
