<template>
  <div id="text-list-wrap" style="margin-top: 0.5rem">
    <ul class="basic-text-wrap">
      <div
        v-for="(item, index) in state.basicTextList"
        :key="index"
        class="basic-text-item"
        :style="{
          fontSize: 14 + 'px',
          fontWeight: item.fontWeight,
        }"
        draggable="true"
        @click="selectBasicText(item)"
      >
        {{ item.text }}
      </div>
    </ul>
    <div class="other-text-wrap">
      <comp-list-wrap />
    </div>
  </div>
</template>

<script lang="ts" setup>
// const NAME = 'text-list-wrap'

import { reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia';
// import wText from '../../widgets/wText/wText.vue'
import { wTextSetting } from '../../widgets/wText/wTextSetting'
import { useControlStore, useCanvasStore, useWidgetStore } from '@/store';
import api from '@/api'

type TBasicTextData = {
  text: string
  fontSize: number
  fontWeight: string
}

type TState = {
  basicTextList: TBasicTextData[]
}

const controlStore = useControlStore()
const widgetStore = useWidgetStore()

const { dPage } = storeToRefs(useCanvasStore())

const state = reactive<TState>({
  basicTextList: [
    {
      text: '+ 添加文字',
      fontSize: 60,
      fontWeight: 'normal',
    },
  ],
})

onMounted(() => {
  loadTextsFromApi()
})

const loadTextsFromApi = async () => {
  try {
    const res = await api.redrawTask.getRedrawTaskPage({ pageNo: 1, pageSize: 20 })
    const list = res.data?.list || []
    const results: TBasicTextData[] = []

    list.forEach((item: any) => {
      const customTextList = item.custom_text_list
      if (!customTextList) return

      let textList: string[] = []

      // 解析 custom_text_list（支持数组、JSON字符串、逗号分隔字符串）
      if (Array.isArray(customTextList)) {
        textList = customTextList.filter((t) => typeof t === 'string' && t.trim().length > 0)
      } else if (typeof customTextList === 'string') {
        // 尝试解析为JSON
        try {
          const parsed = JSON.parse(customTextList)
          if (Array.isArray(parsed)) {
            textList = parsed.filter((t) => typeof t === 'string' && t.trim().length > 0)
          } else {
            // 如果不是JSON数组，当作逗号分隔字符串处理
            textList = customTextList
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0)
          }
        } catch {
          // JSON解析失败，当作逗号分隔字符串处理
          textList = customTextList
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
        }
      }

      // 将文字列表转换为文字素材
      textList.forEach((text) => {
        // 去重：如果该文字已添加则跳过
        if (!results.find((r) => r.text === text)) {
          results.push({
            text,
            fontSize: 60,
            fontWeight: 'normal',
          })
        }
      })
    })

    // 如果有从接口获取的文字，使用接口数据；否则保留默认的"+ 添加文字"
    if (results.length > 0) {
      state.basicTextList = results
    }
  } catch (e) {
    // 出错时保持默认文字
    console.error('加载文字素材失败:', e)
  }
}

const selectBasicText = (item: TBasicTextData) => {

  // store.commit('setShowMoveable', false) // 清理掉上一次的选择
  controlStore.setShowMoveable(false) // 清理掉上一次的选择

  let setting = JSON.parse(JSON.stringify(wTextSetting))
  setting.text = '双击编辑文字' // item.text
  setting.width = item.fontSize * setting.text.length
  setting.fontSize = item.fontSize
  setting.fontWeight = item.fontWeight
  const { width: pW, height: pH } = dPage.value
  setting.left = pW / 2 - item.fontSize * 3
  setting.top = pH / 2 - item.fontSize / 2

  widgetStore.addWidget(setting)
  // store.dispatch('addWidget', setting)
}

// const dragStart = (_: MouseEvent, item: any) => {
//   store.commit('setDraging', true)
//   store.commit('selectItem', { data: { value: item }, type: 'text' })
// }

defineExpose({
  selectBasicText,
})

// ...mapActions(['addWidget'])
</script>

<style lang="less" scoped>
// @color0: #3b74f1;

#text-list-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  .basic-text-wrap {
    padding: 10px 0;
    width: 100%;
    .basic-text-item {
      color: #33383e;
      background-color: #f1f2f4;
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0);
      border-top: 1px solid rgba(255, 255, 255, 0);
      // color: @color-black;
      padding: 12px 0;
      margin: 0 5%;
      text-align: center;
      width: 90%;
      // &:hover {
      //   background-color: rgba(0, 0, 0, 0.07);
      //   border-bottom: 1px solid @color0;
      //   border-top: 1px solid @color0;
      // }
    }
  }
  .other-text-wrap {
    flex: 1;
    overflow: auto;
    width: 100%;
  }
}
</style>
