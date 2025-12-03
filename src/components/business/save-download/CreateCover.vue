<!--
 * @Author: ShawnPhang
 * @Date: 2021-08-01 11:12:17
 * @Description: 前端出图 - 用于封面
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @Date: 2024-03-04 18:50:00
-->
<template>
  <div id="cover-wrap"></div>
</template>

<script lang="ts" setup>
import html2canvas from 'html2canvas'
import Qiniu from '@/common/methods/QiNiu'
// import { useSetupMapGetters } from '@/common/hooks/mapGetters'
import { storeToRefs } from 'pinia'
import { useCanvasStore, useWidgetStore } from '@/store'
import FontFaceObserver from 'fontfaceobserver'

// const { dZoom } = useSetupMapGetters(['dZoom'])

const canvasStore = useCanvasStore()
const widgetStore = useWidgetStore()
const { dZoom, dPage } = storeToRefs(canvasStore)

// props: ['modelValue'],
// emits: ['update:modelValue'],

async function createCover(cb: any) {
  const nowZoom = dZoom.value
  // 取消选中元素
  widgetStore.selectWidget({
    uuid: '-1',
  })
  // store.dispatch('selectWidget', {
  //   uuid: '-1',
  // })

  canvasStore.updateZoom(100)
  // store.dispatch('updateZoom', 100)

  const opts = {
    useCORS: true, // 跨域图片
    scale: 0.2,
  }
  setTimeout(async () => {
    const clonePage = document.getElementById('page-design-canvas')?.cloneNode(true) as HTMLElement
    if (!clonePage) return
    clonePage.setAttribute('id', 'clone-page')
    document.body.appendChild(clonePage)
    html2canvas(clonePage, opts).then((canvas) => {
      canvas.toBlob(
        async (blobObj) => {
          if (blobObj) {
            const result = await Qiniu.upload(blobObj, { bucket: 'xp-design', prePath: 'cover/user' })
            cb(result)
          }
        },
        'image/jpeg',
        0.15,
      )
      canvasStore.updateZoom(nowZoom)
      // store.dispatch('updateZoom', nowZoom)
      clonePage.remove()
    })
  }, 10)
}

async function createPoster() {
  await checkFonts() // 等待字体加载完成
  const fonts = document.fonts
  
  // 获取原始页面元素
  const originalPage = document.getElementById('page-design-canvas')
  if (!originalPage) {
    return Promise.resolve({ blob: null })
  }
  
// 收集所有图片的位置和brightness值，同时记录“模板图片”的区域用于裁剪
  const widgets = widgetStore.getWidgets()
  const brightnessData = new Map<string, { brightness: number; left: number; top: number; width: number; height: number }>()
  const scale = 100 / dZoom.value
// 用于记录模板图片的整体包围盒（可能有多张模板图片）
const templateBounds = {
  left: Number.POSITIVE_INFINITY,
  top: Number.POSITIVE_INFINITY,
  right: Number.NEGATIVE_INFINITY,
  bottom: Number.NEGATIVE_INFINITY,
}
let hasTemplateBounds = false
  
  widgets.forEach((widget: any) => {
    if (widget.type === 'w-image' && widget.uuid) {
      // 获取widget在画布上的实际位置
      const widgetEl = originalPage.querySelector(
        `[data-uuid="${widget.uuid}"]`,
      ) as HTMLElement
      if (widgetEl) {
        const rect = widgetEl.getBoundingClientRect()
        const canvasRect = originalPage.getBoundingClientRect()
        const left = (rect.left - canvasRect.left) * scale
        const top = (rect.top - canvasRect.top) * scale
        const width = rect.width * scale
        const height = rect.height * scale

        // 记录需要做亮度调整的图片区域
        if (
          widget.brightness !== undefined &&
          widget.brightness !== null &&
          widget.brightness !== 1
        ) {
          brightnessData.set(widget.uuid, {
            brightness: widget.brightness,
            left,
            top,
            width,
            height,
          })
        }

        // 如果是模板图片（由模板导入时命名为“模板图片”），记录其包围盒
        if (widget.name === '模板图片') {
          hasTemplateBounds = true
          templateBounds.left = Math.min(templateBounds.left, left)
          templateBounds.top = Math.min(templateBounds.top, top)
          templateBounds.right = Math.max(templateBounds.right, left + width)
          templateBounds.bottom = Math.max(templateBounds.bottom, top + height)
        }
      }
    }
  })
  
  // 计算画布的实际尺寸（考虑缩放）
  const canvasWidth = Math.round(dPage.value.width * scale)
  const canvasHeight = Math.round(dPage.value.height * scale)

  // 获取原始画布元素的位置信息，用于精确对齐
  const originalRect = originalPage.getBoundingClientRect()

  const opts = {
    backgroundColor: null, // 关闭背景以支持透明图片生成
    useCORS: true,
    scale: scale,
    width: dPage.value.width, // 使用画布原始宽度（不乘以scale，html2canvas会自动处理）
    height: dPage.value.height, // 使用画布原始高度（不乘以scale，html2canvas会自动处理）
    x: 0, // 从元素左上角(0,0)开始截图
    y: 0, // 从元素左上角(0,0)开始截图
    scrollX: 0, // 不滚动
    scrollY: 0, // 不滚动
    onclone: (clonedDoc: Document) => {
      // 添加字体
      fonts.forEach((font) => clonedDoc.fonts.add(font))
      // 在克隆的文档中，重置画布的 transform 和所有可能影响位置的样式
      const clonedCanvas = clonedDoc.getElementById('clone-page') || clonedDoc.getElementById('page-design-canvas')
      if (clonedCanvas) {
        const clonedEl = clonedCanvas as HTMLElement
        // 重置所有可能影响位置的样式
        clonedEl.style.transform = 'none'
        clonedEl.style.transformOrigin = 'top left'
        clonedEl.style.width = dPage.value.width + 'px'
        clonedEl.style.height = dPage.value.height + 'px'
        clonedEl.style.position = 'relative'
        clonedEl.style.left = '0px'
        clonedEl.style.top = '0px'
        clonedEl.style.margin = '0'
        clonedEl.style.padding = '0'
        // 确保所有子元素的位置也是相对于画布左上角
        const allChildren = clonedEl.querySelectorAll('*')
        allChildren.forEach((child) => {
          const childEl = child as HTMLElement
          // 不改变子元素的定位，但确保它们相对于画布定位
        })
      }
    },
  }

  return new Promise((resolve) => {
    const clonePage = originalPage.cloneNode(true) as HTMLElement
    if (!clonePage) return
    clonePage.setAttribute('id', 'clone-page')
    // 在克隆的元素上重置所有可能影响位置的样式，确保截图区域准确
    clonePage.style.transform = 'none'
    clonePage.style.transformOrigin = 'top left'
    clonePage.style.width = dPage.value.width + 'px'
    clonePage.style.height = dPage.value.height + 'px'
    clonePage.style.position = 'absolute'
    // 确保元素在屏幕外但可见（html2canvas 需要元素可见才能截图）
    // 使用负值定位到屏幕外，但不使用 visibility: hidden（会导致空白图片）
    clonePage.style.left = '-99999px'
    clonePage.style.top = '-99999px'
    clonePage.style.margin = '0'
    clonePage.style.padding = '0'
    clonePage.style.boxSizing = 'border-box'
    clonePage.style.pointerEvents = 'none' // 禁用交互，避免意外触发
    clonePage.style.zIndex = '-9999' // 确保在底层，避免遮挡
    document.body.appendChild(clonePage)
    html2canvas(clonePage, opts).then((canvas) => {
      // 如果图片有brightness设置，使用Canvas API手动应用
      if (brightnessData.size > 0) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          brightnessData.forEach((data) => {
            const { brightness, left, top, width, height } = data
            // 获取该区域的图像数据
            const imgData = ctx.getImageData(left, top, width, height)
            const pixels = imgData.data

            // 应用brightness效果
            for (let i = 0; i < pixels.length; i += 4) {
              pixels[i] = Math.min(255, pixels[i] * brightness) // R
              pixels[i + 1] = Math.min(255, pixels[i + 1] * brightness) // G
              pixels[i + 2] = Math.min(255, pixels[i + 2] * brightness) // B
              // pixels[i + 3] 保持 alpha 不变
            }

            // 将处理后的数据写回canvas
            ctx.putImageData(imgData, left, top)
          })
        }
      }

      // 最终导出尺寸必须严格等于模板的原始尺寸（dPage.width 和 dPage.height）
      // 确保同一模板每次导出的尺寸完全一致，和模板尺寸一模一样
      // 使用 Math.floor 确保尺寸向下取整，保证同一模板每次导出尺寸完全一致
      const targetWidth = Math.floor(dPage.value.width)
      const targetHeight = Math.floor(dPage.value.height)
      
      // 无论 html2canvas 生成的 canvas 尺寸如何，都强制创建精确等于模板尺寸的新 canvas
      // html2canvas 可能因为 scale 参数生成更高分辨率的 canvas，需要缩放到模板尺寸
      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = targetWidth
      exportCanvas.height = targetHeight
      const ctx2 = exportCanvas.getContext('2d')
      
      if (!ctx2) {
        // 如果无法获取 context，fallback 到原 canvas
        exportCanvas.toBlob(async (blob) => resolve({ blob }), `image/png`)
        clonePage.remove()
        return
      }
      
      // 填充透明背景
      ctx2.clearRect(0, 0, targetWidth, targetHeight)
      
      // 将 html2canvas 生成的 canvas（可能因为 scale 参数尺寸更大）缩放到模板尺寸
      // 从原 canvas 的 (0,0) 开始，完整绘制到目标尺寸（模板尺寸）
      // 使用 drawImage 的缩放功能，确保最终尺寸严格等于模板尺寸
      ctx2.drawImage(
        canvas,
        0, 0, // 从原canvas的(0,0)开始
        canvas.width, canvas.height, // 源尺寸（html2canvas 生成的完整尺寸）
        0, 0, // 绘制到新canvas的(0,0)
        targetWidth, targetHeight // 目标尺寸（严格等于模板尺寸）
      )

      exportCanvas.toBlob(async (blob) => resolve({ blob }), `image/png`)
      clonePage.remove()
    })
  })
}

// 检查字体是否加载完成
async function checkFonts() {
  const widgets = widgetStore.getWidgets()
  const fontLoaders: Promise<void>[] = []
  widgets.forEach((item: any) => {
    if (item.fontClass && item.fontClass.value) {
      const loader = new FontFaceObserver(item.fontClass.value)
      fontLoaders.push(loader.load(null, 120000)) // 延长超时让检测不会丢失字体
    }
  })
  await Promise.all(fontLoaders)
}

defineExpose({
  createCover,
  createPoster,
})
</script>

<style lang="less">
#clone-page {
  position: absolute;
  z-index: 99999;
  left: -99999px;
}
</style>
