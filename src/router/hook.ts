import { NavigationGuardNext, RouteLocationNormalized, Router } from "vue-router"
import { useAuthStore } from '@/store'

export default (router: Router) => {

    router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
        // 认证检查
        const authStore = useAuthStore()
        const token = localStorage.getItem('xp_token')
        const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
        
        // 如果有token但没有认证状态，尝试初始化认证
        if (token && !authStore.isAuthenticated) {
            authStore.initializeAuth()
        }
        
        if (requiresAuth && !token) {
            // 需要认证但未登录，跳转到登录页
            console.log('未登录，跳转到登录页')
            next('/login')
            return
        }
        
        if (to.path === '/login' && token) {
            // 已登录用户访问登录页，跳转到首页
            next('/')
            return
        }

        // if (to.meta.requireAuth) { }

        // 有必要时清除残余的loading框
        // store.commit('loading', false);

       //  const $store = store as Type.Object
       //  $store.commit('changeRoute', from.path)

        if (/\/http/.test(to.path) || /\/https/.test(to.path)) {
            const url = to.path.split('http')[1]
            window.location.href = `http${url}`
        } else {
            next()
        }

    })

    router.afterEach(() => {
        window.scrollTo(0, 0);
    })
}
 
 
 