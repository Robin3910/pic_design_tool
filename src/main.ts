import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import utils from './utils'
import 'normalize.css/normalize.css'
import '@/assets/styles/index.less'
import elementConfig from './utils/widgets/elementConfig'
import { createPinia } from 'pinia'
import I18n from '@/languages/index'
import { useAuthStore } from '@/store'

const pinia = createPinia()
const app = createApp(App)

elementConfig.components.forEach((component) => {
  app.component(component.name, component)
})

elementConfig.plugins.forEach((plugin) => {
  app.use(plugin)
})

app
  // .use(store)
  .use(pinia)
  .use(router)
  .use(utils)
  .use(I18n)

// 初始化认证状态
const authStore = useAuthStore()
authStore.initializeAuth()

app.mount('#app')
