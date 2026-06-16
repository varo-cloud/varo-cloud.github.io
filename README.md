# AI Video Platform — Frontend

Vue 3 + TypeScript + Vite 前端工程骨架，对齐 V1 产品信息架构（Models / Playground / API Keys / Billing 等）。

## 技术栈

- Vue 3 + TypeScript + Vite
- Naive UI — 组件库
- UnoCSS — 响应式原子化样式
- Vue Router — 路由
- Pinia — 状态管理
- vue-i18n — 多语言（默认 en-US，支持 zh-CN）
- Axios — HTTP 请求
- vite-plugin-mock + mockjs — 本地 Mock API

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认开启 Mock）
npm run dev

# 构建
npm run build
```

## 环境变量

`.env.development`:

| 变量 | 说明 |
|---|---|
| `VITE_USE_MOCK=true` | 开发环境启用本地 Mock |
| `VITE_API_BASE_URL=/api` | API 基础路径 |

## 路由清单

| 路径 | 页面 | 需登录 |
|---|---|---|
| `/` | Models 首页 | 否 |
| `/models/:id` | 模型详情 + Playground 占位 | 否 |
| `/api-keys` | API Keys 管理 | 是 |
| `/billing` | Billing 账单 | 是 |
| `/docs` | 文档占位 | 否 |
| `/auth` | 登录 / 注册 Tab | 否 |
| `/terms` | Terms of Service | 否 |
| `/privacy` | Privacy Policy | 否 |

未登录访问 `/api-keys`、`/billing` 会跳转 `/auth?redirect=...`。

## Mock API

开发环境下 `mock/` 目录提供以下接口：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/models` | 模型列表 |
| GET | `/api/models/:id` | 模型详情 |
| GET | `/api/user/profile` | 用户信息 + 余额 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/register` | 注册 |
| GET | `/api/api-keys` | API Key 列表 |
| POST | `/api/api-keys` | 创建 API Key |
| DELETE | `/api/api-keys/:id` | 删除 API Key |
| GET | `/api/billing/balance` | 余额 |
| GET | `/api/billing/transactions` | 流水 |

Mock 登录后 Header 会显示余额（需先调用 profile 接口，登录态 token 存于 localStorage）。

## 目录结构

```
src/
├── api/          # HTTP 请求封装
├── components/   # 公共组件与 Layout
├── i18n/         # 多语言
├── router/       # 路由与守卫
├── stores/       # Pinia 状态
├── styles/       # 全局样式
├── types/        # TypeScript 类型
└── views/        # 页面（当前为占位）
mock/             # 本地 Mock 数据
```

## 响应式

- 桌面（≥768px）：顶部横向导航
- 移动端（<768px）：汉堡菜单 + 侧边 Drawer 导航

## 多语言

Header 右上角可切换 English / 中文，选择会写入 `localStorage` 的 `locale` 键。
