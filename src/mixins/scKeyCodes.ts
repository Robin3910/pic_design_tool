/*
 * @Author: ShawnPhang
 * @Date: 2024-04-04 00:36:13
 * @Description: 快捷键支持列表
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-11 15:05:41
 */
const ctrlKey = isMacOS() ? `⌘` : `Ctrl`
function isMacOS() {
  return navigator.userAgent.includes(`Macintosh`) || navigator.userAgent.includes(`Mac OS X`)
}

export default [
  {
    feat: `复制`,
    info: `${ctrlKey} + C`,
  },
  {
    feat: `粘贴`,
    info: `${ctrlKey} + V`,
  },
  {
    feat: `删除`,
    info: `Delete / Backspace`,
  },
  {
    feat: `元素移动`,
    info: `← ↑ → ↓`,
  },
  {
    feat: `快速移动`,
    info: `Shift + ← ↑ → ↓`,
  },
  {
    feat: `缩放元素`,
    info: `${ctrlKey} + 滚轮`,
  },
  {
    feat: `上传图片`,
    info: `${ctrlKey} + S`,
  },
]
