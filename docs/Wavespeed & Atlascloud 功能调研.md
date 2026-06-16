# Wavespeed \& Atlascloud 功能调研

产品链接：

[wavespeed](https://wavespeed.ai/)

[atlascloud](https://www.atlascloud.ai/zh)

# 产品介绍

## 1\.1 Atlas Cloud

[Atlas Cloud](https://www.atlascloud.ai/zh) 是一个专为 AI 开发者和创意工作者打造的**全模态 AI 推理平台**，它通过统一且兼容 OpenAI 的 API 接口，聚合了全球 300 多款顶尖的视频生成、图像生成和大语言模型（LLM），提供高吞吐、低延迟且极具性价比的生产级生成式 AI 基础设施。

🚀 核心优势

- **统一的全模态 API：** 屏蔽了底层基础设施的复杂性，将视频、图像、语言、音频等多种模态的 AI 能力整合进一个生产级接口。

- **OpenAI API 100% 兼容：** 兼容 OpenAI 的端点。如果团队之前使用的是 OpenAI SDK，只需替换 `base URL` 和 `API Key` 即可无缝迁移，是极佳的低成本替代方案。

- **首日同步（Day 0 接入）：** 平台承诺业界最新的前沿开源或闭源模型上线时，能够做到“零日同步”接入，确保开发者始终能用上最新技术。

- **高性价比（按量付费）：** 采用无月消费、无席位费的纯按量（按秒或按 Token）计费模式，官方宣称其 API 价格始终低于同赛道的 `kie.ai` 和 `fal.ai`。



## 1\.2 WaveSpeed

WaveSpeedAI 是一个一站式多模态 AI 推理平台。它致力于打破不同大模型厂商之间的壁垒，为开发者、创作者及企业提供一个统一的接口，让他们能够无需复杂配置，直接在浏览器中试用或通过 API 整合来自全球顶级厂商的 1,000 多款图像、视频、音频和 3D AI 模型（如字节跳动的 Seedance、谷歌的 Veo、阿里巴巴的 Wan 等）。

🚀 核心优势

- **统一的生态体验（One API \& One Billing）**

只需**一个 API 密钥和统一的账单账户**，即可调用来自 ByteDance、Google、Alibaba、OpenAI、快手等不同供应商的所有模型，免去了在多个平台分别注册、绑定信用卡和管理多套 API 密钥的繁琐流程。

- **海量且前沿的模型库（1,000\+ Models）**

平台聚合了超过 1,000 款顶尖模型，涵盖文生图/图生图（如 GPT Image 2、Flux）、文生视频/图生视频（如 Vidu Q3 Pro、Kling 3\.0、Wan 2\.7）、数字人（InfiniteTalk）、3D 资产生成、音频合成以及 1,000 多种 LoRA 变体。

- **企业级的高性能表现（No Coldstarts）**

官方承诺提供全托管的 REST 推理 API，具备优秀的性能表现且**无冷启动延迟**，非常适合直接嵌入生产环境中进行无缝集成。

- **高可预测性的灵活计费**

计费按单次输出结果（Output）收费，而不是按计算时间收费，且在点击生成前会实时根据分辨率、时长等参数预览成本，让企业和开发者的成本控制更加清晰和可预测。

- **即开即用的工作流（Zero Setup）**

无论是无需代码的浏览器内 Playground 交互式体验，还是自动生成的多语言（Python / JavaScript / cURL）代码示例，都极大地降低了多模型交叉工作流（例如：生成图像 ➔ 视频化 ➔ 超分辨率放大）的搭建门槛。



# 竞品详情

## 2\.1 调研功能一：Explore页面

确认的问题：

1. 目前只接入视频生成模型，那么接入是否只接入byte dance一家的模型？

    1. 模型不多，很多功能可以先不做，比如过滤，搜索

2. 模型的定价？预留？可配置

|**产品名称**|[wavespeed](https://wavespeed.ai/)|[atlascloud](https://www.atlascloud.ai/zh)|
|---|---|---|
|**功能说明**|1. 多维度的模型浏览与分类过滤<br>2. 快捷的模型搜索与发现<br>3. 透明的单次运行计费预览<br>4. 直达网页端测试（Playground）与 API 集成入口|和wavespeed差不多<br>|
|**图示**|![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=YjVmMTllMjIwMDZiZDRhODA1ZWJmZDU3YTNlZjcwZGNfOTlmNTZkMzFlMGQwZmU2NmZiYzg0MmU5NTA3YzhmNjBfSUQ6NzY1MDcxOTU4MzYwNjcyMjA3Ml8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=YTU3MzBmZjUzZWZmYjg1NDJlZDk2MTZlZDE0Y2IzNmNfYWIzM2FhZjc3YmEzNGM0YzYyMTg1OTZjZmZkNjA5OGNfSUQ6NzY1MDcxOTg0NTU5NTU2NTU5Ml8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>|![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=ZTFjYzMzM2QyOTE4NGI2YTI3NzQzMjAwMmQxYWJmMmZfMTJlOTEyOWU5NGNhMTEyMDBkMjRkNDgyZWE1YTVkNzJfSUQ6NzY1MDc5MjIwMjgxMzA1MDM5Ml8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>|

## 2\.2 调研功能二：模型详情页面

待确认的问题：

1. mvp版本是不是可以不支持通过api调用？让用户在网页上试用即可

|**产品名称**|[wavespeed](https://wavespeed.ai/)|[atlascloud](https://www.atlascloud.ai/zh)|
|---|---|---|
|**功能说明**|1. 在线沙盒测试（Playground）： <br>    1. 页面左侧提供了一个可视化的交互表单，用户可以直接在浏览器中输入文本提示词（Prompt），并调整视频宽高比（如 16:9, 9:16 等）、分辨率（480p, 720p, 1080p）以及视频时长（4\-15秒）。同时支持上传参考图像、视频或音频来辅助生成，点击“Generate”即可直接在网页右侧预览生成的音画同步视频。<br>    2. 表单形式的测试，还支持提示词优化<br>    3. 除了交互表单，还有json, python, http, nodejs的模拟<br>![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=YzM1ZDdkMTk3YTgzZjY1YzllNWFlZmY1NWJlY2NjN2VfNzNlOGE1NmFlYjI1Y2UyMzhmYzAzM2YzYWNmZmNmMmVfSUQ6NzY1MDc5OTMxNTEwNzA0MDc5NF8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>2. 一键开发者集成（API 标签页）： <br>    1. 为开发者提供了即开即用的 REST API 调用指南。页面会自动**根据用户在表单中配置的参数，实时生成支持 cURL、Node\.js 和 Python 的代码示例，**方便开发者将该视频生成能力快速接入到自己的应用程序中。<br>![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=OTgwNzg5YjFiZTY3YTA0ZjFiYmU3M2JmMDdmNzI0NTdfNGNlZjAxYjY1NzI5NWEzMDk1OGZmOTM2NTdkNmJhNDRfSUQ6NzY1MDc5OTcwMjI4MzI1OTQxOF8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>3. 实时、透明的费用预估： <br>    1. 页面提供了清晰的计费透明度。该模型的基准价格为每 5 秒视频（480p）$0\.60。在 Playground 中，**系统会根据用户当前选择的分辨率和时长，在“Generate”按钮上实时显示本次生成的精确费用**（当前页面显示正享受 15% 的折扣优惠，单次运行约为 $1\.02）。<br>![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=N2MwMDY0M2UyMTllN2IyMTgyZGNjZjA0ZGRhNjc1MjhfMTZiYTM4ZmVjMjY1ZjBlNjQzNDM2YmJkMTU0ZTVlN2ZfSUQ6NzY1MDc5OTQ0ODI1Njc5NDEzNV8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>4. 详细的模型文档（README）与常见问题解答： <br>    1. 页面下方附带了完整的技术文档，详细介绍了 Seedance 2\.0 的核心特性（如好莱坞级电影感、原生音画同步、导演级相机控制等）、详细的参数说明、无/有参考视频时的具体计费规则、最佳应用场景（如广告、MV、概念样片制作）以及常见问题 FAQ。<br>![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=NjRhYWU4ODM0MGIzMjAyNTVlMGRiNGM1ZDdiNjQ5ZDFfMzVhNWM4ZmJiMjczMjJiZTA3MWM0ZmEwNDg3NmQwZjlfSUQ6NzY1MDc5ODg1NTU0NTQ3NDU4Nl8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>5. 创意灵感与相关模型推荐： <br>    1. 页面展示了多个高质量的官方生成示例和提示词参考，帮助用户寻找灵感<br>    2. 底部还关联推荐了字节跳动同系列的其他模型（如 Seedance 2\.0 Image\-to\-Video 图生视频、视频编辑、以及更低成本的 Fast 加速版本）<br>![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=ODI0MTA4MjE0MDkyNTkxOGJmNWM0NDI3ZTFlYWFjYWFfOTU5YTM0Y2YxYjIxNzQzYWVlOGQ4NmQ3NjMxZjVjNDNfSUQ6NzY1MDc5ODk3MTY4MTc3MTAzMV8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>6. 当前模型下的生成历史<br>![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=ZGY0YTE5MThhOTllOWRiNzMyYWExY2RmYTI2NzFiZjJfYzNhMzhhNGUzNjJlNjUyNGE1YTcwMzYwZjAyZGRiNjZfSUQ6NzY1MDgwMDM5OTQ4OTk2MTQ5NV8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)|同wavespeed<br>![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=NjI3NjRkMTMzYmUzNjhmMjIwMmFjM2NiYjdkOWY1OThfMDVmNTk2YjI2NDc2NDA1ZjJmYzYzMjM3MDk0ZjFmNjFfSUQ6NzY1MTA2ODc2NDE4MTEyMjU4NF8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>|

## 2\.3 调研功能三：AI Generator页面

和模型详情页面的playground页差不多，只不过AI Generator页面从模型类型的维度聚合了各个模型，算一个统一的入口。

|**产品名称**|[wavespeed](https://wavespeed.ai/)|[atlascloud](https://www.atlascloud.ai/zh)|
|---|---|---|
|**功能说明**|按模型类型的不同聚合各个模型，提供统一的playground<br>![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=YWRlZGVkZThmN2MwOWUyNDhkYzY5ZTZkZjhjOGFiZGVfMDQ2MjkyN2U2MzcyMGY1ZWJlZWViNDc4YWI2YWM4OTRfSUQ6NzY1MTA3MzkwNTI1NTMwNDcyN18xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)|atlas没有这个页面，模型的试用统一使用模型详情页<br>|

## 2\.4 调研功能四：API keys页面

待确认的问题：

1. 初始是否赠送免费的额度，比如$1 ？

|**产品名称**|[wavespeed](https://wavespeed.ai/)|[atlascloud](https://www.atlascloud.ai/zh)|
|---|---|---|
|**功能说明**<br>|1. **创建新 API 密钥 \(Create Key\)**<br>2. **密钥首次展示与复制 \(Copy and Save\)**<br>    - 页面中间会弹出一个高亮提示区域，展示刚生成完整的 API 密钥字符串（如以 `wsk_live_` 开头的密钥）。<br>    - **重要安全提示：** 页面明确警告该密钥**仅显示一次**，关闭页面或刷新后将无法再次查看完整内容。<br>    - 提供一键 **\[Copy key\]**（复制密钥）功能，方便用户安全备份，确认保存后可点击 **\[Confirm\]**。<br>3. **API 密钥列表与监控表格**<br>页面下方通过表格形式列出了当前账户下所有的 API 密钥及其使用状态<br>- **Name（名称）：** 区分不同的密钥（例如图中的 “test”）。<br>- **Key（密钥）：** 处于安全考虑，仅脱敏显示后几位字符（如 `******BneyZM`）。<br>- **Created（创建时间）：** <br>- **Status（状态）：** 显示当前密钥是否可用（如 **Active** 激活状态）。<br>- **Total calls \& Spend（调用次数与消耗）：** 实时统计该密钥累计调用的总次数以及产生的使用账单金额（美金）。<br>- **Last used（最后使用时间）：** 监控密钥最近一次被 API 调用的时间。<br>- **Actions（操作）：** 允许用户对密钥进行管理（如点击垃圾桶图标删除/作废密钥）。<br>4. **辅助导航功能**<br>    - 页面右上角提供了 **\[How to use API key?\]** 的帮助文档链接<br>https://wavespeed\.ai/docs/docs\-authentication<br>![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=YjZhODI2MmZmYTE4Mjg3ODM1MTlhOWU4ZWI3YjUxMDZfMWIzZTY1ZjJjM2RiYzc4MjgwYzI1YjUxM2NhYzViZTVfSUQ6NzY1MTA3NTQ2MDY1ODY0NjU1MV8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>|![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=YThkMjk3ZmM5N2Y2MGM0ZTQxZGFlNzBlMGY2Mjg4ZTBfN2NiMmVmZTBhY2E5N2I3NDVhMTgwMWRjNjBmODMzOTdfSUQ6NzY1MTA4MDM4Njg4NTI3NTE2Ml8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=NjdhMGYyNWQwODc5NGFmNmQ4Mjg0NzVhYTg1OWQyYTJfODBkZWYzZDM3ODFlYTdiYzBjMzg3Y2YzZGMwZjNmZjRfSUQ6NzY1MTA4MDYyNzQxMTg5Nzg3OV8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>基本同，wavespeed，但可以设置api key的有效期<br>|

## 2\.5 调研功能五：Billing页面（账户充值与计费管理） 

|**产品名称**|[wavespeed](https://wavespeed.ai/)|[atlascloud](https://www.atlascloud.ai/zh)|
|---|---|---|
|**功能说明**<br>|![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=MzFjMWMzZTUzYmI4ZDdhZDYyZmZiMjE3NGUzMWY4ZGRfOWExMGE3ZDg2MTlkYzFjZTVlMDMyZDA3MTBlYjdlMjdfSUQ6NzY1MTA3ODkzNTI5NDQ3OTg5NV8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)<br>![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=ODdiNDM5ODliMjQ1Mzk2ZjM1ODQyM2EyZDUwYmMwNTVfNWJhNDc2ODZmY2FkMGNjZmMxOGQ0MWQwNGJjYjhlMDVfSUQ6NzY1MTA3OTIzMTYzOTczNTgzNF8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)|![Image](https://internal-api-drive-stream-jp.larksuite.com/space/api/box/stream/download/authcode/?code=NThhNDk1ZTc0MTAwMTFkMzZkY2JiOWFlYWE0NGZlZTBfMjIxNDE5ZWNlNDQ1M2I4N2VhOTBkNzhhOTdhYjFlMDhfSUQ6NzY1MTA4MTQwMDUwMTgwMDQ3MV8xNzgxNDQwMzg0OjE3ODE1MjY3ODRfVjM)|



# 产品 V1 功能清单（WIP）

## 产品定位与边界

**背景：** 市场需求已验证。V1 目标是尽快交付一个**可商用、开发者可用**的海外视频生成平台，在模型数量精简的前提下，补齐 Web + API + SDK 完整能力。

**目标用户：** 海外独立开发者、AI 应用团队、内容创作者——通过统一账号与接口使用 Seedance、Kling 等中国视频模型，无需分别对接国内平台。

**V1 范围：**
- **只做视频生成**，暂不做图像 / 音频 / 3D / LLM
- **精简模型矩阵**：Seedance（字节）、Kling（快手）；每家先接 1～2 个核心能力（文生视频 + 图生视频），合计 2～4 个模型端点
- **双通道交付**：Web Playground（试用 & 演示）+ REST API + 官方 SDK（生产集成）
- **模型少**，Models 页与首页合并，不做搜索 / 多维过滤
- **英文优先**：产品 UI、API 文档、错误码、账单均以英文为主

**V1 暂不做：**
- AI Generator 统一入口页
- Prompt 优化、独立创意案例库、相关模型推荐
- OpenAI 兼容 API 格式
- Webhook 回调（放 P1）
- 增值税发票（VAT Invoice）、企业合同、子账户 / 团队
- 微信 / 支付宝等国内支付方式
- 大规模模型矩阵（Wan、Vidu 等放 P2）

---

## 关键产品决策

| 问题 | 决策 | 理由 |
|---|---|---|
| API / SDK 是否 V1 上线？ | **是，P0** | 市场已验证，核心用户是开发者；仅有 Playground 无法满足集成需求 |
| SDK 语言覆盖 | **Python + JavaScript/TypeScript** | 覆盖主流 AI 应用栈；与 Wavespeed / Atlas 对齐 |
| 文档形态 | **独立 Docs 站（英文）** | API 产品必备；含鉴权、端点、参数、SDK 安装、错误码 |
| 是否赠送免费额度？ | **是，注册送 $1～$3 credits** | 降低首次调用门槛；邮箱验证后才到账，防刷 |
| 计费方式 | **按输出规格（分辨率 × 时长），USD 计价** | 成本可预期；Playground 与 API 共用同一套计费规则 |
| 支付方式 | **Stripe + 国际信用卡 / 借记卡** | 海外主流；Stripe Checkout 快速落地 |
| 账号注册 | **邮箱 + Google OAuth** | 开发者工具标配；GitHub OAuth 可放 P1 |
| Playground 代码示例 | **V1 就做** | 表单参数实时生成 cURL / Python / Node.js 示例，降低 API 上手成本 |

---

## 功能清单（按模块）

### 设计师协作说明

交给设计师前，请先阅读本段。标注含义如下：

| 标注 | 含义 | 设计师交付物 |
|---|---|---|
| 🎨 **需要设计** | 面向用户的核心页面，需线框图 + 高保真 + 交互说明 | 页面布局、组件样式、状态（空/加载/错误）、响应式 |
| 📐 **轻量设计** | 有页面但结构简单，或可直接套用模板 | 品牌色 / 字体 / Logo 规范即可，或仅审阅模板 |
| ⛔ **不需要设计** | 纯后端、SDK、托管第三方页面，研发自行实现 | 无 |

**设计师 V1 重点页面（建议优先出稿）：**
1. 全局 Layout（Header / Footer / 导航）
2. Models 首页
3. 模型详情 + Playground（含 API 代码示例 Tab）
4. 登录 / 注册
5. API Keys 管理页
6. Billing 页

---

### P0 — V1 首发必须交付

#### 1. 开发者能力（API + SDK + 文档）

| 功能点 | 设计 | 说明 |
|---|---|---|
| **REST API** | ⛔ 不需要设计 | 纯后端接口，无 UI |
| **API Key 管理页** | 🎨 需要设计 | 创建 / 命名 / 删除；首次创建完整展示一次；列表脱敏显示；状态 Active / Revoked |
| **按 Key 用量统计** | 🎨 需要设计 | 作为 API Keys 页表格列展示，与上项一并设计 |
| **限流** | ⛔ 不需要设计 | 后端逻辑，超额时 API 返回错误码即可 |
| **Python SDK** | ⛔ 不需要设计 | 代码仓库，研发维护 |
| **JavaScript/TypeScript SDK** | ⛔ 不需要设计 | 代码仓库，研发维护 |
| **独立文档站** | 📐 轻量设计 | 建议用 Mintlify / Docusify 等文档模板；设计师定品牌色、Logo、首页 Hero 即可 |
| **Playground 代码示例** | 🎨 需要设计 | 属于模型详情页「API」Tab，与 Playground 一并设计（代码块样式、Tab 切换） |

#### 2. Web 产品

| 功能模块 | 功能点 | 设计 | 说明 |
|---|---|---|---|
| **Models 页（首页）** | 产品介绍 + 模型卡片 | 🎨 需要设计 | 展示 2～4 个模型：名称、能力标签、起步价（USD）；点击进入详情 |
| **模型详情 + Playground** | 参数表单 | 🎨 需要设计 | Prompt、Aspect Ratio、Resolution、Duration；图生视频支持上传参考图 |
| | 费用预估 | 🎨 需要设计 | Generate 按钮显示「Est. $X.XX」 |
| | 异步任务 + 进度 | 🎨 需要设计 | Queued → Processing → Completed / Failed |
| | 结果预览与下载 | 🎨 需要设计 | 视频播放 + MP4 下载 |
| | 生成历史 | 🎨 需要设计 | 当前模型最近 N 条记录 |
| | API 标签页 | 🎨 需要设计 | 展示当前参数对应的 API 调用示例 |
| **账号体系** | 注册 / 登录 | 🎨 需要设计 | 邮箱 + 密码；Google OAuth 按钮 |
| | 邮箱验证 + 体验金 | 📐 轻量设计 | 验证邮件为纯文本模板；站内仅 Toast / Banner 提示余额到账 |
| **Billing** | 余额展示 | 🎨 需要设计 | Header 余额组件，纳入全局 Layout |
| | Stripe 充值 | ⛔ 不需要设计 | 跳转 Stripe Checkout 托管页，支付 UI 由 Stripe 提供 |
| | 消费 / 充值流水 | 🎨 需要设计 | 表格列表，含 Web 与 API 调用统一记账 |
| | 余额不足拦截 | 📐 轻量设计 | Modal / Toast 提示 + 跳转充值，可用通用组件 |
| **合规** | Terms of Service + Privacy Policy | 📐 轻量设计 | 纯文本长页，通用文章版式即可，无需定制视觉 |
| | Cookie consent | 📐 轻量设计 | 标准底部 Banner，市面通用样式 |

#### 3. 后台与基础设施

| 功能模块 | 功能点 | 设计 | 说明 |
|---|---|---|---|
| **供应商对接层** | 统一 Task 抽象 | ⛔ 不需要设计 | 后端服务，无 UI |
| **模型与定价配置** | 后台可配 | ⛔ 不需要设计 | 内部 Admin，研发用 Ant Design / shadcn 等组件库直接搭 |
| **运营管理** | 用户 / 订单 / 任务 | ⛔ 不需要设计 | 内部 Admin，同上 |
| **生成失败退款** | 自动退回 credits | ⛔ 不需要设计 | 后端逻辑 |
| **全球 CDN** | 结果视频分发 | ⛔ 不需要设计 | 基础设施 |

---

### P1 — V1 上线后短期迭代

| 功能模块 | 功能点 | 设计 | 说明 |
|---|---|---|---|
| **API 增强** | Webhook 回调 | ⛔ 不需要设计 | 纯 API 能力，文档补充即可 |
| | GitHub OAuth | 📐 轻量设计 | 登录页增加一个 OAuth 按钮，复用现有登录页 |
| **Web 体验** | 全局生成历史 | 🎨 需要设计 | 新页面或侧边栏入口，表格布局可参考 Billing 流水 |
| | 模型页 README | 📐 轻量设计 | 模型详情页底部文档区，Markdown 渲染，无需复杂视觉 |
| **增长** | Promo Code / 邀请码 | 📐 轻量设计 | Billing 页增加输入框，简单表单 |
| | 首充优惠 | 📐 轻量设计 | Billing 页 Banner 文案展示 |
| **支持** | 帮助邮箱 / Discord | 📐 轻量设计 | Footer 增加链接即可 |
| **模型扩展** | Kling Image-to-Video | 🎨 需要设计 | 复用现有 Playground 布局，仅参数表单有差异 |
| **Key 管理** | API Key 有效期 | 📐 轻量设计 | API Keys 页增加日期选择器，小改动 |

---

### P2 — 中长期

> 以下均为后续规划，**V1 阶段无需设计师介入**。

| 功能模块 | 功能点 | 设计 |
|---|---|---|
| API | OpenAI 兼容格式、Webhook 重试策略、更多语言 SDK（Go 等） | ⛔ |
| 模型 | Wan、Vidu、海螺等；视频编辑、延长、对口型、Fast 版本 | 🎨（上线时复用 Playground 模板） |
| 产品 | AI Generator 入口、Prompt 优化、搜索 / 过滤、创意案例库 | 🎨 |
| 商业 | Stripe 发票 / Receipt、企业 Billing、用量报表、子账户 / 团队 | 🎨 / ⛔（发票由 Stripe 托管） |
| 合规 | GDPR 数据导出与删除、VAT 处理 | 📐 |
| 技术 | 无冷启动、多区域部署 | ⛔ |

---

## V1 接入模型（精简矩阵）

| 供应商 | 模型 / 能力 | V1 是否接入 | 备注 |
|---|---|---|---|
| ByteDance Seedance | Text-to-Video | ✅ P0 | 首发模型，API + Playground 同步上线 |
| ByteDance Seedance | Image-to-Video | ✅ P0 | 与 T2V 共用详情页，切换 Tab |
| Kuaishou Kling | Text-to-Video | ✅ P0 | 第二供应商，形成对比 |
| Kuaishou Kling | Image-to-Video | ⭕ P0 或 P1 | 视对接进度；不影响 API/SDK 框架交付 |
| Seedance Fast / 编辑 / 其他变体 | — | ❌ P2 | 模型矩阵扩大后再加 |

---

## 页面与信息架构

```
用户端（英文 UI）
├── 🎨 全局 Layout（Header / Footer / 导航）  ← 设计师优先
├── 🎨 Models（首页）                        ← 介绍 + 模型卡片
├── 🎨 Model Detail                         ← Playground + API 示例 Tab
├── 🎨 API Keys                             ← 创建 / 管理密钥、用量
├── 🎨 Billing                              ← Balance、流水（充值跳转 Stripe，无需设计）
├── 📐 Docs（独立站或子路径）                 ← 文档模板 + 品牌规范
├── 🎨 Sign up / Log in                     ← Email + Google OAuth
└── 📐 Footer                               ← Terms、Privacy、Contact 链接

⛔ 不需要设计
├── REST API / SDK（Python、JS）              ← 研发维护
├── Stripe Checkout                         ← 第三方支付托管页
├── 验证邮件模板                              ← 纯文本
└── Admin 后台                               ← 研发用组件库搭建

SDK（独立仓库发布）
├── Python SDK                  ← PyPI
└── JavaScript/TypeScript SDK   ← npm
```

### 设计师交付清单（V1）

| 序号 | 页面 / 模块 | 设计深度 | 备注 |
|---|---|---|---|
| 1 | 设计规范 | 品牌 Logo、主色、字体、圆角、间距 | 全站基础 |
| 2 | 全局 Layout | 高保真 | Header 含余额、导航、用户菜单 |
| 3 | Models 首页 | 高保真 | 参考 Wavespeed Explore，模型少可简化 |
| 4 | 模型详情 + Playground | 高保真 + 交互 | **最复杂页面**，含左右分栏、状态流转、API Tab |
| 5 | 登录 / 注册 | 高保真 | 可合并为一页 Tab 切换 |
| 6 | API Keys | 高保真 | 含「创建成功仅显示一次」弹窗 |
| 7 | Billing | 高保真 | 流水表格 + 充值入口（非 Stripe 页） |
| 8 | 空状态 / 错误 / 加载 | 组件级 | 全局复用 |
| 9 | Docs 站 | 品牌规范 | 模板选型 + 配色，无需逐页设计 |
| 10 | Terms / Privacy | 文章版式 | 一页通用模板 |

---

## 开发排期建议

| 阶段 | 周期（参考） | 交付物 |
|---|---|---|
| **Phase 1：API 内核** | 1～2 周 | 统一 Task 抽象 + Seedance 对接；REST API（提交/查询）；鉴权与计费扣款 |
| **Phase 2：SDK + 文档** | 1～2 周 | Python / JS SDK；独立 Docs 站；错误码与 API Reference |
| **Phase 3：Web 产品** | 1～2 周 | Models 页、Playground、实时费用预估、代码示例生成、生成历史 |
| **Phase 4：账户与支付** | 1 周 | 注册登录、体验金、Stripe 充值、Billing 流水、API Key 管理页 |
| **Phase 5：第二模型 + 上线** | 1 周 | Kling 接入、管理后台、合规页、CDN、生产部署 |

**V1 上线验收标准（Definition of Done）：**
1. 开发者可通过 API Key 调用 Seedance T2V，SDK 完成提交 → 轮询 → 获取视频 URL
2. Python / JS SDK 均已发布，文档站可完成从零到第一次调用的全流程
3. Playground 可完成文生视频，并实时展示对应 API 调用代码
4. Web 与 API 共用余额，扣费规则一致，Stripe 充值可用
5. 至少 2 个模型（Seedance + Kling T2V）在 Models 页可访问
6. API Key 页可创建、查看用量、删除密钥
7. 生成失败自动退款；页脚有 Terms 与 Privacy Policy

---

## 与竞品差异（V1）

| 维度 | Wavespeed / Atlas | 本产品 V1 |
|---|---|---|
| 目标市场 | 全球 | 海外用户（用中国模型） |
| 模型数量 | 300～1000+ | **精简：2 家、2～4 个端点** |
| API + SDK | 上线即有 | **V1 同步交付** |
| 文档 | 独立文档站 | **独立 Docs 站（英文）** |
| Playground | 表单 + 实时代码 | 同，且与 API 参数对齐 |
| 支付 | Stripe 等 | Stripe + 信用卡（USD） |
| 差异化 | 模型全、价格低 | **专注中国视频模型、接入简单、SDK 开箱即用** |



# 附件：



