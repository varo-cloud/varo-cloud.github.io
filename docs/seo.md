# Varo.cloud 前端 SEO 方案说明

> 分支：`feat/seo`  
> 适用场景：Vue 3 + Vite SPA，部署在 GitHub Pages（静态托管，无 Node SSR）  
> 目标读者：产品 / 前端 / 需要了解「为什么这样改、能覆盖到什么程度」的同学

---

## 1. 背景与约束

| 约束 | 含义 |
|------|------|
| 技术栈 | Vue 3 + Vite 单页应用（CSR） |
| 部署 | GitHub Pages，只有静态文件，没有服务端渲染环境 |
| 业务诉求 | 新首页要可被搜索引擎与社交平台正确识别；全站营销页也要有基础 SEO |

传统 SPA 的问题：爬虫或社交预览抓到的往往是几乎空的 `index.html`（只有 `<div id="app">`），title / description / 正文都要等 JS 跑完才有。GitHub Pages 又跑不了 SSR，所以不能上 Nuxt 一类完整服务端方案。

---

## 2. 方案结论（一句话）

**全站补齐 SEO 基础设施（meta / canonical / hreflang / robots / sitemap / JSON-LD），所有无需登录的公开页做构建期预渲染（Playwright），在不改部署形态的前提下，让营销页首包 HTML 自带可索引内容。**

不是「整站 SSR」，也不是「只改一个页面的 meta」。

---

## 3. 为什么不全站 SSR / SSG？

| 方案 | 是否采纳 | 原因 |
|------|----------|------|
| 迁 Nuxt / 上 Node SSR | ❌ | 部署与架构成本过高，当前 Pages 托管不匹配 |
| 全站静态预渲染所有路由（含登录态、全部模型详情） | ❌ 暂不做 | 登录态页需 noindex；模型详情 path 过多 |
| **全站 Head 管理 + 公开页预渲染** | ✅ | 成本可控，覆盖营销入口收录与分享预览 |

优先级：**公开营销页预渲染 > 模型详情运行时 Head > 用户后台页 noindex。**

---

## 4. 整体架构

```text
用户 / 爬虫请求公开页
        │
        ▼
 GitHub Pages 静态文件
        │
        ├─ index.html / models/ / pricing/ / …  ← 构建期预渲染 HTML
        ├─ zh-CN/… 对应中文路由
        ├─ 404.html            ← SPA fallback（深链刷新仍可进 Vue Router）
        ├─ robots.txt
        └─ sitemap.xml

运行时（浏览器 / 能执行 JS 的爬虫）：
  App.vue → useRouteSeo() → @unhead/vue 按路由切换 title/OG/canonical/hreflang
  模型详情页额外按接口返回的 displayName / description 覆盖 Head
```

构建流水线顺序：

```text
vite build
  → spa-fallback：把原始 SPA shell 复制为 dist/404.html
  → prerender：用 Playwright 打开公开路由，把渲染结果写入
       dist/index.html、dist/models/index.html、dist/pricing/index.html …
       及对应 zh-CN/* 路径
```

> 必须先有 `404.html`，再覆盖各路由 HTML。否则预渲染服务没有 SPA shell 可回退，深链在预渲染阶段会失败。

---

## 5. 分层能力说明

### 5.1 全站 SEO 基础设施

| 能力 | 实现 | 说明 |
|------|------|------|
| 动态 Head | `@unhead/vue` + `useRouteSeo()` | 按路由名读写 title、description、robots、Open Graph、Twitter Card |
| 配置表 | `src/seo/config.ts` | 路由 → i18n key；站点 origin、默认 OG 图 |
| Canonical | 当前 path 绝对 URL | `https://varo.cloud/...` |
| 多语言 | `hreflang`: `en` / `zh-CN` / `x-default` | 与现有 locale 前缀路由一致 |
| 结构化数据 | 首页 JSON-LD | `Organization` + `WebSite` |
| 爬虫指引 | `public/robots.txt` | 允许公开页；禁止 auth / api-keys / billing / generations |
| 站点地图 | `public/sitemap.xml` | 首页、Models、Pricing、AI Generator、Docs、Terms、Privacy（含中英） |
| 隐私页策略 | 账号相关路由 `noindex, nofollow` | 避免后台页进入索引 |

覆盖路由示例：

- 可索引：`home`、`models`、`model-detail`、`pricing`、`ai-generator`、`docs`、`terms`、`privacy`
- 不索引：`auth`、`auth-callback`、`api-keys`、`billing`、`generations`

### 5.2 公开页预渲染（核心差异点）

脚本：`scripts/prerender.mjs`

流程概要：

1. 在 `dist` 上起本地静态服务（深链回退到 `404.html`）
2. Playwright Chromium 访问各公开路由（中英）
3. 等待页面 `[data-seo-ready="…"]` 挂载，并确认关键标题文案 / document.title
4. 再短暂等待 Head 写入后，导出完整 HTML 到对应目录

预渲染范围：

| 路由 | 预渲染 |
|------|--------|
| `/`、`/models`、`/pricing`、`/ai-generator`、`/docs`、`/terms`、`/privacy`（及 zh-CN） | ✅ |
| `/models/:slug` | ❌（slug 过多；运行时 Head + 详情加载后覆盖 title/description） |
| 需登录页 | ❌（noindex） |

固化进 HTML 的内容（SEO 主收益）：

- `<title>`、`<meta description>`、OG / Twitter、canonical、hreflang
- 各页静态营销正文（Hero、法律文案等）
- 首页 JSON-LD

### 5.3 与「动态内容」的关系（重要）

首页部分区块仍走接口，例如：

- Featured Models（facets + models）
- Pricing 表格行
- Showcase publishers

当前预渲染**不等待**这些接口完成；构建环境若也访问不到生产 API，这些区块在静态 HTML 里可能为空。

| 内容类型 | 是否依赖预渲染进源码 | 对 SEO 的作用 |
|----------|----------------------|---------------|
| Title / Description / H1 / 固定卖点文案 | ✅ 稳定固化 | **首页收录与分享预览的主信号** |
| 模型列表 / 价格行 / Publisher 封面 | ⚠️ 不保证进静态 HTML | 偏长尾与内容丰富度；用户侧仍正常 CSR 加载 |
| 其它营销页（Models / Pricing 等） | ✅ 预渲染静态壳 + Head | 列表等动态块不保证进 HTML |
| 模型详情 | 运行时 Head（加载后用 displayName） | 首包仍偏 CSR |

**结论：当前方案对「首页品牌词 + 主描述 + 社交卡片」有效；动态列表不是首页 SEO 生效的前提。**

---

## 6. 关键文件与脚本

| 路径 | 职责 |
|------|------|
| `src/seo/config.ts` | SEO 常量与路由定义 |
| `src/seo/useRouteSeo.ts` | 路由级 Head / JSON-LD |
| `src/App.vue` | 全局挂载 `useRouteSeo()` |
| `src/main.ts` | 注册 `@unhead/vue` |
| `index.html` | 首页 fallback meta（无 JS / 预渲染前也能有基础标签） |
| `public/robots.txt` | 爬虫规则 |
| `public/sitemap.xml` | 站点地图 |
| `scripts/prerender.mjs` | 构建期预渲染 |
| `package.json` | `finalize-dist` = `spa-fallback` + `prerender` |
| `.github/workflows/deploy-*.yml` | CI 安装 Playwright Chromium 后执行完整 build |

本地相关命令：

```bash
npm run build           # 含 finalize-dist（预渲染）
npm run spa-fallback    # cp dist/index.html → dist/404.html
npm run prerender       # 仅跑预渲染（需已有 dist）
```

---

## 7. 部署注意点（GitHub Pages）

1. **构建必须跑 Playwright**：CI 已增加 `npx playwright install --with-deps chromium`。
2. **产物顺序**：先 SPA shell → `404.html`，再预渲染覆盖首页 HTML。
3. **深链刷新**：非预渲染路径仍依赖 `404.html` 回退到 SPA，由 Vue Router 接管。
4. **中英首页**：英文 `/` 与中文 `/zh-CN/` 各自有独立预渲染文件。

---

## 8. 验收建议

部署或本地 `npm run build` 后：

1. 打开 `dist/index.html` 源码（不要只看浏览器渲染后的 DOM）
2. 确认至少包含：
   - 正确的 `<title>` / `meta description`
   - `og:title` / `og:description` / `canonical`
   - Hero 主标题等可见正文（非空壳 `#app`）
3. 用「查看网页源代码」或 `curl` 生产域名首页，对比是否与预渲染结果一致
4. 抽查：`/robots.txt`、`/sitemap.xml` 可访问
5. 回归：Models / Pricing / 模型详情深链、语言切换、登录后后台页不误伤

社交预览（可选）：用 Facebook / Twitter / LinkedIn 调试工具贴首页 URL，看 OG 卡片是否正确。

---

## 9. 已知边界与后续可选项

**已知边界**

- 预渲染覆盖公开固定路由，不含全部模型详情 slug
- 动态接口区块不保证进入静态 HTML
- 模型详情主要靠运行时 Head；首包正文仍偏 CSR
- OG 默认图当前为站点 logo，若要更好分享效果可换专用封面图

**可选增强（按需）**

1. 预渲染等待关键接口完成，或构建时注入模型/Publisher 快照，让动态块也进 HTML  
2. 模型详情做「热门 slug 列表」批量预渲染  
3. 将 sitemap 改为构建脚本根据公开路由自动生成  
4. Search Console 提交 sitemap，监控覆盖率与索引状态  

---

## 10. 对外沟通用摘要

> 我们在 **不改 GitHub Pages 静态部署** 的前提下，做了两件事：  
> 1）全站用 `@unhead/vue` 统一管理 title / description / OG / canonical / 中英 hreflang，并配上 robots + sitemap；  
> 2）构建时用 Playwright 把**无需登录的公开页**（中英）预渲染成真正带正文的 HTML。  
>
> 这样搜索引擎和社交平台打开这些页面的源码就能看到品牌与主卖点。  
> 列表等动态内容仍走接口；模型详情用运行时 Head（加载后用真实名称）。后续若要长尾详情页进索引，可再做热门 slug 批量预渲染。

---

## 附录：路由与索引策略速查

| 路由 | 预渲染 | 索引 |
|------|--------|------|
| `/`、`/models`、`/pricing`、`/ai-generator`、`/docs`、`/terms`、`/privacy`（及 zh-CN） | ✅ | ✅ |
| `/models/:slug` | ❌（运行时 Head） | ✅ |
| `/auth`、`/api-keys`、`/billing`、`/generations` | ❌ | ❌（robots + noindex） |
