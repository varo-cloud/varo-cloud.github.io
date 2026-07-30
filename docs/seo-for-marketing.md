# Varo.cloud SEO 已覆盖页面（给市场）

面向市场同学：哪些公开页已做 SEO / 预渲染，以及如何查看 HTML 源码来设计关键词与文案。

公开营销页已做预渲染：搜索引擎与社交抓取打开 URL 时，**HTML 源码里就有 title、description、H1 和正文**，不必等 JS 执行。

### 环境地址

| 环境 | 站点根地址 | 说明 |
|------|------------|------|
| 生产 | https://varo.cloud | 正式站，关键词验收以这里为准 |
| 测试 | https://varo-staging.github.io | 发版前 / 联调预览，路径与生产一致 |

路径规则：生产与测试仅域名不同。例如生产 `https://varo.cloud/models` ↔ 测试 `https://varo-staging.github.io/models`。

---

## 1. 建议优先做关键词的页面（已预渲染 + 可收录）

| 页面 | 生产 EN | 生产 中文 | 测试 EN | 测试 中文 | 当前 Title（EN） | 当前 Title（中文） |
|------|---------|-----------|---------|-----------|------------------|-------------------|
| 首页 | https://varo.cloud/ | https://varo.cloud/zh-CN | https://varo-staging.github.io/ | https://varo-staging.github.io/zh-CN | Varo.cloud — The Generative AI Cloud for Creators | Varo.cloud — 面向创作者的生成式 AI 云 |
| 模型库 | https://varo.cloud/models | https://varo.cloud/zh-CN/models | https://varo-staging.github.io/models | https://varo-staging.github.io/zh-CN/models | AI Models — Varo.cloud | AI 模型 — Varo.cloud |
| 价格 | https://varo.cloud/pricing | https://varo.cloud/zh-CN/pricing | https://varo-staging.github.io/pricing | https://varo-staging.github.io/zh-CN/pricing | Pricing — Varo.cloud | 价格 — Varo.cloud |
| 开发者 | https://varo.cloud/developers | https://varo.cloud/zh-CN/developers | https://varo-staging.github.io/developers | https://varo-staging.github.io/zh-CN/developers | Developers — Varo.cloud API for Top AI Models | 开发者 — Varo.cloud 顶尖 AI 模型 API |
| AI 生成器 | https://varo.cloud/ai-generator | https://varo.cloud/zh-CN/ai-generator | https://varo-staging.github.io/ai-generator | https://varo-staging.github.io/zh-CN/ai-generator | AI Generator — Varo.cloud | AI 生成器 — Varo.cloud |
| 文档 | https://varo.cloud/docs | https://varo.cloud/zh-CN/docs | https://varo-staging.github.io/docs | https://varo-staging.github.io/zh-CN/docs | Documentation — Varo.cloud | 文档 — Varo.cloud |
| 服务条款 | https://varo.cloud/terms | https://varo.cloud/zh-CN/terms | https://varo-staging.github.io/terms | https://varo-staging.github.io/zh-CN/terms | Terms of Service — Varo.cloud | 服务条款 — Varo.cloud |
| 隐私政策 | https://varo.cloud/privacy | https://varo.cloud/zh-CN/privacy | https://varo-staging.github.io/privacy | https://varo-staging.github.io/zh-CN/privacy | Privacy Policy — Varo.cloud | 隐私政策 — Varo.cloud |

### 当前 Description 参考

发版后以各页「查看网页源代码」为准；下列为撰写时的参考文案。

| 页面 | 语言 | Description |
|------|------|-------------|
| 首页 | EN | Access leading generative AI models in one cloud — image, video, audio, and language — with production APIs, creator tools, and cost-efficient pricing. |
| 首页 | 中文 | 在一个云中接入领先的生成式 AI 模型——图像、视频、音频与语言——提供生产级 API、创作者工具与高性价比计费。 |
| 模型库 | EN | Browse production-ready video, image, audio, and language models on Varo.cloud with unified pricing and APIs. |
| 模型库 | 中文 | 在 Varo.cloud 浏览可用于生产的视频、图像、音频与语言模型，统一计费与 API。 |
| 价格 | EN | Simple, transparent pay-as-you-go pricing for every AI model on Varo.cloud—only pay for what you use. |
| 价格 | 中文 | Varo.cloud 提供简单透明的按量计费，所有 AI 模型只用多少付多少。 |
| 开发者 | EN | Build with one OpenAI-compatible API for the world’s leading AI models. Get started with Varo.cloud authentication, generations, and code examples. |
| 开发者 | 中文 | 用一套兼容 OpenAI 的 API 接入全球领先 AI 模型。从身份验证、生成任务到代码示例，快速开始使用 Varo.cloud。 |
| AI 生成器 | EN | Generate images, video, and more with Varo.cloud AI models — no infrastructure setup. |
| AI 生成器 | 中文 | 使用 Varo.cloud AI 模型生成图像、视频等内容——无需自建基础设施。 |
| 文档 | EN | API documentation and guides for integrating Varo.cloud generative AI models. |
| 文档 | 中文 | Varo.cloud 生成式 AI 模型接入文档与指南。 |
| 服务条款 | EN / 中文 | Varo.cloud terms of service. / Varo.cloud 服务条款。 |
| 隐私政策 | EN / 中文 | Varo.cloud privacy policy. / Varo.cloud 隐私政策。 |

---

## 2. 暂不需要市场做关键词的页面

| 类型 | 说明 |
|------|------|
| 登录 / API Keys / 账单 / 生成历史 | 已配置 **noindex**，不收录 |
| 单个模型详情（如 `/models/xxx`） | 有运行时 title，但**未做预渲染**；海量动态页，暂不作为固定关键词主战场 |

---

## 3. 如何查看 HTML（设计关键词用）

**重要：** 不要只看浏览器渲染后的页面（F12 Elements）。要看**服务器返回的原始 HTML 源码**——那才是爬虫 / 分享预览真正读到的内容。

发版前可先在**测试环境**核对；对外关键词与收录验收以**生产环境**为准。

### 方法 A：浏览器「查看网页源代码」（推荐）

1. 用 Chrome / Edge 打开上表某个 URL（建议直接打开该链接，不要从站内点过去再看）
2. 右键页面空白处 → **查看网页源代码**（快捷键：Mac `⌥⌘U` / Windows `Ctrl+U`）
3. 用 `Ctrl/Cmd + F` 搜索下列字段，对照设计关键词：

| 字段 | 在源码里搜什么 | 市场要关注什么 |
|------|----------------|----------------|
| 页面标题 | `<title>` | 核心关键词 + 品牌，约 50–60 字符 |
| 摘要描述 | `name="description"` | 补充关键词与卖点，约 120–160 字符 |
| 主标题 | `<h1` | 与 title 语义一致，可略展开 |
| 正文 | 页面可见大段文案 | 自然覆盖目标词，避免堆砌 |
| 分享标题 / 描述 | `og:title` / `og:description` | 微信、X、LinkedIn 等分享卡片文案 |
| 正版 URL | `rel="canonical"` | 确认收录指向正确地址（测试站应指向 `varo-staging.github.io`，生产站应指向 `varo.cloud`） |

4. 中英文各看一遍（`/` 与 `/zh-CN/...`），两套文案可分开做关键词策略。

### 方法 B：用命令行直接拉源码（可选）

生产：

```bash
curl -sL "https://varo.cloud/models" | head -n 80
```

测试：

```bash
curl -sL "https://varo-staging.github.io/models" | head -n 80
```

只看关键字段（域名换成对应环境即可）：

```bash
curl -sL "https://varo.cloud/models" | grep -E '<title>|description|canonical|og:title|og:description|<h1'
curl -sL "https://varo-staging.github.io/models" | grep -E '<title>|description|canonical|og:title|og:description|<h1'
```

### 方法 C：从 sitemap 扫全站公开页

| 环境 | sitemap |
|------|---------|
| 生产 | https://varo.cloud/sitemap.xml |
| 测试 | https://varo-staging.github.io/sitemap.xml |

里面列出了全部可索引 URL（含中英文），可逐个按方法 A 查看。

---

## 4. 市场交付建议（回传给产品 / 前端改文案）

按页给一张表即可，例如：

| URL | 建议 Title | 建议 Description | 建议 H1 | 目标关键词 |
|-----|------------|------------------|---------|------------|
| /models | … | … | … | AI 模型、视频生成模型… |

改完后由前端更新多语言文案并重新发版；发版后请市场再用「查看网页源代码」确认新文案已进 HTML（可先测测试站，再验生产站）。

---

## 相关文档

- 技术方案与验收说明：[seo.md](./seo.md)
