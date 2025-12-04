<template>
  <div class="login-container">
    <!-- 左侧装饰区域 -->
    <div class="login-left">
      <div class="left-content">
        <div class="brand-section">
          <div class="logo-container">
            <div class="logo-glow"></div>
            <div class="logo-main">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <h1 class="brand-title">{{ config.APP_NAME }}</h1>
          <p class="brand-subtitle">专业的在线图片设计工具，让创意触手可及</p>
        </div>
        
        <div class="features-list">
          <div class="feature-item">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 3v18M3 9h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="feature-text">
              <h3>丰富模板</h3>
              <p>海量精美模板，一键应用快速设计</p>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="feature-text">
              <h3>智能编辑</h3>
              <p>强大的编辑功能，轻松制作专业海报</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 背景装饰 -->
      <div class="bg-pattern"></div>
      
      <!-- 网格背景 -->
      <div class="grid-background"></div>
      
      <!-- 流动线条 -->
      <div class="flowing-lines">
        <div class="line line-1"></div>
        <div class="line line-2"></div>
        <div class="line line-3"></div>
      </div>
      
      <!-- 旋转装饰 -->
      <div class="rotating-elements">
        <div class="rotator rotator-1">
          <div class="rotator-inner"></div>
        </div>
        <div class="rotator rotator-2">
          <div class="rotator-inner"></div>
        </div>
      </div>
      
      <!-- 粒子效果 -->
      <div class="particles">
        <div class="particle" v-for="i in 20" :key="i" :style="{ animationDelay: `${i * 0.2}s` }"></div>
      </div>
      
      <!-- 光效扫过 -->
      <div class="light-sweep"></div>
      
      <!-- 浮动形状 -->
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
        <div class="shape shape-6"></div>
      </div>
      
      <!-- 渐变光晕 -->
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>
    
    <!-- 右侧登录表单 -->
    <div class="login-right">
      <div class="login-card">
        <div class="card-header">
          <h2 class="welcome-title">欢迎回来</h2>
          <p class="welcome-subtitle">请登录您的账户以继续</p>
        </div>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username" class="input-label">
              <svg class="label-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>用户名</span>
            </label>
            <div class="input-container">
              <input
                id="username"
                v-model="loginForm.username"
                type="text"
                placeholder="请输入您的用户名"
                required
                :disabled="authStore.isLoading"
                autocomplete="username"
                class="form-input"
              />
              <div class="input-border"></div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="password" class="input-label">
              <svg class="label-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>密码</span>
            </label>
            <div class="input-container">
              <input
                id="password"
                v-model="loginForm.password"
                type="password"
                placeholder="请输入您的密码"
                required
                :disabled="authStore.isLoading"
                autocomplete="current-password"
                class="form-input"
              />
              <div class="input-border"></div>
            </div>
          </div>
          
          <button 
            type="submit" 
            class="login-button"
            :disabled="authStore.isLoading"
          >
            <span v-if="authStore.isLoading" class="button-content">
              <span class="button-spinner"></span>
              <span>登录中...</span>
            </span>
            <span v-else class="button-content">
              <span>立即登录</span>
              <svg class="button-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <div class="button-shine"></div>
          </button>
        </form>
        
        <transition name="error-slide">
          <div v-if="errorMessage" class="error-alert">
            <svg class="alert-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import config from '@/config'
import { useAuthStore } from '@/store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const errorMessage = ref('')

const loginForm = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    errorMessage.value = '请输入用户名和密码'
    return
  }
  
  errorMessage.value = ''
  
  try {
    await authStore.loginAction(loginForm.username, loginForm.password)
    
    // 登录成功，跳转到 redirect 参数指定的页面，如果没有则跳转到首页
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (error: any) {
    console.error('Login error:', error)
    errorMessage.value = error.message || '登录失败，请检查网络连接'
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  background: #F5F5F7;
  position: relative;
  overflow: hidden;
}

/* 左侧装饰区域 */
.login-left {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: linear-gradient(135deg, #E8F4F8 0%, #F0E8F5 50%, #F5E8F0 100%);
  background-size: 200% 200%;
  overflow: hidden;
  min-height: 100vh;
  animation: gradient-shift 15s ease infinite;
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.left-content {
  position: relative;
  z-index: 2;
  max-width: 500px;
  width: 100%;
  animation: fadeInLeft 0.8s ease-out;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.brand-section {
  margin-bottom: 80px;
}

.logo-container {
  position: relative;
  display: inline-block;
  margin-bottom: 24px;
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  background: rgba(0, 122, 255, 0.15);
  border-radius: 50%;
  filter: blur(40px);
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.8;
  }
}

.logo-main {
  position: relative;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #007AFF;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
  animation: logo-float 6s ease-in-out infinite;
}

.logo-main::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #667eea);
  border-radius: 20px;
  z-index: -1;
  opacity: 0;
  animation: logo-border-glow 3s ease-in-out infinite;
}

@keyframes logo-float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(5deg);
  }
}

@keyframes logo-border-glow {
  0%, 100% {
    opacity: 0;
    filter: blur(10px);
  }
  50% {
    opacity: 0.6;
    filter: blur(15px);
  }
}

.logo-main:hover {
  transform: translateY(-8px) rotate(10deg) scale(1.05);
  animation-play-state: paused;
}

.logo-main svg {
  animation: logo-svg-rotate 8s linear infinite;
}

@keyframes logo-svg-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.logo-main svg {
  width: 40px;
  height: 40px;
}

.brand-title {
  font-size: 42px;
  font-weight: 700;
  color: #1D1D1F;
  margin: 0 0 12px 0;
  letter-spacing: -0.8px;
  animation: title-shimmer 3s ease-in-out infinite;
  background: linear-gradient(135deg, #1D1D1F 0%, #007AFF 50%, #AF52DE 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

@keyframes title-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.brand-subtitle {
  font-size: 18px;
  color: #6E6E73;
  margin: 0;
  line-height: 1.6;
  font-weight: 400;
  animation: subtitle-fade 4s ease-in-out infinite;
}

@keyframes subtitle-fade {
  0%, 100% {
    opacity: 0.9;
  }
  50% {
    opacity: 1;
  }
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.6s ease-out backwards;
  position: relative;
  overflow: hidden;
}

.feature-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 122, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.feature-item:hover::before {
  left: 100%;
}

.feature-item:nth-child(1) {
  animation-delay: 0.1s;
}

.feature-item:nth-child(2) {
  animation-delay: 0.2s;
}

.feature-item:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.85);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  border-color: rgba(0, 122, 255, 0.3);
}

.feature-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.1), rgba(175, 82, 222, 0.1));
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #007AFF;
  flex-shrink: 0;
  border: 1px solid rgba(0, 122, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: icon-pulse 3s ease-in-out infinite;
}

.feature-item:nth-child(1) .feature-icon {
  animation-delay: 0s;
}

.feature-item:nth-child(2) .feature-icon {
  animation-delay: 1s;
}

.feature-item:nth-child(3) .feature-icon {
  animation-delay: 2s;
}

@keyframes icon-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 255, 255, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
  }
}

.feature-icon svg {
  width: 24px;
  height: 24px;
}

.feature-text h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1D1D1F;
  margin: 0 0 4px 0;
  letter-spacing: -0.3px;
}

.feature-text p {
  font-size: 14px;
  color: #6E6E73;
  margin: 0;
  line-height: 1.5;
}

/* 设计器预览区域 */
.design-preview {
  margin-top: 60px;
  animation: fadeInUp 0.8s ease-out 0.4s backwards;
}

.preview-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: preview-float 6s ease-in-out infinite;
}

@keyframes preview-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.preview-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.9);
}

.preview-header {
  background: rgba(245, 245, 247, 0.8);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.preview-dots {
  display: flex;
  gap: 6px;
}

.preview-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  animation: dot-pulse 2s ease-in-out infinite;
}

.preview-dots span:nth-child(1) {
  background: #ff5f57;
  animation-delay: 0s;
}

.preview-dots span:nth-child(2) {
  background: #ffbd2e;
  animation-delay: 0.2s;
}

.preview-dots span:nth-child(3) {
  background: #28ca42;
  animation-delay: 0.4s;
}

@keyframes dot-pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.preview-title {
  font-size: 12px;
  color: #6E6E73;
  font-weight: 500;
}

.preview-content {
  padding: 20px;
  background: rgba(255, 255, 255, 0.5);
  min-height: 180px;
  position: relative;
}

.preview-canvas {
  width: 100%;
  height: 160px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.05), rgba(175, 82, 222, 0.05));
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  border: 1px dashed rgba(0, 122, 255, 0.2);
}

.canvas-element {
  position: absolute;
  border-radius: 4px;
  animation: element-move 8s ease-in-out infinite;
}

.element-1 {
  width: 60px;
  height: 40px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.6), rgba(175, 82, 222, 0.6));
  top: 20px;
  left: 20px;
  animation-delay: 0s;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2);
}

.element-2 {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, rgba(255, 45, 85, 0.6), rgba(0, 122, 255, 0.6));
  top: 30px;
  right: 30px;
  border-radius: 50%;
  animation-delay: 1s;
  box-shadow: 0 4px 12px rgba(255, 45, 85, 0.2);
}

.element-3 {
  width: 80px;
  height: 30px;
  background: linear-gradient(135deg, rgba(175, 82, 222, 0.6), rgba(255, 45, 85, 0.6));
  bottom: 30px;
  left: 30px;
  animation-delay: 2s;
  box-shadow: 0 4px 12px rgba(175, 82, 222, 0.2);
}

.element-4 {
  width: 40px;
  height: 60px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.5), rgba(175, 82, 222, 0.5));
  bottom: 20px;
  right: 40px;
  animation-delay: 3s;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.15);
}

@keyframes element-move {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(5px, -5px) scale(1.05);
  }
  50% {
    transform: translate(-5px, 5px) scale(0.95);
  }
  75% {
    transform: translate(5px, 5px) scale(1.02);
  }
}

/* 背景装饰 */
.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(0, 122, 255, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(175, 82, 222, 0.08) 0%, transparent 50%);
  opacity: 0.6;
  animation: pattern-shift 15s ease-in-out infinite;
}

@keyframes pattern-shift {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(20px, -20px) scale(1.05);
    opacity: 0.7;
  }
}

/* 网格背景 */
.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(0, 122, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 122, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: grid-move 20s linear infinite;
  opacity: 0.4;
}

@keyframes grid-move {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

/* 流动线条 */
.flowing-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.line {
  position: absolute;
  background: linear-gradient(90deg, transparent, rgba(0, 122, 255, 0.2), transparent);
  height: 2px;
  width: 200%;
  animation: flow-line 8s linear infinite;
}

.line-1 {
  top: 20%;
  left: -100%;
  animation-delay: 0s;
}

.line-2 {
  top: 50%;
  left: -100%;
  animation-delay: 2.5s;
  width: 150%;
}

.line-3 {
  top: 80%;
  left: -100%;
  animation-delay: 5s;
  width: 180%;
}

@keyframes flow-line {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* 旋转装饰 */
.rotating-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.rotator {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 2px solid rgba(0, 122, 255, 0.08);
  animation: rotate 20s linear infinite;
}

.rotator-1 {
  top: 10%;
  right: 10%;
  animation-duration: 25s;
}

.rotator-2 {
  bottom: 15%;
  left: 15%;
  animation-duration: 30s;
  animation-direction: reverse;
}

.rotator-inner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  border-radius: 50%;
  border: 1px dashed rgba(0, 122, 255, 0.12);
  animation: rotate-inner 15s linear infinite reverse;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes rotate-inner {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(-360deg);
  }
}

/* 粒子效果 */
.particles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(0, 122, 255, 0.4);
  border-radius: 50%;
  animation: particle-float 15s infinite ease-in-out;
  box-shadow: 0 0 6px rgba(0, 122, 255, 0.3);
}

.particle:nth-child(odd) {
  width: 6px;
  height: 6px;
  animation-duration: 20s;
}

.particle:nth-child(3n) {
  width: 3px;
  height: 3px;
  animation-duration: 12s;
}

@keyframes particle-float {
  0% {
    transform: translate(0, 100vh) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translate(var(--random-x, 100px), -100px) scale(1);
    opacity: 0;
  }
}

/* 为每个粒子生成随机位置 */
.particle:nth-child(1) { --random-x: 50px; left: 10%; }
.particle:nth-child(2) { --random-x: -30px; left: 20%; }
.particle:nth-child(3) { --random-x: 80px; left: 30%; }
.particle:nth-child(4) { --random-x: -50px; left: 40%; }
.particle:nth-child(5) { --random-x: 60px; left: 50%; }
.particle:nth-child(6) { --random-x: -40px; left: 60%; }
.particle:nth-child(7) { --random-x: 70px; left: 70%; }
.particle:nth-child(8) { --random-x: -60px; left: 80%; }
.particle:nth-child(9) { --random-x: 40px; left: 15%; }
.particle:nth-child(10) { --random-x: -70px; left: 25%; }
.particle:nth-child(11) { --random-x: 90px; left: 35%; }
.particle:nth-child(12) { --random-x: -20px; left: 45%; }
.particle:nth-child(13) { --random-x: 50px; left: 55%; }
.particle:nth-child(14) { --random-x: -80px; left: 65%; }
.particle:nth-child(15) { --random-x: 30px; left: 75%; }
.particle:nth-child(16) { --random-x: -50px; left: 85%; }
.particle:nth-child(17) { --random-x: 60px; left: 12%; }
.particle:nth-child(18) { --random-x: -40px; left: 22%; }
.particle:nth-child(19) { --random-x: 70px; left: 32%; }
.particle:nth-child(20) { --random-x: -30px; left: 42%; }

/* 光效扫过 */
.light-sweep {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 122, 255, 0.08),
    transparent
  );
  animation: sweep 8s ease-in-out infinite;
  transform: skewX(-20deg);
}

@keyframes sweep {
  0% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}

.floating-shapes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(0, 122, 255, 0.08);
  filter: blur(60px);
}

.shape-1 {
  width: 400px;
  height: 400px;
  top: -200px;
  right: -200px;
  animation: float-1 20s infinite ease-in-out;
}

.shape-2 {
  width: 300px;
  height: 300px;
  bottom: -150px;
  left: -150px;
  animation: float-2 25s infinite ease-in-out;
}

.shape-3 {
  width: 250px;
  height: 250px;
  top: 30%;
  left: 10%;
  animation: float-3 30s infinite ease-in-out;
}

.shape-4 {
  width: 200px;
  height: 200px;
  bottom: 20%;
  right: 15%;
  animation: float-4 22s infinite ease-in-out;
}

.shape-5 {
  width: 180px;
  height: 180px;
  top: 60%;
  right: 20%;
  animation: float-5 18s infinite ease-in-out;
}

.shape-6 {
  width: 220px;
  height: 220px;
  top: 15%;
  left: 5%;
  animation: float-6 24s infinite ease-in-out;
}

@keyframes float-5 {
  0%, 100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  50% {
    transform: translate(40px, -40px) scale(1.1) rotate(180deg);
  }
}

@keyframes float-6 {
  0%, 100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  50% {
    transform: translate(-40px, 40px) scale(1.15) rotate(-180deg);
  }
}

/* 渐变光晕 */
.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: orb-float 20s infinite ease-in-out;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(0, 122, 255, 0.12), transparent);
  top: 20%;
  left: 10%;
  animation-duration: 25s;
}

.orb-2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(175, 82, 222, 0.1), transparent);
  bottom: 25%;
  right: 12%;
  animation-duration: 30s;
  animation-delay: 5s;
}

.orb-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 45, 85, 0.08), transparent);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-duration: 22s;
  animation-delay: 10s;
}

@keyframes orb-float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.6;
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
    opacity: 0.8;
  }
  66% {
    transform: translate(-30px, 30px) scale(0.9);
    opacity: 0.7;
  }
}

@keyframes float-1 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-50px, 50px) scale(1.1);
  }
}

@keyframes float-2 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(50px, -50px) scale(1.15);
  }
}

@keyframes float-3 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, 30px) scale(1.2);
  }
}

@keyframes float-4 {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-30px, -30px) scale(1.1);
  }
}

/* 右侧登录表单 */
.login-right {
  flex: 0 0 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  background: #FFFFFF;
  position: relative;
  overflow: hidden;
}

.login-right::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #007AFF, #AF52DE, #FF2D55);
}

.login-card {
  width: 100%;
  max-width: 420px;
  animation: fadeInRight 0.8s ease-out;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.card-header {
  margin-bottom: 40px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  color: #1D1D1F;
  margin: 0 0 8px 0;
  letter-spacing: -0.8px;
}

.welcome-subtitle {
  font-size: 16px;
  color: #6E6E73;
  margin: 0;
  font-weight: 400;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1D1D1F;
  font-size: 14px;
}

.label-icon {
  width: 18px;
  height: 18px;
  color: #007AFF;
}

.input-container {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 16px 20px;
  border: 1.5px solid #D2D2D7;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #F5F5F7;
  color: #1D1D1F;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.form-input::placeholder {
  color: #86868B;
}

.form-input:focus {
  outline: none;
  border-color: #007AFF;
  background: #FFFFFF;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
  transform: translateY(-1px);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #edf2f7;
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #007AFF, #AF52DE);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.form-input:focus ~ .input-border {
  width: 100%;
}

.login-button {
  width: 100%;
  background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
  color: white;
  border: none;
  padding: 18px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.25);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  z-index: 2;
}

.button-arrow {
  width: 18px;
  height: 18px;
  transition: transform 0.3s ease;
}

.button-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 122, 255, 0.35);
  background: linear-gradient(135deg, #0051D5 0%, #007AFF 100%);
}

.login-button:hover:not(:disabled) .button-shine {
  left: 100%;
}

.login-button:hover:not(:disabled) .button-arrow {
  transform: translateX(4px);
}

.login-button:active:not(:disabled) {
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.button-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-alert {
  background: rgba(255, 45, 85, 0.1);
  color: #FF2D55;
  padding: 16px 20px;
  border-radius: 12px;
  font-size: 14px;
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(255, 45, 85, 0.2);
  box-shadow: 0 4px 12px rgba(255, 45, 85, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.alert-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.error-slide-enter-active,
.error-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.error-slide-enter-from,
.error-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .login-container {
    flex-direction: column;
  }
  
  .login-left {
    flex: 0 0 auto;
    min-height: auto;
    padding: 40px 30px;
  }
  
  .login-right {
    flex: 1;
    padding: 40px 30px;
  }
  
  .brand-title {
    font-size: 32px;
  }
  
  .features-list {
    gap: 16px;
  }
  
  .feature-item {
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .login-left {
    padding: 30px 20px;
  }
  
  .login-right {
    padding: 30px 20px;
  }
  
  .brand-title {
    font-size: 28px;
  }
  
  .brand-subtitle {
    font-size: 16px;
  }
  
  .welcome-title {
    font-size: 26px;
  }
  
  .logo-main {
    width: 64px;
    height: 64px;
  }
  
  .logo-main svg {
    width: 32px;
    height: 32px;
  }
  
  .feature-item {
    padding: 14px;
  }
  
  .feature-icon {
    width: 40px;
    height: 40px;
  }
  
  .form-input {
    padding: 14px 18px;
    font-size: 14px;
  }
  
  .login-button {
    padding: 16px 20px;
    font-size: 15px;
  }
}
</style>
