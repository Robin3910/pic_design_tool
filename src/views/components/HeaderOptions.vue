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
    <!-- 登出按钮 -->
    <el-button 
      v-if="authStore.isLoggedIn"
      class="logout-btn"
      @click="handleLogout"
    >
      登出
    </el-button>
  </div>
  <!-- 生成图片组件 -->
  <SaveImage ref="canvasImage" />
</template>

<script lang="ts" setup>
import api from '@/api'
import { reactive, toRefs, ref, computed } from 'vue'
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
  const fileName = `${state.title || '未命名作品'}.png`
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
    
    // 收集画板上所有图片素材的widget（包含sortId的）
    const currentLayout = dLayouts.value[currentRecord]
    const imageWidgets = currentLayout?.layers?.filter((widget: any) => 
      widget.type === 'w-image' && widget.sortId
    ) || []
    
    // 生成文件名：原图片素材的名称 + "_template_result_" + need_redraw_index
    let customFileName: string | undefined = undefined
    if (imageWidgets.length > 0) {
      // 使用第一个图片素材的信息来生成文件名
      const firstWidget = imageWidgets[0] as any
      const sortId = Number(firstWidget.sortId)
      const sortIndex = firstWidget.sortIndex
      
      if (sortId && sortIndex !== undefined) {
        try {
          // 查询任务记录详情，获取原图片素材的URL
          const task = await api.redrawTask.getRedrawTaskById(sortId)
          if (task && task.setImageUrls) {
            // 从setImageUrls中找到对应sortIndex的图片URL
            const imageUrls = task.setImageUrls.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            
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
            
            // 找到对应sortIndex的图片URL
            let targetUrl: string | null = null
            for (const url of imageUrls) {
              const idx = extractIndexFromUrl(url)
              if (idx === sortIndex) {
                targetUrl = url
                break
              }
            }
            
            if (targetUrl) {
              // 从URL中提取文件名（去掉扩展名）
              const withoutQuery = targetUrl.split('?')[0]
              const lastSlash = withoutQuery.lastIndexOf('/')
              const fileName = lastSlash >= 0 ? withoutQuery.slice(lastSlash + 1) : withoutQuery
              const lastDotIndex = fileName.lastIndexOf('.')
              const originalName = lastDotIndex > 0 
                ? fileName.substring(0, lastDotIndex) 
                : fileName
              
              // 生成文件名：原图片素材的名称 + "_template_result_" + need_redraw_index
              customFileName = `${originalName}_template_result_${sortIndex}`
            }
          }
        } catch (error) {
          console.warn('获取原图片素材名称失败，使用默认文件名:', error)
        }
      }
    }
    
    // 如果没有找到图片素材或获取失败，使用默认文件名
    const defaultFileName = `${state.title || '未命名作品'}.png`
    const fileName = customFileName ? `${customFileName}.png` : defaultFileName
    
    let blob: Blob
    
    if (!backEndCapture) {
      // 无特殊条件命中则直接从前端出图
      emit('change', { downloadPercent: 10, downloadText: '正在生成图片...' })
      const result = await canvasImage.value?.createPoster()
      if (!result || !result.blob) {
        throw new Error('图片生成失败')
      }
      blob = result.blob
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
    }
    
    // 将Blob转换为File对象
    const file = new File([blob], fileName, { type: 'image/png' })
    
    // 上传到OSS（使用自定义文件名，不包含扩展名）
    emit('change', { downloadPercent: 80, downloadText: '正在上传到OSS...' })
    const url = await uploadToOSS(file, (progress: number) => {
      // 上传进度：80% + 实际进度 * 20%
      const totalProgress = 80 + Math.floor(progress * 0.2)
      emit('change', { 
        downloadPercent: totalProgress, 
        downloadText: `正在上传到OSS... ${progress}%` 
      })
    }, customFileName) // 传递自定义文件名（不包含扩展名）
    
    // 按sortId分组，收集需要更新的任务记录
    const taskUpdateMap = new Map<number, { sortIds: number[], taskId: number }>()
    
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
    
    // 更新任务记录
    if (taskUpdateMap.size > 0) {
      emit('change', { downloadPercent: 95, downloadText: '正在更新任务记录...' })
      
      const updatePromises: Promise<void>[] = []
      
      for (const [taskId, { sortIds }] of taskUpdateMap.entries()) {
        updatePromises.push(
          (async () => {
            try {
              // 查询任务记录详情
              const task = await api.redrawTask.getRedrawTaskById(taskId)
              if (!task) {
                console.warn(`任务记录 ${taskId} 不存在，跳过更新`)
                return
              }
              
              // 计算需要更新的 finishedIndex（合并已完成的序号）
              const existingFinished = task.finishedIndex 
                ? task.finishedIndex.split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n))
                : []
              
              const newFinishedSet = new Set([...existingFinished, ...sortIds])
              const finishedIndex = Array.from(newFinishedSet).sort((a, b) => a - b).join(',')
              
              // 更新 newSetImageUrls（追加新URL）
              const existingUrls = task.newSetImageUrls 
                ? task.newSetImageUrls.split(',').map(s => s.trim()).filter(s => s.length > 0)
                : []
              
              const newUrls = existingUrls.includes(url) ? existingUrls : [...existingUrls, url]
              const newSetImageUrls = newUrls.join(',')
              
              // 调用更新接口
              await api.redrawTask.updateRedrawTask({
                id: task.id,
                orderId: task.orderId,
                orderNo: task.orderNo,
                newSetImageUrls,
                finishedIndex,
              })
              
              console.log(`任务记录 ${taskId} 更新成功: finishedIndex=${finishedIndex}, newSetImageUrls已追加`)
            } catch (error) {
              console.error(`更新任务记录 ${taskId} 失败:`, error)
              // 不抛出错误，允许其他任务继续更新
            }
          })()
        )
      }
      
      // 等待所有更新完成
      await Promise.all(updatePromises)
    }
    
    // 上传成功
    emit('change', { downloadPercent: 100, downloadText: '上传成功', downloadMsg: url })
    const updateCount = taskUpdateMap.size
    const message = updateCount > 0 
      ? `图片已上传到OSS，已更新 ${updateCount} 条任务记录`
      : `图片已上传到OSS，URL已复制到剪贴板`
    useNotification('上传成功', message, { type: 'success' })
    
    // 复制URL到剪贴板
    try {
      await navigator.clipboard.writeText(url)
    } catch (err) {
      console.warn('复制到剪贴板失败:', err)
    }
    
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
  
  .logout-btn {
    margin-left: auto;
    border-radius: 4px;
    
    &:hover {
      opacity: 0.8;
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
