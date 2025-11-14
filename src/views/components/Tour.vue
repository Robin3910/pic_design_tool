<!--
 * @Author: ShawnPhang
 * @Date: 2024-04-04 03:05:45
 * @Description: 漫游导航
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-05 05:31:01
-->
<template>
  <el-tour v-model="isShow">
    <el-tour-step placement="bottom" :target="steps[0]?.$el || steps[0]" title="撤销按钮" description="误操作了？点击这里或使用 Ctrl+Z 快速回退一步。"/>
    <el-tour-step placement="bottom" :target="steps[1]?.$el || steps[1]" title="前进按钮" description="想恢复撤销的内容，点这里或使用 Ctrl+Shift+Z / Ctrl+Y。"/>
    <el-tour-step placement="bottom" :target="steps[2]?.$el || steps[2]" title="保存按钮" description="创作到一半也别担心，点击保存将当前作品上传备份。"/>
    <el-tour-step placement="bottom" :target="steps[3]?.$el || steps[3]" title="清除素材按钮" description="需要重头开始？这里可一键清空画布上的素材（保留锁定元素）。"/>
    <el-tour-step placement="bottom" :target="steps[4]?.$el || steps[4]" title="页面缩放" description="用这组按钮放大/缩小或重置视图，方便检查细节。"/>
    <el-tour-step placement="right" :target="steps[5]?.$el || steps[5]" title="素材与模板面板">
      <div>在这里挑选模板、文字、形状与图片素材，拖拽到画布即可开始创作。</div>
    </el-tour-step>
    <el-tour-step placement="left" :target="steps[6]?.$el || steps[6]" title="属性与图层面板" description="选中画布元素后，可在此调整样式、位置与图层顺序，精细控制每个细节。" />
    <el-tour-step :target="steps[7]?.$el || steps[7]" title="下载图片" description="完成后点击这里导出设计稿，支持图片快速下载与分享。" />
  </el-tour>
</template>

<script setup lang="ts">
import { ElTour, ElTourStep } from 'element-plus'
import { ref } from 'vue'

type TProps = {
  steps: any,
}

const props = withDefaults(defineProps<TProps>(), {
  steps: [],
})

const isShow = ref(false)

const open = () => {
  isShow.value = true
}

defineExpose({
  open
})
</script>
