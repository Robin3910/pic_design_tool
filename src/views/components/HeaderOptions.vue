<!--
 * @Author: ShawnPhang
 * @Date: 2022-01-12 11:26:53
 * @Description: 顶部操作按钮组
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-17 09:49:01
-->
<template>
  <div class="top-icon-wrap">
    <template v-if="tempEditing">
      <!-- 注释掉保存模板功能 - 依赖后端服务 -->
      <!-- <span style="color: #999; font-size: 14px; margin-right: 0.5rem">{{ state.stateBollean ? '启用' : '停用' }}</span> <el-switch v-model="state.stateBollean" @change="stateChange" />
      <div class="divide__line">|</div> -->
      <!-- <el-button plain type="primary" @click="saveTemp">保存模板</el-button> -->
      <el-button @click="userStore.managerEdit(false)">取消</el-button>
      <!-- <el-button @click="$store.commit('managerEdit', false)">取消</el-button> -->
      <div class="divide__line">|</div>
    </template>
    <!-- 注释掉修改模板功能 - 依赖后端服务 -->
    <!-- <el-button v-else style="margin-right: 1rem" @click="jump2Edit">修改模板</el-button> -->
    <!-- <copyRight> -->
    <slot />
    <!-- <el-button :loading="state.loading" size="large" class="primary-btn" :disabled="tempEditing" plain type="primary" @click="download">下载作品</el-button> -->
    <!-- </copyRight> -->
    <!-- 清除缓存和刷新按钮 -->
    <el-button 
      class="clear-cache-btn"
      @click="handleClearCacheAndRefresh"
      title="清除缓存并刷新页面"
      size="default"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 6px;">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="currentColor"/>
      </svg>
      <span>清除缓存</span>
    </el-button>
    <!-- 登出按钮 -->
    <el-button 
      v-if="authStore.isLoggedIn"
      class="logout-btn"
      @click="handleLogout"
    >
      <img src="/登出.svg" alt="登出" />
      <span>登出</span>
    </el-button>
  </div>
  <!-- 生成图片组件 -->
  <SaveImage ref="canvasImage" />
</template>

<script lang="ts" setup>
import api from '@/api'
import { reactive, toRefs, ref, computed } from 'vue'
import dayjs from 'dayjs'
import { taskRecordCache } from '@/utils/taskRecordCache'
import { useRoute, useRouter } from 'vue-router'
import _dl from '@/common/methods/download'
import useNotification from '@/common/methods/notification'
import SaveImage from '@/components/business/save-download/CreateCover.vue'
import { useFontStore } from '@/common/methods/fonts'
// import copyRight from './CopyRight.vue'
import _config from '@/config'
import downloadBlob from '@/common/methods/download/downloadBlob'
import { useControlStore, useHistoryStore, useCanvasStore, useUserStore, useWidgetStore, useTemplateStore } from '@/store/index'
import { useAuthStore } from '@/store/auth'
import { storeToRefs } from 'pinia'
import { uploadToOSS } from '@/api/temu'
import eventBus from '@/utils/plugins/eventBus'

type TProps = {
  modelValue?: boolean
}

type TEmits = {
  (event: 'change', data: { downloadPercent: number; downloadText: string; downloadMsg?: string }): void
  (event: 'update:modelValue', data: boolean): void
}

type TState = {
  stateBollean: boolean
  wmBollean: boolean
  title: string
  loading: boolean
}

const props = defineProps<TProps>()
const emit = defineEmits<TEmits>()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const widgetStore = useWidgetStore()
const authStore = useAuthStore()

const canvasImage = ref<typeof SaveImage | null>(null)

// 获取用户头像 - 使用 computed 使其响应式
const userAvatar = computed(() => authStore.user?.avatar)

// 清除缓存并刷新页面
function handleClearCacheAndRefresh() {
  try {
    // 清除任务记录缓存
    taskRecordCache.clear()
    console.log('任务记录缓存已清除')
    
    // 清除 localStorage 中的非关键数据
    // 保留 token 相关数据，避免清除后需要重新登录
    localStorage.removeItem('ui_zoom_percent')
    localStorage.removeItem('poster_design_autosave')
    console.log('localStorage 缓存已清除')
    
    // 显示提示
    useNotification('缓存已清除', '页面即将刷新', { type: 'success' })
    
    // 延迟刷新，让用户看到提示
    setTimeout(() => {
      window.location.reload()
    }, 500)
  } catch (error) {
    console.error('清除缓存失败:', error)
    useNotification('清除缓存失败', '请重试', { type: 'error' })
  }
}

// 登出按钮点击事件
async function handleLogout() {
  try {
    await authStore.logoutAction()
    // 登出成功后跳转到登录页
    router.push('/login')
  } catch (error) {
    console.error('登出失败:', error)
    useNotification('登出失败', '请重试', { type: 'error' })
  }
}

// const {
//   dWidgets, tempEditing
// } = useSetupMapGetters(['dWidgets', 'tempEditing'])

const pageStore = useCanvasStore()
const controlStore = useControlStore()
const historyStore = useHistoryStore()
const templateStore = useTemplateStore()

const { dPage } = storeToRefs(pageStore)
const { tempEditing } = storeToRefs(userStore)
const { dWidgets, dLayouts } = storeToRefs(widgetStore)
const { dHistoryStack } = storeToRefs(useHistoryStore())

const state = reactive<TState>({
  stateBollean: false,
  wmBollean: false,
  title: '',
  loading: false,
})

// 保存作品 - 已注释，依赖后端服务
// async function save(hasCover: boolean = false) {
//   // 保存用户作品的原理和保存模板是相通的，所以这里反过来用模板示例
//   await saveTemp()
//   // // 没有任何修改记录则不保存
//   // if (dHistoryStack.value.changes.length <= 0) {
//   //   return
//   // }
//   // controlStore.setShowMoveable(false) // 清理掉上一次的选择框
//   // const { id, tempid } = route.query
//   // const data = widgetStore.dLayouts
//   // const { id: newId, stat, msg } = await api.home.saveWorks({ id: id as string, title: state.title || '未命名设计', data: JSON.stringify(data), temp_id: tempid as string, width: dPage.value.width, height: dPage.value.height })
//   // stat !== 0 ? useNotification('保存成功', '可在"我的作品"中查看') : useNotification('保存失败', msg, { type: 'error' })
//   // !id && router.push({ path: '/home', query: { id: newId }, replace: true })
//   // controlStore.setShowMoveable(true)
// }

// 保存模板 - 已注释，依赖后端服务
// async function saveTemp() {
//   const { tempid, tempType: type } = route.query
//   if (!tempid) return
//   let res = null
//   const data = widgetStore.dLayouts
//   if (Number(type) == 1) {
//     // 保存组件，组合元素要保证在最后一位，才能默认选中
//     if (dWidgets.value[0].type === 'w-group') {
//       const group = dWidgets.value.shift()
//       if (!group) return
//       group.record.width = 0
//       group.record.height = 0
//       dWidgets.value.push(group)
//     }
//     // TODO：如果保存组件不存在组合，则添加组合。该功能待优化
//     if (!dWidgets.value.some((x: Record<string, any>) => x.type === 'w-group')) {
//       alert('提交组件必须为组合！')
//       return
//       // proxy.dWidgets.push(wGroup.setting)
//     }
//     res = await api.home.saveTemp({ id: tempid, type, title: state.title || '未命名组件', data: JSON.stringify(dWidgets.value), width: dPage.value.width, height: dPage.value.height })
//   } else res = await api.home.saveTemp({ id: tempid, title: state.title || '未命名模板', data: JSON.stringify(data), width: dPage.value.width, height: dPage.value.height })
//   res.stat != 0 && useNotification('保存成功', '模板内容已变更')
//   !tempid && router.push({ path: '/home', query: { tempid: res.id }, replace: true })
// }

// 停用启用 - 已注释，依赖后端服务
// async function stateChange(e: string | number | boolean) {
//   const { tempid, tempType: type } = route.query
//   const { stat } = await api.home.saveTemp({ id: tempid, type, state: e ? 1 : 0 })
//   stat != 0 && useNotification('保存成功', '模板内容已变更')
// }
async function download() {
  if (state.loading === true) {
    useNotification('作品导出中', '当前有作品正在导出，请稍候再试')
    return
  }
  state.loading = true
  emit('update:modelValue', true)
  emit('change', { downloadPercent: 1, downloadText: '保存数据中,请稍候..' })
  const currentRecord = pageStore.dCurrentPage
  const backEndCapture: boolean = checkDownloadPoster(dLayouts.value[currentRecord])
  const fileName = `${dayjs().format('YYYYMMDD_HHmmss')}.png`
  if (!backEndCapture) {
    // 无特殊条件命中则直接从前端出图
    const { blob } = await canvasImage.value?.createPoster()
    downloadBlob(blob, fileName)
    emit('change', { downloadPercent: 100, downloadText: '作品下载成功' })
    state.loading = false
  }
  // await save(true) // 注释掉保存功能调用 - 依赖后端服务
  const { id, tempid } = route.query
  if (!id && !tempid) {
    emit('change', { downloadPercent: 0, downloadText: '请稍候..' })
    useNotification('保存失败', '可能暂不支持的功能，先选择模板后操作', { type: 'error' })
    state.loading = false
    return
  }
  if (backEndCapture) {
    // 从服务端生成图片
    const { width, height } = dPage.value
    emit('update:modelValue', true)
    emit('change', { downloadPercent: 1, downloadText: '正在处理数据...' })
    let timerCount = 0
    const animation = setInterval(() => {
      if (props.modelValue && timerCount < 75) {
        timerCount += RandomNumber(1, 10)
        emit('change', { downloadPercent: 1 + timerCount, downloadText: '正在合成图片' })
      } else {
        clearInterval(animation)
      }
    }, 800)
    await _dl.downloadImg(
      api.home.download({ id, tempid, width, height, index: pageStore.dCurrentPage }) + '&r=' + Math.random(),
      (progress: number, xhr: any) => {
        if (props.modelValue) {
          clearInterval(animation)
          progress >= timerCount && emit('change', { downloadPercent: Number(progress.toFixed(0)), downloadText: '图片生成中' })
        } else {
          xhr.abort()
          state.loading = false
        }
      },
      fileName,
    )
    emit('change', { downloadPercent: 100, downloadText: '作品下载成功', downloadMsg: '' })
    state.loading = false
  }
}
function RandomNumber(min: number, max: number) {
  return Math.ceil(Math.random() * (max - min)) + min
}

async function load(cb: () => void) {
  const { id, tempid: tempId, tempType: type, w_h } = route.query
  if (route.name !== 'Draw') {
    await useFontStore.init() // 初始化加载字体
  }
  
  if (w_h && !id && !tempId) {
    // 用于初始化画布大小，创建空作品
    const wh: any = w_h.toString().split('*')
    wh[0] && (dPage.value.width = wh[0])
    wh[1] && (dPage.value.height = wh[1])
  }
  
  if (!id && !tempId) {
    initBoard()
    cb()
    return
  }
  
  try {
    let content, title, templateState: _state, width, height
    
    if (tempId && !id) {
      // 检查登录状态，如果未登录则跳过API调用
      if (!authStore.isLoggedIn) {
        console.log('用户未登录，跳过模板加载')
        initBoard()
        cb()
        return
      }
      
      // 使用新后端API获取模板详情
      const template = await templateStore.fetchTemplateById(tempId as string)
      content = template.data
      title = template.title || template.name
      templateState = template.state
      width = template.width
      height = template.height
    } else {
      // 使用旧API获取作品
      const result = await api.home.getWorks({ id: id || tempId, type })
      content = result.data
      title = result.title
      templateState = result.state
      width = result.width
      height = result.height
    }
    
    if (!content) return
    
    const data = JSON.parse(content)
    state.stateBollean = !!templateState
    state.title = title
    controlStore.setShowMoveable(false) // 清理掉上一次的选择框
    
    if (type == 1) {
      // 加载文字组合组件
      dPage.value.width = width
      dPage.value.height = height
      widgetStore.addGroup(data)
    } else {
      if (Array.isArray(data)) {
        widgetStore.dLayouts = data
        widgetStore.setDWidgets(widgetStore.getWidgets())
      } else {
        widgetStore.dLayouts = [{ global: data.page, layers: data.widgets }]
        id ? widgetStore.setDWidgets(widgetStore.getWidgets()) : widgetStore.setTemplate(widgetStore.getWidgets())
      }
      pageStore.setDPage(pageStore.getDPage())
    }
  } catch (error) {
    console.error('加载模板失败:', error)
    // 如果新后端API失败，回退到旧API
    try {
      const apiName = tempId && !id ? 'getTempDetail' : 'getWorks'
      const { data: content, title, state: _state, width, height } = await api.home[apiName]({ id: id || tempId, type })
      if (!content) return
      
      const data = JSON.parse(content)
      state.stateBollean = !!_state
      state.title = title
      controlStore.setShowMoveable(false)
      
      if (type == 1) {
        dPage.value.width = width
        dPage.value.height = height
        widgetStore.addGroup(data)
      } else {
        if (Array.isArray(data)) {
          widgetStore.dLayouts = data
          widgetStore.setDWidgets(widgetStore.getWidgets())
        } else {
          widgetStore.dLayouts = [{ global: data.page, layers: data.widgets }]
          id ? widgetStore.setDWidgets(widgetStore.getWidgets()) : widgetStore.setTemplate(widgetStore.getWidgets())
        }
        pageStore.setDPage(pageStore.getDPage())
      }
    } catch (fallbackError) {
      console.error('回退API也失败:', fallbackError)
    }
  }
  
  cb()
}

function initBoard() {
  widgetStore.setDWidgets(widgetStore.getWidgets())
  pageStore.setDPage(pageStore.getDPage())
}

function draw() {
  return new Promise<string>((resolve) => {
    if (!canvasImage.value) resolve('')
    else {
      canvasImage.value.createCover(({ key }: { key: string }) => {
        resolve(_config.IMG_URL + key)
      })
    }
  })
}

function jump2Edit() {
  userStore.managerEdit(true)
}

function checkDownloadPoster({ layers }: any) {
  let backEndCapture = false
  for (let i = 0; i < layers.length; i++) {
    const { type, mask } = layers[i]
    if ((type === 'w-image' && mask) || type === 'w-svg' || type === 'w-qrcode') {
      backEndCapture = true
      break
    }
  }
  return backEndCapture
}

// 保存到OSS - 上传成品到阿里云
async function save() {
  if (state.loading === true) {
    useNotification('作品处理中', '当前有作品正在处理，请稍候再试')
    return
  }
  state.loading = true
  emit('update:modelValue', true)
  emit('change', { downloadPercent: 1, downloadText: '正在生成图片,请稍候..' })
  
  try {
    const currentRecord = pageStore.dCurrentPage
    const backEndCapture: boolean = checkDownloadPoster(dLayouts.value[currentRecord])
    
    // 收集画板上所有图片素材的widget（包含sortId的，排除模板素材）
    // 成品只会有两张图片：模板图片和目标图片，过滤后只剩目标图片
    console.log('[命名过程] 开始生成文件名...')
    const currentLayout = dLayouts.value[currentRecord]
    const imageWidgets = currentLayout?.layers?.filter((widget: any) => 
      widget.type === 'w-image' && widget.sortId && widget.name !== '模板图片'
    ) || []
    console.log('[命名过程] 过滤后的图片widgets数量:', imageWidgets.length, imageWidgets)
    
    // 生成文件名：{素材图片url}_template_result_re_{数字}
    let customFileName: string | undefined = undefined
    if (imageWidgets.length === 0) {
      console.log('[命名过程] 未找到符合条件的图片widget，使用默认文件名')
    }
    
    if (imageWidgets.length > 0) {
      // 过滤后只剩一张目标图片，直接使用
      const targetWidget = imageWidgets[0] as any
      const sortId = Number(targetWidget.sortId)
      const sortIndex = targetWidget.sortIndex
      console.log('[命名过程] 目标图片信息:', { sortId, sortIndex, widgetName: targetWidget.name })
      
      if (sortId && sortIndex !== undefined) {
        try {
          // 从任务记录中获取图片URL
          let task = taskRecordCache.get(sortId) || null
          console.log('[命名过程] 从缓存获取任务记录:', sortId, task ? '命中' : '未命中')
          
          // 如果缓存中没有，尝试查询（但这里不阻塞，如果查询失败就使用默认文件名）
          if (!task) {
            console.log(`[命名过程] 任务记录 ${sortId} 不在缓存中，尝试查询以获取图片URL`)
            try {
              task = await api.redrawTask.getRedrawTaskById(sortId)
              if (task) {
                taskRecordCache.set(sortId, task)
                console.log('[命名过程] 查询任务记录成功:', sortId)
              }
            } catch (e) {
              console.warn(`[命名过程] 查询任务记录 ${sortId} 失败，使用默认文件名:`, e)
            }
          }
          
          if (task) {
            // 只使用 customImageUrls
            const imageUrlsStr = task.customImageUrls ?? (task as any).custom_image_urls
            console.log('[命名过程] 使用customImageUrls字段')
            
            if (typeof imageUrlsStr === 'string' && imageUrlsStr.trim().length > 0) {
              console.log('[命名过程] 图片URL字符串长度:', imageUrlsStr.length)
            // 提取URL文件名结尾的数字作为序号（如 xxx_12.jpg => 12）
            const extractIndexFromUrl = (u: string): number | null => {
              try {
                const withoutQuery = u.split('?')[0]
                const lastSlash = withoutQuery.lastIndexOf('/')
                const fileName = lastSlash >= 0 ? withoutQuery.slice(lastSlash + 1) : withoutQuery
                const nameOnly = fileName.replace(/\.[^.]*$/, '')
                const match = nameOnly.match(/(\d+)$/)
                return match ? parseInt(match[1], 10) : null
              } catch (e) {
                return null
              }
            }
            
              // 从图片URL列表中查找对应序号的URL
              const imageList: string[] = imageUrlsStr
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0)
              console.log('[命名过程] 解析后的图片URL列表数量:', imageList.length)
              
            let targetUrl: string | null = null
              for (const url of imageList) {
              const idx = extractIndexFromUrl(url)
              if (idx === sortIndex) {
                targetUrl = url
                console.log('[命名过程] 找到匹配的URL (sortIndex=' + sortIndex + '):', url)
                break
              }
            }
            
              if (targetUrl) {
                // 提取URL最后的数字
                const extractLastNumberFromUrl = (url: string): string | null => {
              try {
                const withoutQuery = url.split('?')[0]
                const lastSlash = withoutQuery.lastIndexOf('/')
                const fileName = lastSlash >= 0 ? withoutQuery.slice(lastSlash + 1) : withoutQuery
                    const nameOnly = fileName.replace(/\.[^.]*$/, '')
                    const match = nameOnly.match(/(\d+)$/)
                    return match ? match[1] : null
              } catch (e) {
                    return null
                  }
                }
                
                // 从URL中提取文件名部分（避免重复段）
                const extractFileNameFromUrl = (url: string): string | null => {
                  try {
                    const withoutQuery = url.split('?')[0]
                    const lastSlash = withoutQuery.lastIndexOf('/')
                    const fileName = lastSlash >= 0 ? withoutQuery.slice(lastSlash + 1) : withoutQuery
                    return fileName || null
                  } catch (e) {
                    return null
                  }
                }
                
                // 提取URL最后的数字
                const lastNumber = extractLastNumberFromUrl(targetUrl)
                console.log('[命名过程] 从URL提取的最后数字:', lastNumber)
                
                if (lastNumber) {
                  // 只提取文件名部分，避免重复的URL路径
                  const fileName = extractFileNameFromUrl(targetUrl)
                  console.log('[命名过程] 提取的文件名:', fileName)
                  
                  if (fileName) {
                    // 移除文件扩展名
                    const nameWithoutExt = fileName.replace(/\.[^.]*$/, '')
                    // 将文件名中的特殊字符替换为下划线，使其文件名安全
                    const safeFileName = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, '_')
                    // 生成文件名：{素材图片文件名}_template_result_re_{数字}（无后缀）
                    customFileName = `${safeFileName}_template_result_re_${lastNumber}`
                    console.log('[命名过程] 最终生成的文件名:', customFileName)
                  } else {
                    console.warn('[命名过程] 无法从URL提取文件名')
                  }
                } else {
                  console.warn('[命名过程] 无法从URL提取最后数字')
                }
              } else {
                console.warn(`[命名过程] 未找到序号 ${sortIndex} 对应的图片URL`)
              }
            } else {
              console.warn('[命名过程] 图片URL字符串为空或无效')
            }
          } else {
            console.warn('[命名过程] 未找到任务记录，无法生成自定义文件名')
          }
        } catch (error) {
          console.error('[命名过程] 生成文件名时出错:', error)
          console.warn('从任务记录获取图片URL失败，使用默认文件名:', error)
        }
      }
    }

    // 新情况：没有目标图片时（已过滤模板图片），尝试使用文字内容生成文件名
    if (!customFileName && imageWidgets.length === 0) {
      console.log('[命名过程] 无目标图片（已过滤模板图片），尝试根据文字内容生成文件名')
      const textWidgets: any[] = currentLayout?.layers?.filter((widget: any) => widget.type === 'w-text' && widget.sortId) || []
      console.log('[命名过程] 过滤后的文字widgets数量:', textWidgets.length, textWidgets)

      // 从文字widget中提取文字内容用于命名
      for (const textWidget of textWidgets) {
        const textContent = textWidget.text
        const sortIndex = textWidget.sortIndex
        console.log('[命名过程] 文字素材信息:', { sortId: textWidget.sortId, sortIndex, widgetName: textWidget.name, textContent })

        if (!textContent || typeof textContent !== 'string' || textContent.trim().length === 0) {
          console.warn('[命名过程] 文字素材内容为空，跳过')
          continue
        }

        if (sortIndex === undefined || sortIndex === null) {
          console.warn('[命名过程] 文字素材缺少sortIndex，跳过')
          continue
        }

        try {
          // 去除HTML标签，只保留纯文本
          const textOnly = textContent.replace(/<[^>]*>/g, '').trim()
          
          if (textOnly.length === 0) {
            console.warn('[命名过程] 去除HTML标签后文字内容为空，跳过')
            continue
          }

          // 将文字内容中的特殊字符替换为下划线，使其文件名安全
          // 保留中文字符、字母、数字、点、下划线、连字符
          const safeText = textOnly.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fa5]/g, '_')
          
          // 限制文件名长度，避免过长（保留前50个字符）
          const truncatedText = safeText.length > 50 ? safeText.substring(0, 50) : safeText
          
          // 生成文件名：_文字_序号.png（无后缀，后续会添加.png）
          customFileName = `_${truncatedText}_${sortIndex}`
          console.log('[命名过程] 文字内容生成的文件名:', customFileName)
          break
        } catch (error) {
          console.error('[命名过程] 文字内容生成文件名时出错:', error)
        }
      }

      if (!customFileName) {
        console.log('[命名过程] 文字素材未能生成自定义文件名，继续使用默认命名')
      }
    }
    
    // 如果没有找到图片素材或获取失败，使用默认文件名
    const defaultFileName = `${state.title || '未命名作品'}.png`
    const fileName = customFileName ? `${customFileName}.png` : defaultFileName
    console.log('[命名过程] 最终使用的文件名:', fileName, customFileName ? '(自定义)' : '(默认)')
    
    let blob: Blob
    
    if (!backEndCapture) {
      // 无特殊条件命中则直接从前端出图
      emit('change', { downloadPercent: 10, downloadText: '正在生成图片...' })
      const result = await canvasImage.value?.createPoster()
      if (!result || !result.blob) {
        throw new Error('图片生成失败')
      }
      blob = result.blob
      // 做图完成，立即更新进度条显示完成状态
      emit('change', { downloadPercent: 75, downloadText: '做图完成' })
    } else {
      // 从服务端生成图片
      const { id, tempid } = route.query
      if (!id && !tempid) {
        throw new Error('请先选择模板或作品')
      }
      
      const { width, height } = dPage.value
      emit('change', { downloadPercent: 1, downloadText: '正在处理数据...' })
      let timerCount = 0
      const animation = setInterval(() => {
        if (props.modelValue && timerCount < 75) {
          timerCount += RandomNumber(1, 10)
          emit('change', { downloadPercent: 1 + timerCount, downloadText: '正在合成图片' })
        } else {
          clearInterval(animation)
        }
      }, 800)
      
      // 从后端获取图片blob
      const imageUrl = api.home.download({ id, tempid, width, height, index: pageStore.dCurrentPage }) + '&r=' + Math.random()
      const response = await fetch(imageUrl)
      if (!response.ok) {
        clearInterval(animation)
        throw new Error('图片生成失败')
      }
      clearInterval(animation)
      blob = await response.blob()
      // 做图完成，立即更新进度条显示完成状态
      emit('change', { downloadPercent: 75, downloadText: '做图完成' })
    }
    
    // 等待进度条更新后再开始上传（使用 setTimeout 确保进度条有时间更新）
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 将Blob转换为File对象
    const file = new File([blob], fileName, { type: 'image/png' })
    
    // 上传到OSS（使用自定义文件名，不包含扩展名）
    emit('change', { downloadPercent: 80, downloadText: '正在上传到OSS...' })
    let uploadProgressReached = false
    const url = await uploadToOSS(file, (progress: number) => {
      // 上传进度：80% + 实际进度 * 15%（留出5%给任务记录更新）
      const totalProgress = 80 + Math.floor(progress * 0.15)
      emit('change', { 
        downloadPercent: totalProgress, 
        downloadText: `正在上传到OSS... ${progress}%` 
      })
      if (progress >= 100) {
        uploadProgressReached = true
      }
    }, customFileName) // 传递自定义文件名（不包含扩展名）
    
    // 上传完成，立即更新进度到95%（无论回调是否到100%）
    // 使用 setTimeout 确保进度条有时间更新
    emit('change', { downloadPercent: 95, downloadText: '上传完成，正在处理...' })
    await new Promise(resolve => setTimeout(resolve, 50))
    
    // 按sortId分组，收集需要更新的任务记录
    const taskUpdateMap = new Map<number, { sortIds: number[], taskId: number }>()
    
    // 收集图片widget的任务记录（排除模板图片）
    imageWidgets.forEach((widget: any) => {
      const sortId = Number(widget.sortId)
      const sortIndex = widget.sortIndex
      if (sortId && sortIndex !== undefined) {
        if (!taskUpdateMap.has(sortId)) {
          taskUpdateMap.set(sortId, { sortIds: [], taskId: sortId })
        }
        const entry = taskUpdateMap.get(sortId)!
        if (!entry.sortIds.includes(sortIndex)) {
          entry.sortIds.push(sortIndex)
        }
      }
    })
    
    // 收集文字widget的任务记录（补充只有模板图片和文字的情况）
    const textWidgets = currentLayout?.layers?.filter((widget: any) => widget.type === 'w-text' && widget.sortId) || []
    textWidgets.forEach((widget: any) => {
      const sortId = Number(widget.sortId)
      const sortIndex = widget.sortIndex
      if (sortId && sortIndex !== undefined) {
        if (!taskUpdateMap.has(sortId)) {
          taskUpdateMap.set(sortId, { sortIds: [], taskId: sortId })
        }
        const entry = taskUpdateMap.get(sortId)!
        if (!entry.sortIds.includes(sortIndex)) {
          entry.sortIds.push(sortIndex)
        }
      }
    })
    
    // 同步相关变量（在if块外定义，以便在最终消息中使用）
    let syncSuccess = false
    let syncCount = 0
    let syncError: any = null
    
    // 更新任务记录相关变量（在if块外定义，以便在最终消息中使用）
    let updateSuccessCount = 0
    let updateFailCount = 0
    
    // 更新任务记录
    if (taskUpdateMap.size > 0) {
      emit('change', { downloadPercent: 95, downloadText: '正在更新任务记录...' })
      
      const updatePromises: Promise<{ success: boolean; taskId: number }>[] = []
      
      for (const [taskId, { sortIds }] of taskUpdateMap.entries()) {
        updatePromises.push(
          (async (): Promise<{ success: boolean; taskId: number }> => {
            try {
              // 优先使用缓存的任务记录数据，避免查询
              let task = taskRecordCache.get(taskId) || null
              
              // 如果缓存中没有，再查询（兼容场景：图片素材列表未加载或已刷新）
              if (!task) {
                console.log(`任务记录 ${taskId} 不在缓存中，从接口查询`)
                task = await api.redrawTask.getRedrawTaskById(taskId)
              } else {
                console.log(`任务记录 ${taskId} 使用缓存数据`)
                
                // 检查缓存数据是否完整（必须有 orderId 和 orderNo）
                const cachedOrderId = (task as any).order_id ?? task.orderId
                const cachedOrderNo = (task as any).order_no ?? task.orderNo
                
                // 如果缓存数据缺少必要字段，从接口重新查询
                if (!cachedOrderId || !cachedOrderNo || 
                    (typeof cachedOrderNo === 'string' && cachedOrderNo.trim().length === 0)) {
                  console.warn(`任务记录 ${taskId} 缓存数据不完整（缺少 orderId 或 orderNo），从接口重新查询`)
                  task = await api.redrawTask.getRedrawTaskById(taskId)
                  
                  // 如果查询成功，更新缓存
                  if (task) {
                    taskRecordCache.set(taskId, task)
                  }
                }
              }
              
              if (!task) {
                console.warn(`任务记录 ${taskId} 不存在，跳过更新`)
                return { success: false, taskId }
              }
              
              // 处理字段名兼容（后端可能返回蛇形命名）
              const rawFinishedIndex = (task as any).finished_index ?? task.finishedIndex ?? ''
              
              // 计算需要更新的 finishedIndex（合并已完成的序号，追加而不是覆盖）
              const existingFinished = (rawFinishedIndex && typeof rawFinishedIndex === 'string' && rawFinishedIndex.trim()) 
                ? rawFinishedIndex.split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n))
                : []
              
              // 合并已存在的序号和新的序号，去重并排序
              const newFinishedSet = new Set([...existingFinished, ...sortIds])
              const finishedIndex = Array.from(newFinishedSet).sort((a, b) => a - b).join(',')
              
              // 调试日志：输出合并前后的值
              console.log(`任务 ${taskId} finishedIndex 合并:`, {
                原有: rawFinishedIndex || '(空)',
                新增: sortIds.join(','),
                合并后: finishedIndex
              })
              
              // 从 needRedrawIndex 中移除已保存的序号
              const rawNeedRedraw = (task as any).need_redraw_index ?? task.needRedrawIndex ?? ''
              const needRedrawIndices = (typeof rawNeedRedraw === 'string' ? rawNeedRedraw : '')
                .split(',')
                .map((s: string) => parseInt(s.trim(), 10))
                .filter((n: number) => !isNaN(n) && !sortIds.includes(n))
              const needRedrawIndex = needRedrawIndices.length > 0
                ? needRedrawIndices.sort((a: number, b: number) => a - b).join(',')
                : ''
              
              // 调试日志：输出 needRedrawIndex 更新前后的值
              console.log(`任务 ${taskId} needRedrawIndex 更新:`, {
                原有: rawNeedRedraw || '(空)',
                移除的序号: sortIds.join(','),
                更新后: needRedrawIndex || '(空)'
              })
              
              // 更新 newSetImageUrls（追加新URL）
              // 处理字段名兼容（后端可能返回蛇形命名）
              const rawNewSetImageUrls = (task as any).new_set_image_urls ?? task.newSetImageUrls ?? ''
              const existingUrls = (rawNewSetImageUrls && typeof rawNewSetImageUrls === 'string' && rawNewSetImageUrls.trim())
                ? rawNewSetImageUrls.split(',').map(s => s.trim()).filter(s => s.length > 0)
                : []
              
              const newUrls = existingUrls.includes(url) ? existingUrls : [...existingUrls, url]
              const newSetImageUrls = newUrls.join(',')
              
              // 调用更新接口
              // 处理字段名兼容（后端可能返回蛇形命名）
              const orderId = (task as any).order_id ?? task.orderId
              const orderNo = (task as any).order_no ?? task.orderNo
              
              // 严格检查：orderId 必须是有效数字，orderNo 必须是非空字符串
              if (!orderId || (typeof orderId !== 'number' && isNaN(Number(orderId)))) {
                console.error(`任务 ${taskId} 缺少有效的 orderId:`, orderId, '任务数据:', task)
                return { success: false, taskId }
              }
              
              if (!orderNo || typeof orderNo !== 'string' || orderNo.trim().length === 0) {
                console.error(`任务 ${taskId} 缺少有效的 orderNo:`, orderNo, '任务数据:', task)
                return { success: false, taskId }
              }
              
              // 使用驼峰命名发送请求（与类型定义一致）
              const updateData = {
                id: task.id,
                orderId: orderId,
                orderNo: orderNo,
                newSetImageUrls: newSetImageUrls,
                finishedIndex: finishedIndex,
                needRedrawIndex: needRedrawIndex,
              }
              
              console.log(`任务 ${taskId} 准备更新，数据:`, updateData)
              const updateResult = await api.redrawTask.updateRedrawTask(updateData)
              console.log(`任务 ${taskId} 更新接口返回:`, updateResult)
              
              // 验证接口返回结果
              if (!updateResult || updateResult.code !== 0) {
                const errorMsg = updateResult?.msg || '更新失败，接口返回异常'
                throw new Error(`更新任务记录失败: ${errorMsg} (code: ${updateResult?.code || 'unknown'})`)
              }
              
              // 验证返回的data是否为true（表示更新成功）
              if (updateResult.data !== true && updateResult.data !== undefined) {
                console.warn(`任务 ${taskId} 更新接口返回的data不是预期的true:`, updateResult.data)
              }
              
              console.log(`任务记录 ${taskId} 更新成功: finishedIndex=${finishedIndex}, needRedrawIndex=${needRedrawIndex || '(空)'}, newSetImageUrls已追加`)
              return { success: true, taskId }
            } catch (error: any) {
              console.error(`更新任务记录 ${taskId} 失败:`, error)
              console.error(`错误详情:`, {
                message: error?.message,
                response: error?.response?.data,
                status: error?.response?.status,
                code: error?.response?.data?.code,
                msg: error?.response?.data?.msg,
              })
              // 不抛出错误，允许其他任务继续更新，但记录失败信息
              console.warn(`任务 ${taskId} 更新失败，但继续处理其他任务`)
              return { success: false, taskId }
            }
          })()
        )
      }
      
      // 等待所有更新完成，并统计成功/失败数量
      const updateResults = await Promise.all(updatePromises)
      updateSuccessCount = updateResults.filter(r => r.success).length
      updateFailCount = updateResults.filter(r => !r.success).length
      console.log(`所有任务记录更新完成: 成功 ${updateSuccessCount} 个，失败 ${updateFailCount} 个`)
      
      // 如果有失败的任务，输出详细信息
      if (updateFailCount > 0) {
        const failedTaskIds = updateResults.filter(r => !r.success).map(r => r.taskId)
        console.warn(`更新失败的任务ID:`, failedTaskIds)
      }
      
      // 收集所有已更新的任务记录ID
      const taskIds = Array.from(taskUpdateMap.keys())
      console.log('收集到的任务ID列表:', taskIds, '数量:', taskIds.length)
      
      // 调用同步接口，将新套图URL同步到订单
      if (taskIds.length > 0) {
        console.log('准备调用同步接口，任务ID列表:', taskIds)
        emit('change', { downloadPercent: 98, downloadText: '正在同步新套图到订单...' })
        console.log(`开始同步新套图到订单，任务ID列表:`, taskIds)
        try {
          console.log('调用 api.redrawTask.syncNewImagesToOrder，参数:', taskIds)
          const syncResult = await api.redrawTask.syncNewImagesToOrder(taskIds)
          console.log('同步接口返回结果:', syncResult)
          syncCount = syncResult.data || 0
          syncSuccess = true
          console.log(`同步完成，成功处理 ${syncCount} 条任务记录`)
        } catch (error: any) {
          syncError = error
          console.error('同步新套图到订单失败:', error)
          const errorMsg = error?.response?.data?.msg || error?.message || '未知错误'
          console.error('同步失败详情:', {
            taskIds,
            error: errorMsg,
            response: error?.response?.data
          })
          // 不抛出错误，允许保存流程继续完成，但会在最终消息中告知用户
        }
      } else {
        console.warn('任务ID列表为空，跳过同步接口调用')
      }
    }
    
    // 上传成功，确保更新进度到100%（无论前面的步骤如何）
    console.log('准备更新进度到100%')
    // 立即更新进度到100%，不使用setTimeout避免延迟
      emit('change', { downloadPercent: 100, downloadText: '上传成功', downloadMsg: url })
    const updateCount = taskUpdateMap.size
    
    // 构建最终消息（仅用于日志，取消弹窗）
    let summaryMessage = ''
    
    if (updateCount > 0) {
      summaryMessage = `图片已上传到OSS`
      
      // 添加更新任务记录的统计信息
      if (updateSuccessCount > 0) {
        summaryMessage += `，成功更新 ${updateSuccessCount} 条任务记录`
      }
      if (updateFailCount > 0) {
        summaryMessage += `，${updateFailCount} 条任务记录更新失败`
      }
      
      // 检查是否有同步操作
      if (syncSuccess) {
        summaryMessage += `，已同步 ${syncCount} 条任务到订单`
      } else if (syncError) {
        const errorMsg = syncError?.response?.data?.msg || syncError?.message || '未知错误'
        summaryMessage += `，但同步到订单失败: ${errorMsg}`
      }
    } else {
      summaryMessage = `图片已上传到OSS`
    }
    
    console.log('上传结果:', summaryMessage)
    
    // 保存成功后自动触发清除素材功能
    // 使用 setTimeout 确保通知显示后再执行清除操作
    setTimeout(() => {
      eventBus.emit('clearMaterials')
    }, 500)
    
    // 保存成功后触发图片素材刷新
    eventBus.emit('refreshPhotoList')
    // 保存成功后触发文字素材刷新
    eventBus.emit('refreshTextList')
    
    state.loading = false
  } catch (error: any) {
    console.error('保存到OSS失败:', error)
    emit('change', { downloadPercent: 0, downloadText: '上传失败', downloadMsg: error.message || '未知错误' })
    useNotification('上传失败', error.message || '请稍后重试', { type: 'error' })
    state.loading = false
  }
}

defineExpose({
  download,
  save,
  // saveTemp, // 已注释，依赖后端服务
  // stateChange, // 已注释，依赖后端服务
  load,
})
</script>

<style lang="less" scoped>
.top-icon-wrap {
  display: flex;
  align-items: center;
  flex: 1;
  padding-right: 20px;
  height: 54px;
  .top-icon {
    background-color: rgba(0, 0, 0, 0.4);
    border-radius: 5px;
    color: #ffffff;
    cursor: pointer;
    font-weight: bold;
    margin: 8px;
    padding: 5px 8px;
    &:hover {
      background-color: rgba(0, 0, 0, 0.5);
    }
  }
  
  .clear-cache-btn {
    margin-left: 10px;
    margin-right: 10px;
    border-radius: 8px;
    display: inline-flex !important;
    align-items: center;
    gap: 0;
    padding: 0 18px;
    height: 36px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: #ffffff;
    font-weight: 500;
    font-size: 13px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    visibility: visible !important;
    opacity: 1 !important;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }
    
    svg {
      width: 14px;
      height: 14px;
      opacity: 0.95;
      transition: transform 0.3s ease;
    }
    
    span {
      margin-left: 0;
      position: relative;
      z-index: 1;
    }
    
    &:hover {
      background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      
      &::before {
        left: 100%;
      }
      
      svg {
        transform: rotate(180deg);
        opacity: 1;
      }
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
    }
  }
  
  .logout-btn {
    margin-left: auto;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    height: 36px;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: #1d1d1f;
    font-weight: 500;
    font-size: 13px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    img {
      width: 14px;
      height: 14px;
      object-fit: contain;
      opacity: 0.8;
    }
    
    span {
      margin-left: 0;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      
      img {
        opacity: 1;
      }
    }
    
    &:active {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
  }
}
.primary-btn {
  font-weight: 600;
  transform: scale(0.95);
  margin-left: 10px;
}
.divide__line {
  margin: 0 1rem;
  color: #e8eaec;
  height: 20px;
}
</style>
