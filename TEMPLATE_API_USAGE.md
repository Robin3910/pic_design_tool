/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 新后端模板API使用示例
 */

// 示例1: 在Vue组件中使用模板Store
import { useTemplateStore } from '@/store'

export default {
  setup() {
    const templateStore = useTemplateStore()
    
    // 获取所有模板
    const loadTemplates = async () => {
      try {
        await templateStore.fetchTemplateList()
        console.log('模板列表:', templateStore.templates)
      } catch (error) {
        console.error('加载模板失败:', error)
      }
    }
    
    // 分页查询模板
    const loadTemplatesPage = async (pageNo = 1, pageSize = 10) => {
      try {
        await templateStore.fetchTemplatePage({ pageNo, pageSize })
        console.log('分页结果:', templateStore.pageInfo)
      } catch (error) {
        console.error('分页查询失败:', error)
      }
    }
    
    // 根据ID获取模板详情
    const loadTemplateDetail = async (id: string) => {
      try {
        await templateStore.fetchTemplateById(id)
        console.log('模板详情:', templateStore.currentTemplate)
      } catch (error) {
        console.error('获取模板详情失败:', error)
      }
    }
    
    return {
      templateStore,
      loadTemplates,
      loadTemplatesPage,
      loadTemplateDetail
    }
  }
}

// 示例2: 直接使用API函数
import { 
  getTemplateList, 
  getTemplatePage, 
  getTemplateById,
  getEnabledTemplates 
} from '@/api/template'

// 获取所有模板
const getAllTemplates = async () => {
  try {
    const response = await getTemplateList()
    if (response.code === 0) {
      console.log('所有模板:', response.data)
      return response.data
    }
  } catch (error) {
    console.error('获取模板失败:', error)
  }
}

// 分页查询
const getTemplatesPage = async () => {
  try {
    const response = await getTemplatePage({
      pageNo: 1,
      pageSize: 10,
      state: 1 // 只获取启用的模板
    })
    if (response.code === 0) {
      console.log('分页结果:', response.data)
      return response.data
    }
  } catch (error) {
    console.error('分页查询失败:', error)
  }
}

// 获取启用的模板
const getEnabledTemplatesList = async () => {
  try {
    const response = await getEnabledTemplates()
    if (response.code === 0) {
      console.log('启用的模板:', response.data)
      return response.data
    }
  } catch (error) {
    console.error('获取启用模板失败:', error)
  }
}

// 示例3: 在现有组件中替换旧API
// 原来的代码:
// const res = await api.home.getTempList({ search: state.searchKeyword, ...pageOptions })

// 新的代码:
import { useTemplateStore } from '@/store'

const templateStore = useTemplateStore()
const res = await templateStore.fetchTemplatePage({
  pageNo: pageOptions.pageNo,
  pageSize: pageOptions.pageSize,
  state: pageOptions.state
})

// 示例4: 错误处理
const handleTemplateError = (error: any) => {
  if (error.status === 401) {
    // Token过期，需要重新登录
    console.log('Token过期，请重新登录')
    // 可以跳转到登录页
  } else if (error.status === 403) {
    // 权限不足
    console.log('权限不足')
  } else {
    // 其他错误
    console.log('请求失败:', error.message)
  }
}

// 示例5: 在组件中监听状态变化
import { watch } from 'vue'

watch(
  () => templateStore.loading,
  (loading) => {
    if (loading) {
      console.log('正在加载模板...')
    } else {
      console.log('模板加载完成')
    }
  }
)

watch(
  () => templateStore.error,
  (error) => {
    if (error) {
      console.error('模板加载错误:', error)
      // 可以显示错误提示
    }
  }
)
