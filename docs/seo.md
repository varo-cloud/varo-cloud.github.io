# SPA 静态托管场景下的 SEO 实践（通用方法）

## 1. 问题与约束

| 约束 | 含义 |
|------|------|
| 技术栈 | 前端 SPA（CSR），如 Vue/React + Vite |
| 部署 | 纯静态托管（无 Node SSR） |
| 目标 | 搜索引擎与社交预览能读到正确的 title / description / 正文 |

传统 SPA 的痛点：爬虫或社交抓取器拿到的往往是几乎空的壳 HTML；静态托管又跑不了完整 SSR。

---

## 2. 方案一句话

**全站补齐 SEO 基础设施（meta / canonical / hreflang / robots / sitemap / JSON-LD），对无需登录的公开页做构建期预渲染，在不改部署形态的前提下，让营销页首包 HTML 自带可索引内容。**

不是整站 SSR，也不是「只改几个 meta」。

---

## 3. 为什么不全站 SSR / SSG？

| 方案 | 是否采纳 | 原因 |
|------|----------|------|
| 迁框架上 SSR | 通常否 | 部署与架构成本高，静态托管不匹配 |
| 预渲染所有路由（含登录态、海量动态详情） | 暂不做 | 登录页应 noindex；动态 path 过多 |
| **全站 Head 管理 + 公开页预渲染** | 推荐 | 成本可控，覆盖收录与分享预览 |

优先级建议：

**公开营销页预渲染 > 动态详情运行时 Head > 用户后台 noindex**

---

## 4. 整体架构

```text
用户 / 爬虫请求公开页
        │
        ▼
 静态托管产物
        │
        ├─ 各公开路由的预渲染 HTML（path.html）
        ├─ 404.html（SPA fallback，深链刷新仍进 Router）
        ├─ robots.txt
        └─ sitemap.xml

运行时（浏览器 / 能执行 JS 的爬虫）：
  全局 Head 管理 → 按路由切换 title / OG / canonical / hreflang
  动态详情页可按接口数据覆盖 Head
```

构建顺序：

```text
vite/webpack build
  → 把 SPA shell 复制为 404.html（深链回退）
  → Playwright 打开公开路由，把渲染结果写入对应 HTML
```

> 预渲染产物建议用 `path.html` 而不是 `path/index.html`，避免部分静态托管对尾斜杠做 301。

---

## 5. 分层能力

### 5.1 全站 SEO 基础设施

| 能力 | 做法 |
|------|------|
| 动态 Head | 统一 Head 库（如 `@unhead/vue` / `react-helmet-async`）+ 路由级配置 |
| 配置表 | 路由 → title/description（可走 i18n）；站点 origin、默认 OG 图 |
| Canonical | 当前 path 的绝对 URL |
| 多语言 | `hreflang`（各 locale + `x-default`），与 locale 前缀路由一致 |
| 结构化数据 | 首页 JSON-LD（如 `Organization` + `WebSite`） |
| 爬虫指引 | `robots.txt`：允许公开页，禁止登录/账号相关路径 |
| 站点地图 | `sitemap.xml`：公开页 + 多语言 alternate |
| 隐私策略 | 账号相关路由 `noindex, nofollow` |

### 5.2 公开页预渲染（核心）

流程：

1. 在 `dist` 上起本地静态服务（未匹配路径回退到 SPA shell）
2. Headless 浏览器访问各公开路由（含各语言）
3. 等待页面就绪标记（如 `data-seo-ready`），并确认关键标题 / `document.title`
4. 若有动态列表，再等 `data-seo-content-ready`（成功/空/失败都置位，避免死等）
5. 短等 Head 刷入后，导出完整 HTML

就绪信号建议分两层：

- **壳就绪**：静态 Hero / 文案已挂载
- **内容就绪**：首段 API 列表加载结束（成功/空/失败都置位，避免死等）

预渲染时若页面会请求 API，可用 Node 侧代理转发，避免 `127.0.0.1` 浏览器 CORS。

### 5.3 动态内容怎么处理

| 内容类型 | 是否进静态 HTML | 作用 |
|----------|-----------------|------|
| Title / Description / H1 / 固定文案 | 稳定固化 | 收录与分享预览的主信号 |
| 列表等接口数据 | 接口可达时写入 | 丰富正文；失败时可能为空 |
| 海量动态详情页 | 运行时 Head 即可 | 首包仍偏 CSR；热门 slug 可后续批量预渲染 |

---

## 6. 推荐目录与职责（可套用）

| 模块 | 职责 |
|------|------|
| `seo/config` | 常量、路由 → SEO 定义、绝对 URL |
| `seo/useRouteSeo`（或等价） | 路由级 Head / JSON-LD |
| 根组件挂载 | 全局启用路由 SEO |
| `index.html` | 无 JS / 预渲染前的 fallback meta |
| `public/robots.txt` | 爬虫规则 |
| `public/sitemap.xml` | 站点地图（可后续改为构建生成） |
| `scripts/prerender` | 构建期预渲染 |
| CI | 安装 Chromium 后跑完整 build |

---

## 7. 静态托管注意点

1. CI 必须能跑 Headless 浏览器（如 Playwright Chromium）
2. 产物顺序：先 SPA shell → `404.html`，再预渲染覆盖各路由 HTML
3. 未预渲染的深链仍依赖 `404.html` 回退到 SPA
4. 多语言首页各自独立预渲染文件
5. `SITE_ORIGIN` 按环境区分；OG 图用绝对 URL，且用 JPEG/PNG（约 1200×630），SVG 常被社交平台忽略

---

## 8. 验收清单

1. 打开构建产物 HTML **源码**（不要只看渲染后 DOM）
2. 确认含：title、description、OG、canonical、可见正文（非空壳）
3. 用 `curl` 或「查看网页源代码」对生产 URL 再验一次
4. 抽查 `/robots.txt`、`/sitemap.xml`
5. 回归：深链、语言切换、登录后后台页不被误索引
6. 可选：用各平台调试工具贴 URL，验 OG 卡片

预渲染时若动态列表为 0 条或等待超时，会汇总后通过 `LARK_WEBHOOK_URL` 发飞书告警；**不影响构建成功**。未配置该变量时仅打日志。

---

## 9. 已知边界与可选增强

**边界**

- 预渲染覆盖固定公开路由，不含全部动态详情
- 动态接口块不保证一定进入静态 HTML；异常靠飞书告警提示，不阻断部署
- 动态详情主要靠运行时 Head

**可选增强**

1. 热门动态 path 批量预渲染
2. 构建时注入数据快照，减少对线上 API 的依赖
3. sitemap 由构建脚本按公开路由自动生成
4. Search Console 提交 sitemap，监控覆盖率

---

## 10. 对外一句话版

> 在**不改静态托管**的前提下：
> 1）全站统一管理 title / description / OG / canonical / 多语言 hreflang，并配 robots + sitemap；
> 2）构建时用 Headless 浏览器把**无需登录的公开页**预渲染成带正文的 HTML。
>
> 搜索引擎和社交平台打开源码即可看到品牌与主卖点；动态列表尽量在构建时抓进 HTML；海量详情页用运行时 Head，后续可对热门 path 再做批量预渲染。

---

## 附录：索引策略模板

| 页面类型 | 预渲染 | 索引 |
|----------|--------|------|
| 公开营销 / 文档 / 法律页（各语言） | ✅ | ✅ |
| 海量动态详情 | ❌（运行时 Head）或热门批量 | ✅ |
| 登录 / 账号后台 | ❌ | ❌（robots + noindex） |
