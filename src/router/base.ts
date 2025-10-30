import { RouteRecordRaw } from 'vue-router';

/*
 * @Author: ShawnPhang
 * @Date: 2021-08-19 18:43:22
 * @Description: 前端路由
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2023-09-19 17:32:04
 */
export default [
  // {
  //   path: '/',
  //   name: 'main',
  //   redirect: 'home',
  //   component: () => import('@/views/Ready.vue'),
  //   children: [
  //     {
  //       name: 'Home',
  //       path: '/home',
  //       component: () => import(/* webpackChunkName: 'base' */ '@/views/Index.vue'),
  //     },
  //   ],
  // },
  {
    // 登录页面
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: 'login' */ '@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    // 预留主页
    path: '/',
    name: 'main',
    redirect: 'home',
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import(/* webpackChunkName: 'base' */ '@/views/Index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/draw',
    name: 'Draw',
    component: () => import(/* webpackChunkName: 'draw' */ '@/views/Draw.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: "/html",
    name: "Html",
    component: () => import(/* webpackChunkName: 'html' */ '@/views/Html.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/psd',
    name: 'Psd',
    component: () => import(/* webpackChunkName: 'psd' */ '@/views/Psd.vue'),
    meta: { requiresAuth: true }
  },
] as RouteRecordRaw[]
