# 🎨 新后端模板API展示功能使用指南

## 📋 功能概述

基于 `template-api-test.html` 的成功例子，我们已经完成了新后端（48080端口）模板接口的集成，并提供了丰富的模板展示功能。

## 🚀 主要功能

### 1. **模板列表展示**
- ✅ 瀑布流布局展示模板封面
- ✅ 自动生成默认封面（当模板没有封面时）
- ✅ 支持无限滚动加载
- ✅ 显示模板统计信息

### 2. **模板详情展示**
- ✅ 详细的模板信息卡片
- ✅ 模板封面预览
- ✅ 模板状态标识
- ✅ 尺寸、边距、时间等信息

### 3. **模板数据查看器**
- ✅ JSON数据格式化显示
- ✅ 数据统计信息
- ✅ 复制和下载功能
- ✅ 原始/格式化切换

## 📁 文件结构

```
src/components/modules/panel/wrap/
├── NewTemplateListWrap.vue          # 主模板列表组件
└── components/
    ├── TemplateDetailCard.vue       # 模板详情卡片
    ├── TemplateDataViewer.vue       # 模板数据查看器
    └── imgWaterFall.vue            # 瀑布流组件（现有）
```

## 🔧 使用方法

### 1. **在路由中使用**

```typescript
// 在路由配置中添加
{
  path: '/templates/new',
  name: 'NewTemplates',
  component: () => import('@/components/modules/panel/wrap/NewTemplateListWrap.vue')
}
```

### 2. **在父组件中使用**

```vue
<template>
  <div>
    <!-- 直接使用模板列表组件 -->
    <NewTemplateListWrap />
  </div>
</template>

<script setup>
import NewTemplateListWrap from '@/components/modules/panel/wrap/NewTemplateListWrap.vue'
</script>
```

### 3. **单独使用模板详情卡片**

```vue
<template>
  <div>
    <TemplateDetailCard 
      :template="selectedTemplate"
      @select="handleSelect"
      @preview="handlePreview"
      @view-data="handleViewData"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TemplateDetailCard from '@/components/modules/panel/wrap/components/TemplateDetailCard.vue'
import type { Template } from '@/api/template'

const selectedTemplate = ref<Template | null>(null)

const handleSelect = (template: Template) => {
  console.log('选择模板:', template)
}

const handlePreview = (template: Template) => {
  console.log('预览模板:', template)
}

const handleViewData = (template: Template) => {
  console.log('查看数据:', template)
}
</script>
```

### 4. **单独使用数据查看器**

```vue
<template>
  <div>
    <el-button @click="showViewer = true">查看模板数据</el-button>
    
    <TemplateDataViewer
      :visible="showViewer"
      :template="currentTemplate"
      @close="showViewer = false"
      @use-template="handleUseTemplate"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TemplateDataViewer from '@/components/modules/panel/wrap/components/TemplateDataViewer.vue'
import type { Template } from '@/api/template'

const showViewer = ref(false)
const currentTemplate = ref<Template | null>(null)

const handleUseTemplate = (template: Template) => {
  console.log('使用模板:', template)
  showViewer.value = false
}
</script>
```

## 🎯 API接口使用

### 1. **使用Store**

```typescript
import { useTemplateStore } from '@/store'

const templateStore = useTemplateStore()

// 获取所有模板
await templateStore.fetchTemplateList()

// 分页查询
await templateStore.fetchTemplatePage({
  pageNo: 1,
  pageSize: 20,
  state: 1 // 只获取启用的模板
})

// 根据ID获取模板
await templateStore.fetchTemplateById('123')
```

### 2. **直接使用API**

```typescript
import { 
  getTemplateList, 
  getTemplatePage, 
  getTemplateById 
} from '@/api/template'

// 获取所有模板
const response = await getTemplateList()
if (response.code === 0) {
  console.log('模板列表:', response.data)
}

// 分页查询
const pageResponse = await getTemplatePage({
  pageNo: 1,
  pageSize: 10,
  state: 1
})
```

## 🎨 样式定制

### 1. **模板统计信息样式**

```less
.template-stats {
  .stats-content {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    justify-content: space-around;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 120px;
      
      .stat-label {
        font-size: 12px;
        color: #999;
        margin-bottom: 4px;
      }
      
      .stat-value {
        font-size: 18px;
        font-weight: bold;
        color: #333;
      }
    }
  }
}
```

### 2. **模板详情卡片样式**

```less
.template-detail-card {
  .detail-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .template-info {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
  }
}
```

## 🔍 数据格式

### 模板数据结构

```typescript
interface Template {
  id: string | number
  title?: string
  name?: string
  cover?: string
  width: number
  height: number
  state: 0 | 1  // 0: 禁用, 1: 启用
  data?: string  // JSON字符串格式的模板数据
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
  createTime?: string
  updateTime?: string
}
```

### API响应格式

```typescript
interface ApiResponse<T> {
  code: number
  data: T
  msg?: string
}

// 分页响应
interface PageResponse<T> {
  list: T[]
  total: number
  pageNo: number
  pageSize: number
}
```

## 🚨 注意事项

1. **Token认证**: 确保用户已登录，API会自动添加认证Token
2. **错误处理**: 组件内置了错误处理，会显示友好的错误提示
3. **加载状态**: 支持加载状态显示，提升用户体验
4. **响应式设计**: 组件支持移动端适配
5. **数据兼容**: 自动转换新后端数据格式以兼容现有组件

## 🎉 测试方法

1. **启动项目**: `npm run dev`
2. **打开测试页面**: `template-integration-test.html`
3. **测试API功能**: 登录后测试各种API接口
4. **测试Vue组件**: 在项目中使用新组件

## 📞 技术支持

如果遇到问题，请检查：
1. 后端服务是否正常运行（48080端口）
2. 用户是否已正确登录
3. Token是否有效
4. 网络连接是否正常

---

**🎯 现在您可以在项目中使用全新的模板展示功能了！**
