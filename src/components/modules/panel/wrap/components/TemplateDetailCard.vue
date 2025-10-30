<!--
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 模板详情展示组件 - 显示模板的详细信息
-->
<template>
  <div class="template-detail-card" v-if="template">
    <el-card shadow="hover" class="detail-card">
      <div slot="header" class="card-header">
        <span class="template-title">{{ template.title || template.name || '未命名模板' }}</span>
        <el-tag 
          :type="template.state === 1 ? 'success' : 'danger'" 
          size="small"
          class="state-tag"
        >
          {{ template.state === 1 ? '启用' : '禁用' }}
        </el-tag>
      </div>
      
      <div class="template-info">
        <!-- 模板封面 -->
        <div class="template-cover">
          <el-image 
            :src="template.cover || defaultCover" 
            :alt="template.title"
            fit="cover"
            class="cover-image"
            @error="handleImageError"
          >
            <div slot="error" class="image-error">
              <i class="el-icon-picture-outline"></i>
              <p>封面加载失败</p>
            </div>
          </el-image>
        </div>
        
        <!-- 模板信息 -->
        <div class="template-meta">
          <div class="meta-row">
            <span class="meta-label">模板ID:</span>
            <span class="meta-value">{{ template.id }}</span>
          </div>
          
          <div class="meta-row">
            <span class="meta-label">尺寸:</span>
            <span class="meta-value">{{ template.width }} × {{ template.height }}</span>
          </div>
          
          <div class="meta-row" v-if="template.marginTop !== undefined">
            <span class="meta-label">边距:</span>
            <span class="meta-value">
              上{{ template.marginTop }} 下{{ template.marginBottom }} 
              左{{ template.marginLeft }} 右{{ template.marginRight }}
            </span>
          </div>
          
          <div class="meta-row" v-if="template.createTime">
            <span class="meta-label">创建时间:</span>
            <span class="meta-value">{{ formatTime(template.createTime) }}</span>
          </div>
          
          <div class="meta-row" v-if="template.updateTime">
            <span class="meta-label">更新时间:</span>
            <span class="meta-value">{{ formatTime(template.updateTime) }}</span>
          </div>
          
          <div class="meta-row" v-if="template.name">
            <span class="meta-label">名称:</span>
            <span class="meta-value">{{ template.name }}</span>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="template-actions">
        <el-button 
          type="primary" 
          size="small" 
          @click="handleSelect"
          :disabled="template.state !== 1"
        >
          <i class="el-icon-check"></i> 选择模板
        </el-button>
        
        <el-button 
          size="small" 
          @click="handlePreview"
        >
          <i class="el-icon-view"></i> 预览
        </el-button>
        
        <el-button 
          size="small" 
          @click="handleViewData"
        >
          <i class="el-icon-document"></i> 查看数据
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { Template } from '@/api/template'

type TProps = {
  template: Template | null
}

type TEmits = {
  (event: 'select', template: Template): void
  (event: 'preview', template: Template): void
  (event: 'view-data', template: Template): void
}

const props = defineProps<TProps>()
const emit = defineEmits<TEmits>()

// 生成默认封面
const defaultCover = computed(() => {
  if (!props.template) return ''
  
  const width = props.template.width || 750
  const height = props.template.height || 1334
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="#999">
        ${props.template.title || props.template.name || '模板'}
      </text>
      <text x="50%" y="60%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="12" fill="#ccc">
        ${width} × ${height}
      </text>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
})

// 格式化时间
const formatTime = (timeStr: string): string => {
  try {
    const date = new Date(timeStr)
    return date.toLocaleString('zh-CN')
  } catch {
    return timeStr
  }
}

// 处理图片加载错误
const handleImageError = () => {
  console.log('模板封面加载失败')
}

// 选择模板
const handleSelect = () => {
  if (props.template) {
    emit('select', props.template)
  }
}

// 预览模板
const handlePreview = () => {
  if (props.template) {
    emit('preview', props.template)
  }
}

// 查看模板数据
const handleViewData = () => {
  if (props.template) {
    emit('view-data', props.template)
  }
}
</script>

<style lang="less" scoped>
.template-detail-card {
  margin: 1rem;
  
  .detail-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .template-title {
        font-size: 16px;
        font-weight: bold;
        color: #333;
      }
      
      .state-tag {
        margin-left: 10px;
      }
    }
    
    .template-info {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      
      .template-cover {
        flex-shrink: 0;
        width: 200px;
        height: 150px;
        
        .cover-image {
          width: 100%;
          height: 100%;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        }
        
        .image-error {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          color: #999;
          border-radius: 4px;
          
          i {
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          p {
            margin: 0;
            font-size: 12px;
          }
        }
      }
      
      .template-meta {
        flex: 1;
        
        .meta-row {
          display: flex;
          margin-bottom: 8px;
          
          .meta-label {
            width: 80px;
            font-size: 14px;
            color: #666;
            flex-shrink: 0;
          }
          
          .meta-value {
            font-size: 14px;
            color: #333;
            word-break: break-all;
          }
        }
      }
    }
    
    .template-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      padding-top: 15px;
      border-top: 1px solid #f0f0f0;
    }
  }
}

@media (max-width: 768px) {
  .template-detail-card {
    .template-info {
      flex-direction: column;
      
      .template-cover {
        width: 100%;
        height: 200px;
      }
    }
    
    .template-actions {
      flex-direction: column;
      
      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
