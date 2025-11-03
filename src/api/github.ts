/*
 * @Author: ShawnPhang
 * @Date: 2023-07-13 17:01:37
 * @Description: github api
 * @LastEditors: ShawnPhang <site: book.palxp.com>
 * @LastEditTime: 2023-08-10 10:33:59
 */
import fetch from '@/utils/axios'
const cutToken = 'ghp_qpV8PUxwY7as4jc'

const reader = new FileReader()
function getBase64(file: File) {
  return new Promise((resolve) => {
    reader.onload = function (event) {
      const fileContent = event.target && event.target.result
      resolve((fileContent as string).split(',')[1])
    }
    reader.readAsDataURL(file)
  })
}

// 主后端服务已移除（注意：github.ts实际上使用的是GitHub API，不是主后端服务）
// 但因为它使用了axios工具，为了保持一致性也进行注释
const putPic = async (file: File | string) => {
  // 此函数实际调用的是GitHub API，不是主后端服务
  // 如果需要继续使用，应该直接使用axios而不是fetch工具
  throw new Error('GitHub上传功能已禁用（使用了主后端服务的axios工具）')
  // const repo = 'shawnphang/files'
  // const d = new Date()
  // const content = typeof file === 'string' ? file : await getBase64(file)
  // const extra = typeof file === 'string' ? '.png' : file.name?.split('.').pop()
  // const path = `${d.getFullYear()}/${d.getMonth()}/${d.getTime()}${extra}`
  // const imageUrl = 'https://api.github.com/repos/' + repo + '/contents/' + path
  // const body = { branch: 'main', message: 'upload', content, path }
  // const res = await fetch(imageUrl, body, 'put', {
  //   Authorization: `token ${cutToken}AqYfNFb6G2f2OVl4IVFOY`,
  //   'Content-Type': 'application/json; charset=utf-8',
  // })
  // return res?.content?.download_url || `https://fastly.jsdelivr.net/gh/shawnphang/files@main/${path}`
}

export default { putPic }
