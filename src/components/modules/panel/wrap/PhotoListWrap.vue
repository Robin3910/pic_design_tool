<!--
 * @Author: ShawnPhang
 * @Date: 2022-02-11 18:48:23
 * @Description: 本地图片库 - 显示public/images目录中的图片
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-14 18:50:09
-->
<template>
  <div class="wrap">
  <div class="local-images-header">
      <h3>图片</h3>
      <p>从接口加载高清图片（hdImages）</p>
    </div>
    <div style="height: 0.5rem" />
    <div class="local-images-container">
      <div v-if="state.localImages.length === 0" class="empty-state">
        <p>暂无图片</p>
        <p>尝试刷新或检查接口数据</p>
      </div>
      <div v-else class="images-grid">
        <div 
          v-for="(image, index) in state.localImages" 
          :key="index"
          class="image-item"
          @click="selectLocalImage(image)"
          @mousedown="dragStart($event, image)"
        >
          <el-image 
            :src="image.url" 
            fit="cover" 
            lazy 
            loading="lazy"
            class="image-thumb"
          >
            <template #placeholder>
              <div class="image-placeholder">
                <i class="el-icon-picture"></i>
              </div>
            </template>
            <template #error>
              <div class="image-error">
                <i class="el-icon-warning"></i>
              </div>
            </template>
          </el-image>
          <div class="image-name">{{ image.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 从接口加载图片
import { reactive, onMounted } from 'vue'
import wImageSetting from '../../widgets/wImage/wImageSetting'
import setItem2Data from '@/common/methods/DesignFeatures/setImage'
import { storeToRefs } from 'pinia'
import { useControlStore, useCanvasStore, useWidgetStore } from '@/store'
import api from '@/api'

type TProps = {
  active?: boolean
}

type TLocalImage = {
  name: string
  url: string
  thumb?: string
}

type TState = {
  localImages: TLocalImage[]
}

const props = defineProps<TProps>()

const controlStore = useControlStore()
const widgetStore = useWidgetStore()
const { dPage } = storeToRefs(useCanvasStore())

const state = reactive<TState>({
  localImages: [],
})

onMounted(() => {
  loadImagesFromApi()
})

const loadImagesFromApi = async () => {
  try {
    const res = await api.redrawTask.getRedrawTaskPage({ pageNo: 1, pageSize: 20 })
    const list = res.data?.list || []
    const results: TLocalImage[] = []
    // 提取 URL 文件名结尾的数字作为序号（如 xxx_12.jpg => 12）
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

    list.forEach((item: any) => {
      const str = item.hdImages
      if (typeof str !== 'string' || str.trim().length === 0) return

      // 解析需重制序号（支持 number、字符串“1,2,3”、数组）
      const raw = (item as any).need_redraw_index ?? (item as any).needRedrawIndex
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

      if (indices.length === 0) return
      const indexSet = new Set(indices)

      const hdList: string[] = str
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)

      hdList.forEach((u) => {
        const idx = extractIndexFromUrl(u)
        if (idx != null && indexSet.has(idx)) {
          const name = `${item.id ?? ''}_${idx}`
          // 去重：如果该 URL 已添加则跳过
          if (!results.find((r) => r.url === u)) {
            results.push({ name, url: u, thumb: u })
          }
        }
      })
    })
    state.localImages = results
  } catch (e) {
    state.localImages = []
  }
}

const selectLocalImage = async (image: TLocalImage) => {
  controlStore.setShowMoveable(false) // 清理掉上一次的选择

  let setting = JSON.parse(JSON.stringify(wImageSetting))
  
  // 创建图片对象用于setImageData - 使用0触发获取原始尺寸
  const imageData = {
    url: image.url,
    thumb: image.thumb || image.url,
    name: image.name,
    width: 0,
    height: 0
  }
  
  const img = await setItem2Data(imageData)
  setting.width = img.width
  setting.height = img.height
  setting.imgUrl = image.url
  const { width: pW, height: pH } = dPage.value
  setting.left = pW / 2 - img.width / 2
  setting.top = pH / 2 - img.height / 2

  widgetStore.addWidget(setting)
}

const dragStart = (event: MouseEvent, image: TLocalImage) => {
  const imageData = {
    url: image.url,
    thumb: image.thumb || image.url,
    name: image.name
  }
  
  widgetStore.setSelectItem({ data: { value: imageData }, type: 'image' })
}

defineExpose({
  selectLocalImage,
  dragStart,
})
</script>

<style lang="less" scoped>
.wrap {
  width: 100%;
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
}

.local-images-header {
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

.local-images-container {
  width: 100%;
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

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  padding: 0.5rem 0;
}

.image-item {
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

.image-thumb {
  width: 100%;
  height: 120px;
  display: block;
}

.image-placeholder,
.image-error {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
  font-size: 2rem;
}

.image-error {
  background: #ffe6e6;
  color: #ff6b6b;
}

.image-name {
  padding: 0.5rem;
  font-size: 0.8rem;
  color: #666;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: #fafafa;
}
</style>
