<!--
 * @Author: ShawnPhang
 * @Date: 2024-03-17 16:10:21
 * @Description:  
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-11 18:42:09
-->
<template>
  <div v-if="percent" v-show="!hide" class="mask">
    <div class="content">
      <div class="tool">
        <div v-show="percent < 100" class="backstage" @click="close"><span style="margin-left: 0.4rem">后台下载</span></div>
        <iconClose v-show="percent >= 100" class="backstage" @click="cancel" width="20" />
      </div>
      <div class="text">{{ text }}</div>
      <el-progress style="width: 100%" :text-inside="true" :percentage="percent" />
      <div v-show="percent < 100" class="text btn" @click="cancel">{{ cancelText }}</div>
      <div v-if="msg" class="text info url-container">
        <span class="url-text">{{ msg }}</span>
        <el-button 
          v-if="percent >= 100 && isUrl(msg)" 
          type="primary" 
          size="small" 
          class="copy-btn"
          @click="copyUrl"
        >
          复制URL
        </el-button>
      </div>
      <div v-show="percent >= 100" class="success">
        <!-- 使用本地成功图标替代外部图片 -->
        <div class="success-icon">✅</div>
        <div class="success-text">下载完成</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { watch, ref } from 'vue'
import { ElProgress, ElButton } from 'element-plus'
import { Close as iconClose } from '@element-plus/icons-vue'
import useNotification from '@/common/methods/notification'
// import toolTip from '@/components/common/PopoverTip.vue'

type TProps = {
  percent: number
  text?: string
  cancelText?: string
  msg?: string
}

type TEmits = {
  (event: 'done'): void
  (event: 'cancel'): void
}

const props = withDefaults(defineProps<TProps>(), {
  percent: 0,
  text: '',
  cancelText: '',
  msg: '',
})

const hide = ref(false)

const emit = defineEmits<TEmits>()

watch(
  () => props.percent,
  (num) => {
    if (num >= 100) {
      // 完成之后自动消失，延迟2秒后触发done事件
      setTimeout(() => {
        emit('done')
      }, 2000)
    }
  },
)

const cancel = () => {
  emit('cancel')
  hide.value = false
}

const close = () => {
  hide.value = true
}

// 判断是否为URL
const isUrl = (str: string): boolean => {
  if (!str) return false
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// 复制URL到剪贴板
const copyUrl = async () => {
  if (!props.msg) return
  
  try {
    await navigator.clipboard.writeText(props.msg)
    useNotification('复制成功', '成品URL已复制到剪贴板', { type: 'success' })
  } catch (error) {
    // 降级方案：使用传统方法
    try {
      const textArea = document.createElement('textarea')
      textArea.value = props.msg || ''
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      useNotification('复制成功', '成品URL已复制到剪贴板', { type: 'success' })
    } catch (err) {
      console.error('复制失败:', err)
      useNotification('复制失败', '请手动复制URL', { type: 'error' })
    }
  }
}

defineExpose({
  cancel,
})
</script>

<style lang="less" scoped>
:deep(.el-progress-bar__innerText) {
  opacity: 0;
}
.mask {
  user-select: none;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 20px;
  width: 100%;
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  background: transparent;
  pointer-events: none;
}
.content {
  background: #ffffff;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  min-width: 300px;
  max-width: 500px;
}
.text {
  margin: 0.5rem 0;
  font-size: 14px;
  font-weight: bold;
  width: 100%;
  text-align: center;
  color: #333333;
}
.btn {
  font-weight: 400;
  font-size: 12px;
  cursor: pointer;
  color: #3771e5;
}
.info {
  font-weight: 400;
  font-size: 12px;
  color: #777777;
}
.url-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  
  .url-text {
    word-break: break-all;
    max-width: 100%;
    flex: 1;
    min-width: 0;
  }
  
  .copy-btn {
    flex-shrink: 0;
  }
}
.tool {
  text-align: right;
  margin-bottom: 0.25rem;
  .backstage {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    font-size: 12px;
  }
}
.success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
  
  .success-icon {
    font-size: 24px;
    margin-bottom: 0.25rem;
  }
  
  .success-text {
    font-size: 14px;
    color: #67c23a;
    font-weight: 600;
  }
}
</style>
