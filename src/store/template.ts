/*
 * @Author: AI Assistant
 * @Date: 2024-12-19
 * @Description: 新后端模板状态管理 (48080端口)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getTemplateList, 
  getTemplatePage, 
  getTemplateById, 
  getTemplateByState,
  getEnabledTemplates,
  getDisabledTemplates,
  type Template,
  type TemplatePageParams,
  type TemplatePageResult
} from '../api/template'

export const useTemplateStore = defineStore('template', () => {
  // 状态
  const templates = ref<Template[]>([])
  const currentTemplate = ref<Template | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pageInfo = ref<TemplatePageResult | null>(null)
  
  // 计算属性
  const enabledTemplates = computed(() => 
    templates.value.filter(template => template.state === 1)
  )
  
  const disabledTemplates = computed(() => 
    templates.value.filter(template => template.state === 0)
  )
  
  const templatesCount = computed(() => templates.value.length)
  
  const hasTemplates = computed(() => templates.value.length > 0)
  
  // 动作
  const setLoading = (value: boolean) => {
    loading.value = value
  }
  
  const setError = (message: string | null) => {
    error.value = message
  }
  
  const clearError = () => {
    error.value = null
  }
  
  const setTemplates = (newTemplates: Template[]) => {
    templates.value = newTemplates
  }
  
  const addTemplates = (newTemplates: Template[]) => {
    templates.value.push(...newTemplates)
  }
  
  const setCurrentTemplate = (template: Template | null) => {
    currentTemplate.value = template
  }
  
  const setPageInfo = (info: TemplatePageResult | null) => {
    pageInfo.value = info
  }
  
  // 获取所有模板列表
  const fetchTemplateList = async () => {
    try {
      setLoading(true)
      clearError()
      
      const response = await getTemplateList()
      if (response.code === 0) {
        setTemplates(response.data)
        return response.data
      } else {
        throw new Error(response.msg || '获取模板列表失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取模板列表失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 分页查询模板
  const fetchTemplatePage = async (params: TemplatePageParams) => {
    try {
      setLoading(true)
      clearError()
      
      const response = await getTemplatePage(params)
      if (response.code === 0) {
        const { list, total, pageNo, pageSize } = response.data
        
        // 如果是第一页，替换数据；否则追加数据
        if (pageNo === 1) {
          setTemplates(list)
        } else {
          addTemplates(list)
        }
        
        setPageInfo(response.data)
        return response.data
      } else {
        throw new Error(response.msg || '分页查询模板失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分页查询模板失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 根据ID获取模板详情
  const fetchTemplateById = async (id: string) => {
    try {
      setLoading(true)
      clearError()
      
      const response = await getTemplateById(id)
      if (response.code === 0) {
        setCurrentTemplate(response.data)
        return response.data
      } else {
        throw new Error(response.msg || '获取模板详情失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取模板详情失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 根据状态获取模板列表
  const fetchTemplateByState = async (state: number) => {
    try {
      setLoading(true)
      clearError()
      
      const response = await getTemplateByState(state)
      if (response.code === 0) {
        setTemplates(response.data)
        return response.data
      } else {
        throw new Error(response.msg || '根据状态获取模板失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '根据状态获取模板失败'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }
  
  // 获取启用的模板列表
  const fetchEnabledTemplates = async () => {
    return await fetchTemplateByState(1)
  }
  
  // 获取禁用的模板列表
  const fetchDisabledTemplates = async () => {
    return await fetchTemplateByState(0)
  }
  
  // 根据ID查找模板
  const findTemplateById = (id: string) => {
    return templates.value.find(template => template.id === id)
  }
  
  // 清空模板数据
  const clearTemplates = () => {
    setTemplates([])
    setCurrentTemplate(null)
    setPageInfo(null)
    clearError()
  }
  
  // 重置状态
  const reset = () => {
    clearTemplates()
    setLoading(false)
  }
  
  return {
    // 状态
    templates,
    currentTemplate,
    loading,
    error,
    pageInfo,
    
    // 计算属性
    enabledTemplates,
    disabledTemplates,
    templatesCount,
    hasTemplates,
    
    // 动作
    setLoading,
    setError,
    clearError,
    setTemplates,
    addTemplates,
    setCurrentTemplate,
    setPageInfo,
    fetchTemplateList,
    fetchTemplatePage,
    fetchTemplateById,
    fetchTemplateByState,
    fetchEnabledTemplates,
    fetchDisabledTemplates,
    findTemplateById,
    clearTemplates,
    reset
  }
})

export type TemplateStore = ReturnType<typeof useTemplateStore>
