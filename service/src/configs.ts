/*
 * @Author: ShawnPhang
 * @Date: 2022-02-01 13:41:59
 * @Description: 配置文件
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 05:13:19
 */
const isDev = process.env.NODE_ENV === 'development'

// 服务器常用修改项
const serviceComfig = {
    port: 7001, // 端口号
    website: 'http://127.0.0.1:5173/', // 编辑器项目的地址
    filePath: '/cache/' // 生成图片保存的目录
}

/**
 * 端口号
 */
export const servicePort = serviceComfig.port

/**
 * 前端绘制页地址
 */
export const drawLink = isDev ? 'http://127.0.0.1:5173/draw' : serviceComfig.website + '/draw'

/**
 * 图片缓存目录位置，根据实际情况调整
 */
export const filePath = isDev ? process.cwd() + `/static/` : serviceComfig.filePath

/**
 * 配置服务器端的chrome浏览器位置
 */
export const executablePath = isDev ? null : (() => {
  // Windows系统Chrome路径
  if (process.platform === 'win32') {
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ]
    // 返回第一个存在的路径，如果都不存在则返回null让puppeteer自动查找
    return null
  }
  // Linux系统路径
  return '/opt/google/chrome-unstable/chrome'
})()

/**
 * 截图并发数上限
 */
export const maxNum = 2

/**
 * 截图队列的阈值，超出时请求将会被熔断
 */
export const upperLimit = 20

/**
 * 多久释放浏览器驻留内存，单位：秒（多标签页版生效）
 */
export const releaseTime = 300
