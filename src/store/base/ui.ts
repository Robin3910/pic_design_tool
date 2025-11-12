import { Store, defineStore } from 'pinia'

type TUiState = {
  /** 全局界面缩放（百分比），用于模拟浏览器缩放 */
  uiZoom: number
}

type TUiActions =
  | 'setUiZoom'
  | 'zoomIn'
  | 'zoomOut'
  | 'resetZoom'

const UiStore = defineStore<'uiStore', TUiState, {}, Record<TUiActions, (v?: number) => void>>('uiStore', {
  state: () => ({
    uiZoom: 100,
  }),
  actions: {
    setUiZoom(v: number = 100) {
      const nv = Math.min(300, Math.max(50, Math.round(v)))
      this.uiZoom = nv
      try {
        localStorage.setItem('ui_zoom_percent', String(nv))
      } catch {}
    },
    zoomIn(step: number = 10) {
      this.setUiZoom(this.uiZoom + step)
    },
    zoomOut(step: number = 10) {
      this.setUiZoom(this.uiZoom - step)
    },
    resetZoom() {
      this.setUiZoom(100)
    },
  },
})

export type TUiStore = Store<'uiStore', TUiState, {}, Record<TUiActions, (v?: number) => void>>
export default UiStore


