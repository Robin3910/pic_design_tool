import { NavigationGuardNext, RouteLocationNormalized, Router } from "vue-router"
import { useAuthStore } from '@/store'
import { LocalStorageKey } from '@/config'

// 白名单路由（无需 token 即可访问）
const whiteList = ['/login']

// 获取 accessToken 的工具函数
function getAccessToken(): string | null {
    return localStorage.getItem(LocalStorageKey.tokenKey)
}

export default (router: Router) => {

    router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
        const token = getAccessToken()
        const authStore = useAuthStore()
        
        // 如果有token但没有认证状态，尝试初始化认证
        if (token && !authStore.isAuthenticated) {
            authStore.initializeAuth()
        }
        
        if (token) {
            // 已登录状态
            if (to.path === '/login') {
                // 已登录用户访问登录页，跳转到首页或 redirect 参数指定的页面
                const redirect = to.query.redirect as string
                next({ path: redirect || '/' })
            } else {
                // 已登录用户访问其他页面，正常放行
                if (/\/http/.test(to.path) || /\/https/.test(to.path)) {
                    const url = to.path.split('http')[1]
                    window.location.href = `http${url}`
                } else {
                    next()
                }
            }
        } else {
            // 未登录状态
            if (whiteList.indexOf(to.path) !== -1) {
                // 在白名单中，直接放行
                next()
            } else {
                // 不在白名单中，重定向到登录页，并保存原路径到 redirect 参数
                next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
            }
        }
    })

    router.afterEach(() => {
        window.scrollTo(0, 0);
    })
}
 
 
 