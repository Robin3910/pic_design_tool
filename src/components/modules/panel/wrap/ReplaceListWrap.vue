<!--
 * @Author: AI Assistant
 * @Date: 2025-01-XX
 * @Description: 替换素材列表 - 显示newSetImageUrls字段中的替换图片
-->
<template>
  <div class="wrap">
    <div class="header-wrapper">
      <el-divider style="margin-top: 1.7rem" content-position="center">
        <span style="font-weight: bold">替换</span>
      </el-divider>
    </div>
    <div style="height: 0.5rem" />
    <div class="local-images-container">
      <div v-if="state.localImages.length === 0" class="empty-state">
        <p>暂无替换素材</p>
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
// 从接口加载替换素材图片
import { reactive, onMounted } from 'vue'
import wImageSetting from '../../widgets/wImage/wImageSetting'
import setItem2Data from '@/common/methods/DesignFeatures/setImage'
import { storeToRefs } from 'pinia'
import { useControlStore, useCanvasStore, useWidgetStore } from '@/store'
import api from '@/api'
import { ElMessage } from 'element-plus'

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

    list.forEach((item: any) => {
      // 从 newSetImageUrls 字段获取替换素材
      let str = item.newSetImageUrls ?? item.new_set_image_urls
      if (typeof str !== 'string' || str.trim().length === 0) return

      // 解析替换素材URL列表（逗号分隔）
      const imageList: string[] = str
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)

      imageList.forEach((u, idx) => {
        const name = `${item.id ?? ''}_replace_${idx + 1}`
        // 去重：如果该 URL 已添加则跳过
        if (!results.find((r) => r.url === u)) {
          results.push({ name, url: u, thumb: u })
        }
      })
    })
    // 反转数组以倒序显示（使用展开运算符避免修改原数组）
    state.localImages = [...results].reverse()
  } catch (e) {
    state.localImages = []
    ElMessage.error('加载替换素材失败')
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
