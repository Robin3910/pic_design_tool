<!--
 * @Author: ShawnPhang
 * @Date: 2021-07-29 18:31:27
 * @Description: 
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-11-14 16:48:06
-->
<template>
  <div class="icon-item-select">
    <span v-if="label" class="label">{{ label }}</span>
    <ul v-if="data" class="list btn__bar flex">
      <el-tooltip v-for="(item, index) in data" :key="index" class="item" effect="dark" :content="item.tip" placement="top" :show-after="300" >
        <li :class="{ 'list-item': true, active: item.select }" @click="selectItem(item)">
          <img v-if="item.imgSrc" :src="item.imgSrc" class="icon-img" />
          <i v-else :class="`${item.extraIcon ? 'icon' : 'iconfont'} ${item.icon}`"></i>
        </li>
      </el-tooltip>
    </ul>
  </div>
</template>

<script lang="ts" setup>
// 图标按钮选择组件
// const NAME = 'icon-item-select'

export type TIconItemSelectData = {
  key?: string
  select?: boolean,
  extraIcon?: boolean,
  tip?: string
  icon?: string
  imgSrc?: string  // SVG 图片路径
  value?: string | number | number[] | string[]
}

type TProps = {
  label?: string
  data: TIconItemSelectData[]
}

type TEmits = {
  (event: 'finish', data: TIconItemSelectData): void
}

const props = withDefaults(defineProps<TProps>(), {
  label: ''
})

const emit = defineEmits<TEmits>()


function selectItem(item: TIconItemSelectData) {
  if (typeof item.select !== 'undefined') {
    item.select = !item.select
  }
  emit('finish', item)
  // text-align非独立选项，恢复选中状态
  item.key === 'textAlign' && (item.select = true)
}

</script>

<style lang="less" scoped>
.flex {
  display: flex !important;
  justify-content: space-around !important;
  flex-direction: row !important;
  align-items: center !important;
}
.btn__bar {
  margin-bottom: 12px;
  padding: 0 12px;
  background: #f3f5f7 !important;
  border: none;
  border-radius: 6px;
  height: 40px;
  opacity: 1 !important;
  visibility: visible !important;
  display: flex !important;
  align-items: center !important;
  list-style: none !important;
  margin: 0 0 12px 0 !important;
}
</style>
<style lang="less" scoped>
.icon-item-select {
  width: 100%;
  .label {
    margin-right: 10px;
  }
  .list {
    line-height: 1;
    display: flex !important;
    align-items: center !important;
    .list-item {
      color: #444950 !important;
      cursor: pointer;
      padding: 5px;
      margin: 4px 0;
      height: 32px;
      width: 32px;
      min-width: 32px;
      min-height: 32px;
      opacity: 1 !important;
      visibility: visible !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      list-style: none !important;
      position: relative !important;
      i {
        font-size: 21px !important;
        opacity: 1 !important;
        visibility: visible !important;
        color: #444950 !important;
        display: inline-block !important;
        line-height: 1 !important;
        font-style: normal !important;
        /* 确保图标字体正确应用 */
        font-family: 'iconfont', 'icon', sans-serif !important;
        /* 如果图标字体未加载，至少显示一个占位符 */
        min-width: 21px !important;
        min-height: 21px !important;
        text-align: center !important;
      }
      .icon-img {
        width: 21px !important;
        height: 21px !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: inline-block !important;
        object-fit: contain !important;
      }
      /* 针对 icon 类的特殊处理 - 使用 ICONFONT_EXTRA 字体 */
      .list-item .icon {
        font-family: 'icon', 'iconfont', sans-serif !important;
      }
      /* 确保 iconfont 类使用正确的字体 */
      .list-item .iconfont {
        font-family: 'iconfont', sans-serif !important;
      }
      &:hover {
        background-color: #e3e4e5;
        border-radius: 7px;
      }
    }
    .list-item.active {
      color: @main-color !important;
      font-weight: bold;
      i {
        color: @main-color !important;
      }
      .icon-img {
        // 将 SVG 图标颜色改为主题色 #2254f4
        filter: brightness(0) saturate(100%) invert(37%) sepia(95%) saturate(2476%) hue-rotate(212deg) brightness(98%) contrast(95%);
      }
    }
  }
}
</style>
