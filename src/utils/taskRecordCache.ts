/**
 * 全局任务记录缓存（按 taskId 存储），供保存时使用，避免查询
 * 使用 Map 存储，key 为 taskId，value 为任务记录对象
 */
export const taskRecordCache = new Map<number | string, any>()

