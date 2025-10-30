# 登录系统集成说明

## 概述

已为迅排设计项目成功集成了完整的登录认证系统，支持与新后端（48080端口）的认证API对接。

## 功能特性

- ✅ 现代化登录界面设计
- ✅ 基于Pinia的状态管理
- ✅ 路由守卫保护
- ✅ Token自动管理
- ✅ 响应式设计
- ✅ TypeScript支持
- ✅ 错误处理机制

## 文件结构

```
src/
├── views/
│   └── Login.vue              # 登录页面组件
├── api/
│   └── auth.ts                # 认证API接口
├── store/
│   └── auth.ts                # 认证状态管理
└── router/
    ├── base.ts                # 路由配置（已更新）
    └── hook.ts                # 路由守卫（已更新）
```

## 使用方法

### 1. 启动项目

```bash
npm run dev
```

### 2. 访问登录页面

打开浏览器访问：`http://localhost:3000/login`

### 3. 测试登录功能

可以使用提供的测试页面 `login-test.html` 来测试API接口：

```bash
# 在浏览器中打开
open login-test.html
```

## API接口

### 登录接口
- **URL**: `POST /system/auth/login`
- **参数**: `{ username: string, password: string }`
- **Headers**: `tenant-id: 1`
- **返回**: `{ code: number, data: { accessToken: string, user: User }, msg?: string }`

### 获取用户信息
- **URL**: `GET /system/auth/get-permission-info`
- **Headers**: `Authorization: Bearer <token>`, `tenant-id: 1`
- **返回**: `{ code: number, data: User }`

### 登出接口
- **URL**: `POST /system/auth/logout`
- **Headers**: `Authorization: Bearer <token>`, `tenant-id: 1`

### 刷新Token
- **URL**: `POST /system/auth/refresh-token`
- **Headers**: `Authorization: Bearer <token>`, `tenant-id: 1`

## 路由保护

所有主要页面（`/home`, `/draw`, `/html`, `/psd`）都已添加认证保护：

- 未登录用户访问受保护页面会自动跳转到 `/login`
- 已登录用户访问登录页会自动跳转到首页 `/`

## 状态管理

使用Pinia store管理认证状态：

```typescript
import { useAuthStore } from '@/store'

const authStore = useAuthStore()

// 登录
await authStore.loginAction(username, password)

// 登出
await authStore.logoutAction()

// 检查登录状态
const isLoggedIn = authStore.isLoggedIn
const currentUser = authStore.currentUser
```

## 配置说明

### 后端API地址
在 `src/api/auth.ts` 中配置：
```typescript
const API_BASE_URL = 'http://localhost:48080/admin-api'
```

### Token存储
Token自动保存到 `localStorage` 的 `xp_token` 键中。

## 样式特性

登录页面采用现代化设计：
- 渐变背景
- 卡片式布局
- 响应式设计
- 加载状态指示
- 错误信息显示

## 测试账号

请确保后端服务运行在 `http://localhost:48080`，并使用有效的测试账号进行登录测试。

## 注意事项

1. 确保后端服务正常运行
2. 检查CORS配置允许前端域名访问
3. Token过期会自动清除并跳转到登录页
4. 所有API请求都包含错误处理机制

## 故障排除

### 常见问题

1. **登录失败**: 检查后端服务是否运行，API地址是否正确
2. **CORS错误**: 确保后端配置了正确的CORS策略
3. **Token无效**: 检查Token格式和有效期
4. **路由跳转问题**: 检查路由配置和守卫逻辑

### 调试方法

1. 打开浏览器开发者工具查看网络请求
2. 检查localStorage中的token状态
3. 查看控制台错误信息
4. 使用测试页面验证API接口
