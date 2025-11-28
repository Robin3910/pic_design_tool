<!--
 * @Author: ShawnPhang
 * @Date: 2022-03-07 17:25:19
 * @Description: 图层组件
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 09:25:15
-->
<template>
  <ul class="widget-list">
    <!-- <li v-for="widget in getWidgets" :key="widget.uuid" :class="['widget', { active: getIsActive(widget.uuid) }, 'item-one']" @click="selectLayer(widget)" @mouseover="hoverLayer(widget.uuid)" @mouseout="hoverLayer('-1')">
      <span v-show="widget.parent !== '-1'" :class="['widget-type icon', `sd-xiaji`]"></span>
      <img v-if="widget.imgUrl" class="widget-type widget-type__img" :src="widget.imgUrl" />
      <span v-else :class="['widget-type icon', `sd-${widget.type}`, widget.type]"></span>
      <span :class="['widget-name', 'line-clamp-1', `${widget.type}`]">{{ widget.text || widget.name }}</span>
      <div class="widget-out" :data-type="widget.type" :data-uuid="widget.uuid"></div>
    </li> -->
    <draggable v-model="widgets" group="type" item-key="uuid" v-bind="dragOptions" :move="onMove" @start="drag = true" @end="onDone">
      <template #item="{ element }">
        <li :class="['widget', { active: getIsActive(element.uuid), disable: !showItem(element) }, 'item-one']" @click="selectLayer(element)" @mouseover="hoverLayer(element)" @mouseout="hoverLayer('-1')">
          <!-- <span v-show="+element.parent !== -1" :class="['widget-type icon', `sd-xiaji`]"></span> -->
          <span v-show="+element.parent !== -1" class="second-layer"></span>
          <img v-if="element.imgUrl" class="widget-type widget-type__img" :src="element.imgUrl" />
          <img v-else-if="element.svgUrl" class="widget-type widget-type__img" :src="element.svgUrl" />
          <span v-else :class="['widget-type icon', `sd-${element.type}`, element.type]"></span>
          <span :class="['widget-name', 'line-clamp-1', `${element.type}`]">{{ stripHtmlTags(element.text || element.name) }} {{ element.mask ? '(容器)' : '' }}</span>
          <div class="widget-out" :data-type="element.type" :data-uuid="element.uuid">
            <img src="/置顶.svg" :class="['top-icon', { 'top-icon-active': element.isTop }]" @click.stop="topLayer(element)" :title="element.isTop ? '取消置顶' : '置顶'" />
            <i :class="['delete-icon']" @click.stop="deleteLayer(element)" title="删除" />
            <i :class="['icon', element.lock ? 'sd-suoding' : 'sd-jiesuo']" @click.stop="lockLayer(element)" />
          </div>
        </li>
      </template>
    </draggable>

    <!-- <li :class="['widget', { active: dActiveElement.uuid === dPage.uuid && dSelectWidgets.length === 0 }]" @click="selectLayer(dPage)" @mouseover="hoverLayer('-1')" @mouseout="hoverLayer('-1')">
      <span class="widget-type"></span>
      <span class="widget-name">{{ dPage.name }}</span>
      <div class="widget-out" :data-type="dPage.type" :data-uuid="dPage.uuid"></div>
    </li> -->
  </ul>
</template>

<script lang="ts">
import { useWidgetStore } from '@/store'
import { TdWidgetData } from '@/store/design/widget'
import { defineComponent, computed, reactive, ref, toRefs } from 'vue'

import draggable from 'vuedraggable'

export default defineComponent({
  components: { draggable },
  props: ['data'],
  emits: ['change'],
  setup(props, context) {
    const widgetStore = useWidgetStore()
    let widgets = ref<TdWidgetData[]>([])
    const state = reactive<{drag: boolean}>({
      drag: false,
    })
    const dragOptions = computed(() => {
      return {
        animation: 300,
        // disabled: !state.editable,
        ghostClass: 'ghost',
        chosenClass: 'choose',
      }
    })

    
    // const dPage = computed(() => {
    //   return store.getters.dPage
    // })
    // const dActiveElement = computed(() => {
    //   return store.getters.dActiveElement
    // })
    // const dSelectWidgets = computed(() => {
    //   return store.getters.dSelectWidgets
    // })
    const showItem = (item: any) => {
      return state.drag === true && item.parent != '-1' ? false : true
    }
    // const cWidgets = computed(() => {
    //   return getWidgets()
    // })
    const getWidgets = () => {
      let widgets = []
      let len = props.data.length
      const data = props.data.slice(0)
      const childs = [] // 临时子组件
      for (let i = len - 1; i >= 0; --i) {
        let widget = JSON.parse(JSON.stringify(data[i]))
        if (widget.parent != -1) {
          childs.unshift(widget)
        } else {
          widgets.push(widget)
        }
      }
      for (const item of childs) {
        // widgets[widgets.findIndex((x) => x.uuid === item.parent)].childs.push(item)
        const index = widgets.findIndex((x) => x.uuid === item.parent)
        widgets.splice(index + 1, 0, item)
      }
      return widgets
    }

    const getIsActive = (uuid: string) => {
      if (widgetStore.dSelectWidgets.length > 0) {
        let widget = widgetStore.dSelectWidgets.find((item) => item.uuid === uuid)
        if (widget) {
          return true
        }
        return false
      } else {
        return uuid === widgetStore.dActiveElement?.uuid
      }
    }

    const selectLayer = (widget: any) => {
      // console.log(widget)
      widgetStore.selectWidget({ uuid: widget.uuid })
      // store.dispatch('selectWidget', { uuid: widget.uuid })
    }
    const hoverLayer = ({ uuid, parent }: any) => {
      widgetStore.updateHoverUuid(uuid)
      // store.dispatch('updateHoverUuid', uuid)
    }

    const onMove = ({ relatedContext, draggedContext }: any) => {
      const relatedElement = relatedContext.element
      const draggedElement = draggedContext.element
      // const index = props.data.findIndex((x: any) => x.uuid === draggedElement.uuid)
      // const toIndex = props.data.findIndex((x: any) => x.uuid === relatedElement.uuid)
      // console.log(index, toIndex)
      return (!relatedElement || relatedElement.parent == -1) && draggedElement.parent == -1
    }

    const onDone = () => {
      state.drag = false
      context.emit('change', widgets.value)
    }
    // 锁定图层
    const lockLayer = (item: any) => {
      widgetStore.updateWidgetData({
        uuid: item.uuid,
        key: 'lock',
        value: typeof item.lock === 'undefined' ? true : !item.lock
      })
      // store.dispatch('updateWidgetData', {
      //   uuid: item.uuid,
      //   key: 'lock',
      //   value: typeof item.lock === 'undefined' ? true : !item.lock,
      //   pushHistory: false,
      // })
      // item.lock = typeof item.lock === 'undefined' ? true : !item.lock
    }
    // 置顶图层
    const topLayer = (item: any) => {
      widgetStore.updateLayerIndex({
        uuid: item.uuid,
        value: 999,
        isGroup: item.isContainer
      })
    }
    const deleteLayer = (item: TdWidgetData) => {
      widgetStore.selectWidget({ uuid: item.uuid })
      widgetStore.deleteWidget({ uuid: item.uuid })
    }

    // 将 HTML 转换为纯文本（去除标签）
    const stripHtmlTags = (html: string) => {
      if (!html) return ''
      // 创建一个临时 DOM 元素来解析 HTML
      const tmp = document.createElement('div')
      tmp.innerHTML = html
      return tmp.textContent || tmp.innerText || ''
    }

    return { lockLayer, topLayer, deleteLayer, onDone, onMove, selectLayer, hoverLayer, widgets, getWidgets, getIsActive, stripHtmlTags, ...toRefs(state), dragOptions, showItem }
  },
  watch: {
    data: {
      async handler(nval) {
        this.widgets = this.getWidgets()
      },
      immediate: true,
      deep: true,
    },
  },
})
</script>

<style lang="less" scoped>
// 苹果风格配色
@apple-bg: rgba(255, 255, 255, 0.6);
@apple-bg-hover: rgba(255, 255, 255, 0.8);
@apple-bg-active: rgba(0, 122, 255, 0.12);
@apple-border: rgba(0, 0, 0, 0.06);
@apple-text-primary: #1d1d1f;
@apple-text-secondary: #86868b;
@apple-text-active: #007aff;
@apple-shadow: rgba(0, 0, 0, 0.08);
@apple-shadow-hover: rgba(0, 0, 0, 0.12);

.widget-list {
  width: 100%;
  padding: 4px 12px;
  
  .widget {
    align-items: center;
    background-color: @apple-bg;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid transparent;
    border-radius: 10px;
    color: @apple-text-primary;
    cursor: grab;
    display: flex;
    padding: 10px 12px;
    position: relative;
    width: 100%;
    margin-bottom: 6px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    
    &:hover {
      background-color: @apple-bg-hover;
      border-color: @apple-border;
      box-shadow: 0 2px 8px @apple-shadow-hover;
      transform: translateY(-1px);
      
      .widget-out > .sd-jiesuo,
      .widget-out > .top-icon,
      .widget-out > .delete-icon {
        opacity: 1;
      }
    }
    
    &:active {
      cursor: grabbing;
      transform: translateY(0);
    }
    
    .widget-type {
      align-items: center;
      color: @apple-text-secondary;
      display: flex;
      height: 30px;
      width: 30px;
      justify-content: center;
      margin-right: 10px;
      flex-shrink: 0;
      transition: all 0.2s ease;
      
      &__img {
        object-fit: contain;
        background-color: #ffffff;
        background-image: -webkit-linear-gradient(45deg, #f5f5f5 25%, transparent 25%, transparent 75%, #f5f5f5 75%, #f5f5f5), 
                          -webkit-linear-gradient(45deg, #f5f5f5 25%, transparent 25%, transparent 75%, #f5f5f5 75%, #f5f5f5);
        background-position: 0 0, 10px 10px;
        background-size: 21px 21px;
        border: 1px solid @apple-border;
        border-radius: 6px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
    }
    
    .widget-name {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      padding-right: 22px;
      color: @apple-text-primary;
      letter-spacing: -0.01em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .widget-out {
      height: 100%;
      margin-left: -12px;
      position: absolute;
      width: 100%;
      display: flex;
      align-items: center;
      pointer-events: none;
      
      > * {
        pointer-events: auto;
      }
    }
  }
  
  .widget.active {
    background-color: @apple-bg-active;
    border-color: rgba(0, 122, 255, 0.2);
    color: @apple-text-active;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15),
                inset 0 0 0 1px rgba(0, 122, 255, 0.1);
    
    .widget-name {
      color: @apple-text-active;
      font-weight: 600;
    }
    
    .widget-type {
      color: @apple-text-active;
    }
    
    .widget-out > .sd-jiesuo,
    .widget-out > .top-icon,
    .widget-out > .delete-icon {
      opacity: 1;
    }
  }
  
  .item-one {
    padding-left: 12px;
  }
}

.w-group {
  font-weight: 600;
}

// icons
.sd-jiesuo,
.sd-suoding {
  position: absolute;
  font-size: 16px;
  cursor: pointer;
  color: @apple-text-secondary;
  right: 40px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
    color: @apple-text-primary;
    transform: scale(1.1);
  }
}

.sd-jiesuo {
  opacity: 0;
}

.sd-suoding {
  color: #34c759;
  opacity: 0.8;
  
  &:hover {
    background-color: rgba(52, 199, 89, 0.1);
    color: #34c759;
}
}

.top-icon {
  position: absolute;
  right: 68px;
  width: 18px;
  height: 18px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;
  padding: 1px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
    transform: scale(1.1);
  }
  
  &.top-icon-active {
    opacity: 1;
    filter: brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%);
  }
}

.delete-icon {
  position: absolute;
  right: 12px;
  width: 18px;
  height: 18px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
  background-color: @apple-text-secondary;
  -webkit-mask: url('/delete.svg') center / contain no-repeat;
  mask: url('/delete.svg') center / contain no-repeat;
  border-radius: 4px;
  padding: 1px;
  
  &:hover {
    background-color: #ff3b30;
    transform: scale(1.1);
  }
}

.sd-xiaji {
  margin: 0 -4px 0 32px !important;
}

.second-layer {
  margin-right: 40px;
  width: 2px;
  height: 20px;
  background: linear-gradient(to bottom, transparent, @apple-border, transparent);
  border-radius: 1px;
}

// dragable
.choose {
  border: 2px dashed @apple-text-active !important;
  background-color: rgba(0, 122, 255, 0.08) !important;
  border-radius: 10px !important;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2) !important;
}

.flip-list-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.no-move {
  transition: transform 0s;
}

.disable {
  opacity: 0.4;
  pointer-events: none;
}

.ghost {
  opacity: 0.5;
  background: rgba(0, 122, 255, 0.1) !important;
  border: 2px dashed @apple-text-active !important;
  border-radius: 10px !important;
}
</style>
