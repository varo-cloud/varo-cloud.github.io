# Varo — genflow-api REST API 文档

视频生成 API 中转服务。客户端使用 `sk_live_` API Key 调用视频生成接口，使用 JWT 调用控制台接口，服务端负责鉴权、credit 计费，并将请求转发至上游（Seedance / Dreamina）完成视频生成。

- Base URL：部署相关，形如 `https://<your-host>`
- 交互式文档（Swagger）：`<Base URL>/docs`
- 拆分文档：[认证 API（邮箱 OTP 登录）](./auth-zh.md) ｜ [计费 / Stripe API](./stripe-zh.md)

本文档涵盖：通用约定、API Key、账户余额、用量、模型、用户资料、计费与定价、视频生成（`/v1`、`/v2`）及健康检查。认证流程见 [认证 API](./auth-zh.md)，充值流程见 [计费 / Stripe API](./stripe-zh.md)。

---

## 通用约定

### 响应信封

所有 `/api/*` 接口（**含 `/api/auth`**）的成功响应统一包裹为：

```json
{ "code": 0, "message": "ok", "data": <实际数据> }
```

错误响应：

```json
{ "code": <HTTP 状态码>, "message": "<本地化错误信息>", "data": null }
```

- 为简洁起见，下文各接口的「响应」示例展示的是 `data` 字段内容，外层信封省略。
- `/v1/*`、`/v2/*` 代理接口与 `GET /healthz` **不**使用信封，返回原生结构（与 OpenAI / 上游格式兼容）。

### 时间戳

所有时间字段（如 `created_at`）均为 **13 位 Unix 毫秒时间戳整数（UTC）**，例如 `1781179001000`，不再返回 ISO8601 字符串。`/v1` 任务对象的 `created_at` 同样为毫秒整数。

### 多语言

通过请求头 `X-Locale`（优先）或 `Accept-Language` 选择语言，支持 `en-US`（默认）与 `zh-CN`。影响错误响应的 `message` 文案与 OTP 邮件语言。

---

## 认证方式

| 方式 | 格式 | 适用接口 |
|---|---|---|
| JWT | `Authorization: Bearer <access_token>` | 控制台接口（`/api/*`，`/api/auth` 除外） |
| API Key | `Authorization: Bearer sk_live_...` | 视频生成代理接口（`/v1/*`、`/v2/*`） |

- JWT 通过邮箱验证码（OTP）流程获取，详见 [认证 API](./auth-zh.md)。access token 有效期 15 分钟，refresh token 有效期 7 天（滑动续期）。
- `sk_live_` API Key 永久有效，除非主动撤销。
- 部分接口公开无需认证：`GET /api/billing/config`、`GET /api/billing/packages`、`GET /v1/models`、`GET /healthz`。

---

## API Key 接口

以下接口均需 JWT 认证。

### POST /api/api-keys

创建一把 API Key。**完整密钥仅在此处返回一次**，请立刻保存。

**认证：** JWT

**请求体（可选）**
```json
{ "name": "production" }
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 可选；省略、空串或纯空白时回退为 `"Untitled"` |

**响应 200（`data`）**
```json
{ "id": "…", "key": "sk_live_…", "prefix": "sk_live_xxxx", "name": "production", "created_at": 1781179001000 }
```

### GET /api/api-keys

列出当前用户的全部 Key（含已吊销），用于控制台表格展示与吊销态徽标。**不返回完整密钥。**

**认证：** JWT

**响应 200（`data`）**
```json
[
  {
    "id": "…",
    "prefix": "sk_live_xxxx",
    "name": "production",
    "is_active": true,
    "created_at": 1781179001000,
    "total_calls": 42,
    "total_spend_usd": 3.51,
    "last_used_at": 1781179001000
  }
]
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `prefix` | string | 密钥前缀（脱敏展示用） |
| `name` | string | 用户自定义名称 |
| `is_active` | boolean | `false` 表示已吊销 |
| `created_at` | number | 创建时间（13 位毫秒） |
| `total_calls` | integer | 该 Key 的累计调用次数 |
| `total_spend_usd` | number | 该 Key 的累计消费（USD） |
| `last_used_at` | number \| null | 最近一次使用时间（13 位毫秒）；从未使用为 `null` |

> 统计自该 Key 被记账后开始累计：调用须由 `/v2/generate` 或 `/v1/videos/generations` 经该 Key 发起，
> 历史记录（无 `api_key_id`）不计入。

---

### DELETE /api/api-keys/{key_id}

撤销一个 API Key。

**响应 200（`data`）**
```json
{ "revoked": true }
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 404 | Key 不存在或不属于当前用户 |

---

## 充值套餐接口

### GET /api/billing/packages

返回当前有效的充值套餐列表（`active = true`），供充值页展示预设金额选项。**公开接口，无需认证**。若无有效套餐，返回内置兜底列表（至少 1 条）。详见 [计费 / Stripe API · GET /api/billing/packages](./stripe-zh.md#get-apibillingpackages)。

**响应 200（`data`）**
```json
[
  { "id": "starter",  "price_usd": 10.0 },
  { "id": "pro",      "price_usd": 25.0 },
  { "id": "business", "price_usd": 50.0 }
]
```

---

## 账户余额接口

### GET /api/billing/balance

查询当前用户的余额（美元）。充值流程见 [计费 / Stripe API](./stripe-zh.md)。

**认证方式：** JWT

**响应 200（`data`）**
```json
{ "balance_usd": 17.50 }
```

无 credits 记录（从未充值）时返回 `{ "balance_usd": 0.0 }`，不再返回 404。

---

### GET /api/billing/summary

当前用户的账户概览：余额、本月消费、累计充值与累计消费。

**认证方式：** JWT

**响应 200（`data`）**
```json
{
  "balance_usd": 17.50,
  "month_spend_usd": 96.28,
  "total_topup_usd": 120.00,
  "total_charged_usd": 125.00,
  "total_spent_usd": 102.50
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `balance_usd` | number | 当前余额（USD） |
| `month_spend_usd` | number | 本自然月消费（USD，不含已退款） |
| `total_topup_usd` | number | 累计充值入账（`transactions.credits_granted` 求和 ÷ 100，与余额口径一致，**不含手续费**） |
| `total_charged_usd` | number | 累计实际扣款（`transactions.amount_usd` 求和，**含支付手续费**，通常略高于 `total_topup_usd`） |
| `total_spent_usd` | number | 累计消费（USD，不含已退款） |

> `total_topup_usd`（入账）与 `total_charged_usd`（扣款）的差额为支付手续费。余额对账用前者：`balance ≈ total_topup − total_spent`（另含管理员调账）。

新用户或无数据时各字段为 `0`，不返回 404。

---

### GET /api/billing/records

当前用户的账单流水（`billing_records`）：管理员手动调账、赠送、退款等记录，按时间倒序。与充值订单（`transactions`）分开。

**认证方式：** JWT

**查询参数**
| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `offset` | int | `0` | 偏移量（≥ 0） |
| `limit` | int | `20` | 每页条数（1–100） |

**响应 200（`data`）**
```json
{
  "items": [
    { "id": "uuid", "style": "bonus", "amount_usd": 5.00, "reason": "promo", "created_at": 1781179001000 }
  ],
  "total": 42,
  "offset": 0,
  "limit": 20
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 流水 ID |
| `style` | string | 类型，如 `bonus`、`manual_topup`、`refund` |
| `amount_usd` | number | 金额（USD，浮点数；正数为入账） |
| `reason` | string \| null | 备注 |
| `created_at` | number | 创建时间（13 位毫秒整数，UTC） |

---

### GET /api/billing/transactions

查询当前用户的充值历史，按时间倒序排列。详细字段说明见 [计费 / Stripe API · GET /api/billing/transactions](./stripe-zh.md#get-apibillingtransactions)。

**认证方式：** JWT

**响应 200（`data`）**
```json
[
  {
    "id": "uuid",
    "amount_usd": 20.00,
    "status": "completed",
    "created_at": 1781179001000,
    "completed_at": 1781179060000,
    "payment_method": "stripe",
    "payment_detail": "Visa ••4242",
    "receipt_url": "https://pay.stripe.com/receipts/..."
  }
]
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 交易 ID |
| `amount_usd` | number | 充值金额（USD，浮点数） |
| `status` | string | `pending` \| `completed` \| `failed` \| `expired` |
| `created_at` | number | 创建时间（13 位毫秒整数，UTC） |
| `completed_at` | number \| null | 完成时间（13 位毫秒整数）；仅 `completed` 时非 null |
| `payment_method` | string \| null | 支付方式（如 `"stripe"`）；仅完成后填充 |
| `payment_detail` | string \| null | 卡信息摘要（如 `"Visa ••4242"`）；最佳努力，可能为 null |
| `receipt_url` | string \| null | Stripe 收据链接；最佳努力，可能为 null |

---

### POST /api/admin/credits/topup

管理员为用户充值 credits 的接口已移至管理后台文档，见 [admin-api-zh.md — 充值 credits](./admin-api-zh.md#充值-credits内部单位)。

## 用量接口

### GET /api/usage

查询当前用户的视频生成记录，按时间倒序排列。

**认证方式：** JWT

**查询参数**
| 参数 | 默认值 | 说明 |
|---|---|---|
| `limit` | 50 | 最大返回条数（1–200） |
| `offset` | 0 | 分页偏移量 |

**响应 200（`data`）**
```json
[
  {
    "task_id": "cgt-20260611195952-9l74f",
    "model": "seedance-1-5-pro-251215",
    "duration": 5,
    "cost_usd": 0.13,
    "status": "succeeded",
    "created_at": 1781179001000
  }
]
```

`cost_usd` 为该任务最终消耗的美元金额（任务完成后按实际用量结算，见「计费与定价」）。

---

## 上传接口

### POST /api/upload

上传图片/视频/音频，返回一个可被生成接口引用的 URL（如图生视频的输入图）。

**认证：** JWT

**请求：** `multipart/form-data`，字段名 `file`。仅接受 `image/*`、`video/*`、`audio/*`。

**响应 200（`data`）**
```json
{ "url": "https://…/uploads/<user_id>/<uuid>.png" }
```

返回的 URL 可被上游直接拉取：默认是有效期内的 S3 预签名 GET URL；配置了 `S3_PUBLIC_BASE_URL` 时返回
公开/CDN URL。

| 状态码 | 含义 |
|---|---|
| 413 | 文件超过 `UPLOAD_MAX_BYTES`（默认 50MB） |
| 415 | 文件类型不支持 |
| 503 | 未配置 `S3_BUCKET` |

## 模型接口

模型目录存于 `models` 表，是单一数据源：既含展示字段，也含生成配置（上游 `base_url`、`secret_env`、
`resolutions`、`mode`、`rate`）。生成配置仅服务端使用，**绝不**出现在任何 `GET /api/models*` 响应中。
`config` 表不再存 `model_rates`，仅保留 `credit_packages`。

`GET /api/models` 系列**对访客公开**（无需 JWT）；仅 `/api/admin/models/*` 需要管理员 JWT。所有金额字段
为 `_usd`（USD），**不返回** credits。

> `GET /v1/models` 是另一套接口（供 API Key 调用方列举可生成模型），不受本节影响。

### GET /api/models

模型目录分页列表，供首页卡片展示。

**认证：** 无（公开）

**多语言解析：** `name`、`display_name`、`description` 字段会根据请求头自动本地化。优先读取 `X-Locale` 头（如 `zh-CN`），其次取 `Accept-Language` 首项，默认回退到 `en-US`。找不到目标语言时自动降级到 `en-US`。

**查询参数**
| 参数 | 默认 | 说明 |
|---|---|---|
| `offset` | 0 | 分页偏移 |
| `limit` | 20 | 每页条数（1–100） |
| `q` | — | 可选，按 `name` / `display_name` / `provider` / `description` 模糊搜索 |

**响应 200（`data`）**
```json
{
  "items": [
    {
      "id": "dreamina-seedance-2-0-260128",
      "name": "Seedance 2.0",
      "display_name": "Seedance 2.0",
      "provider": "ByteDance",
      "capabilities": ["text-to-video", "image-to-video"],
      "starting_price_usd": 0.068,
      "standard_price_usd": null,
      "price_unit": "per_second",
      "price_detail": "480p",
      "discount_percent": null,
      "description": "...",
      "thumbnail_url": null,
      "icon_url": null,
      "is_hot": false,
      "is_new": true
    }
  ],
  "total": 48,
  "offset": 0,
  "limit": 20
}
```

`price_unit` 枚举：`per_second` | `per_image` | `per_million_tokens` | `per_hour`。

### GET /api/models/batch

按 ID 批量取卡片（收藏 / 最近 Tab 用）。

**认证：** 无（公开）

**查询参数：** `ids` — 逗号分隔的模型 ID

**响应 200（`data`）：** 卡片对象数组，**按请求 ID 顺序**返回，缺失/下架的 ID 自动跳过。

### GET /api/models/{model_id}

模型详情。

**认证：** 无（公开）

**多语言解析：** 同 `GET /api/models`，`name`、`display_name`、`description` 按 `X-Locale` / `Accept-Language` / `en-US` 优先级解析。

**响应 200（`data`）：** 卡片字段 **加** `model_path`、`api_model_id`、`per_run_price_usd`、
`runs_per_ten_usd`、`readme_md`、`faq`（`{ question, answer }[]`）。生成配置与 `input_schema` 不返回。

```json
{
  "id": "dreamina-seedance-2-0-260128",
  "name": "Seedance 2.0",
  "provider": "ByteDance",
  "capabilities": ["text-to-video", "image-to-video"],
  "starting_price_usd": 0.068,
  "price_unit": "per_second",
  "model_path": "bytedance/seedance-2.0/text-to-video",
  "api_model_id": "dreamina-seedance-2-0-260128",
  "per_run_price_usd": 0.72,
  "runs_per_ten_usd": 13,
  "readme_md": "## Seedance 2.0 ...",
  "faq": [{ "question": "...", "answer": "..." }]
}
```

> `api_model_id` 是外部 `POST /v1/generations` 请求体中的 `model` 值。`input_schema` 由
> `GET /api/models/{id}/input-schema` 单独提供。

**错误码**
| 状态码 | 原因 |
|---|---|
| 404 | 模型不存在或已下架 |

### GET /api/models/{model_id}/input-schema

返回该模型的参数表单定义（JSON Schema），供 Playground 动态渲染表单。

**认证：** 无（公开）

**响应 200（`data`）** 该模型的 `input_schema` 对象；管理员尚未配置时为 `null`。

模型不存在或未上架返回 `404`。表单定义由 Admin 通过 `PUT /api/admin/models/{model_id}` 维护。

### POST /api/models/{model_id}/quote

在发起生成前预估费用。与实际扣费走**同一套计价逻辑**，预估值即最终扣费。

**认证：** JWT

**请求体**
```json
{ "input": { "resolution": "720p", "ratio": "16:9", "fps": 24, "duration": 5 } }
```

`input` 内为生成参数（`resolution` / `ratio` / `fps` / `duration` / `input_video_seconds` / `audio` /
`content`），字段与运行接口一致。

**响应 200（`data`）**
```json
{ "cost_usd": 0.84 }
```

仅返回 USD。模型不在上架目录返回 `404`；参数非法（分辨率不支持、fps 非法等）返回 `400`。

### Admin：模型管理

模型管理接口（创建 / 更新 / 上下架 / 删除）已移至管理后台文档，见 [admin-api-zh.md — 模型管理](./admin-api-zh.md#模型管理)。

## 定价接口

### GET /api/pricing

面向访客的价目表，供定价页全量展示。数据由模型目录（`models` 表）派生，**不**单独维护一张定价表：
每个有定价的上架模型对应一条记录，金额取该模型行上的 `*_usd` 字段。

**认证：** 无（公开）

**请求参数：** 无（前端全量展示，不做筛选）

**响应 200（`data`）**
```json
[
  {
    "id": "dreamina-seedance-2-0-260128",
    "model_id": "dreamina-seedance-2-0-260128",
    "name": "Seedance 2.0",
    "standard_price_usd": 0.068,
    "starting_price_usd": 0.068,
    "price_unit": "per_second",
    "discount_percent": null
  }
]
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 定价条目 ID（此实现等于 `model_id`） |
| `model_id` | string | 关联控制台模型；前端「View」跳转 `/models/{model_id}` |
| `name` | string | 展示名称 |
| `standard_price_usd` | number | 标准单价（划线价）；模型未单独设标准价时**回退为 `starting_price_usd`**（无折扣时两者相等） |
| `starting_price_usd` | number | 起价（USD），表格加粗展示 |
| `price_unit` | string | 枚举：`per_second` \| `per_image` \| `per_million_tokens` \| `per_hour` |
| `discount_percent` | number \| null | 折扣整数（如 `15` → `-15%`）；无折扣为 `null`，前端显示 `--` |

仅返回 `active = true` 且已设置 `starting_price_usd` 的模型。定价由 Admin 通过
`PUT /api/admin/models/{model_id}` 维护（与模型目录同源）。

---

## 用户资料接口

### GET /api/user/profile

查询当前登录用户的个人信息及余额。

**认证方式：** JWT

**响应 200（`data`）**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "balance_usd": 17.50,
  "created_at": 1780358400000
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 404 | 用户不存在 |

---

## 用户模型偏好

登录用户的收藏与最近访问，支撑 Models 首页的「收藏 / 最近」Tab。仅存模型 ID，卡片详情由
`GET /api/models/batch` 批量获取。所有接口需 **JWT**；每个写操作返回完整 `ModelPreferences`。

**`ModelPreferences`（各接口的 `data`）**
```json
{
  "favourites": ["seedance-1-5-pro-251215", "dreamina-seedance-2-0-260128"],
  "recent": [
    { "id": "seedance-1-5-pro-251215", "visited_at": 1781179001000 }
  ]
}
```

- `favourites`：模型 ID 数组，按收藏时间**倒序**。
- `recent`：`{ id, visited_at }` 数组，按 `visited_at`（13 位毫秒）**倒序**，最多 50 条。
- 空状态返回 `[]`，不返回 `null`。

### GET /api/user/model-preferences

读取当前用户的收藏与最近访问。**认证：** JWT。**响应 200（`data`）：** `ModelPreferences`。

### POST /api/models/{model_id}/favourite

添加收藏（幂等：重复添加不报错）。允许收藏已下架模型。**认证：** JWT。
**响应 200（`data`）：** 更新后的 `ModelPreferences`。

| 状态码 | 原因 |
|---|---|
| 401 | 未登录 |
| 404 | `model_id` 不在模型目录 |

### DELETE /api/models/{model_id}/favourite

取消收藏（幂等：取消不存在的收藏仍返回 200，**不** 404）。**认证：** JWT。
**响应 200（`data`）：** 更新后的 `ModelPreferences`。

### POST /api/models/{model_id}/visit

记录一次访问：按 `model_id` 去重后写入，`visited_at` 取服务端当前时间（毫秒），仅保留最新 50 条。
**认证：** JWT。**响应 200（`data`）：** 更新后的 `ModelPreferences`。

| 状态码 | 原因 |
|---|---|
| 401 | 未登录 |
| 404 | `model_id` 不在模型目录 |

---

## 计费与定价

费用基于「token」按分辨率与时长动态计算，而非固定的「每秒 credits」。

### 计算公式

```
width, height = 分辨率与画幅(ratio) 对应的像素尺寸
tokens  = (input_video_seconds + duration) × width × height × fps ÷ 1024   （整除）
credits = max(1, ceil(rate × tokens ÷ 10000))
cost_usd = credits ÷ 100
```

- `rate` 由模型的 `mode` 与请求参数决定：
  - `mode = "audio"`：请求含音频取 `audio` 费率，否则取 `silent` 费率。
  - `mode = "video"`：取 `rate[resolution]` 下的 `with_video`（含参考视频输入）或 `no_video`（纯文生视频）。
- 画幅尺寸来自上游维度表（如 `720p / 16:9 = 1248×704`）；`4k` 按对应 `1080p` 尺寸的 2 倍推导。

> 示例：`720p / 16:9`、`fps=24`、`duration=5`、纯文生视频，`width×height = 1248×704`，
> `tokens = 5 × 1248 × 704 ÷ 1024 = 102960`。再乘以模型费率即得 credits。

### 生成参数

`/v1` 与 `/v2` 的生成请求均支持以下计费相关参数（缺省值如下）：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `duration` | 5 | 输出时长（秒） |
| `resolution` | `720p` | 必须属于该模型的 `resolutions` |
| `ratio` | `16:9` | 画幅，支持 `16:9` / `4:3` / `1:1` / `21:9` |
| `fps` | 24 | 帧率，须为正整数 |
| `audio` | 无 | 为真时按音频费率计（audio 模型） |
| `input_video_seconds` | 0 | 参考视频时长，计入 token |

非法的 `resolution` 或 `fps` 返回 **400**。

### 扣费与结算

- **提交即预扣**：提交任务时按上述公式预估并扣除 credits。
- **失败全额退款**：若上游生成未能开始（上游报错、网络错误、非 2xx），预扣的 credits **自动全额退还**。
- **成功后对账**：任务成功后，按上游返回的实际 `completion_tokens` 重新结算一次，多扣退还、少扣补收（幂等，仅结算一次）。最终金额体现在 `GET /api/usage` 的 `cost_usd`。

---

## 视频生成接口（代理 `/v2`）

以下接口均需 `sk_live_` API Key。请求体按上游的 `content` 数组格式**透传**（调用方负责构造上游所需结构）。计费规则见「计费与定价」。

> `/v2/*` 不使用响应信封，直接返回原生结构。

### POST /v2/generate

提交视频生成任务。

**请求体**
```json
{
  "model": "seedance-1-5-pro-251215",
  "content": [
    { "type": "text", "text": "一只猫在花园里散步" }
  ],
  "duration": 5,
  "resolution": "720p",
  "ratio": "16:9",
  "fps": 24
}
```

**响应 200**
```json
{
  "task_id": "cgt-20260611195952-9l74f",
  "upstream": { "id": "cgt-20260611195952-9l74f" }
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 400 | 不支持的模型，或生成参数非法 |
| 401 | API Key 无效或缺失 |
| 402 | 余额不足 |
| 500 | 模型上游未配置（`base_url` 或对应密钥环境变量缺失，已退款） |
| 502 | 上游请求失败（已退款） |
| 其它 | 透传上游状态码（如 401/404，已退款） |

---

### GET /v2/status

查询视频生成任务的状态，直接透传上游响应。仅可查询属于当前 API Key 所属用户的任务。任务成功时触发一次对账结算。

**查询参数**
| 参数 | 必填 | 说明 |
|---|---|---|
| `task_id` | 是 | `/v2/generate` 返回的任务 ID |

**响应 — 生成中**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "model": "seedance-1-5-pro-251215",
  "status": "running"
}
```

**响应 — 生成成功**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "status": "succeeded",
  "content": { "video_url": "https://..." },
  "duration": 5,
  "resolution": "720p",
  "ratio": "9:16",
  "framespersecond": 24
}
```

`video_url` 为签名 URL，有效期 **24 小时**。

**错误码**
| 状态码 | 原因 |
|---|---|
| 401 | API Key 无效或缺失 |
| 404 | 任务不存在或不属于当前用户 |
| 500 | 模型上游未配置 |
| 502 | 上游请求失败 |

---

## OpenAI 兼容接口（`/v1`）

`/v1` 路由提供与 OpenAI API 格式兼容的视频生成接口，可直接使用 OpenAI Python 客户端或任何支持 OpenAI API 格式的工具对接。

**认证方式：** `sk_live_` API Key，与 `/v2/*` 相同。`GET /v1/models` 无需认证。计费与结算规则同 `/v2`。

> `/v1/*` 不使用响应信封；时间字段 `created_at` 为毫秒整数。

### GET /v1/models

获取可用模型列表（来自 `config` 表）。

**响应 200**
```json
{
  "object": "list",
  "data": [
    { "id": "seedance-1-5-pro-251215", "object": "model", "owned_by": "varo" },
    { "id": "dreamina-seedance-2-0-260128", "object": "model", "owned_by": "varo" },
    { "id": "dreamina-seedance-2-0-fast-260128", "object": "model", "owned_by": "varo" }
  ]
}
```

---

### POST /v1/videos/generations

提交视频生成任务。`prompt` 字段在内部会映射为上游的 `content[0].text`。

**请求体**
```json
{
  "model": "seedance-1-5-pro-251215",
  "prompt": "一只猫在花园里散步",
  "duration": 5,
  "resolution": "720p",
  "ratio": "16:9",
  "fps": 24
}
```

**响应 200**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "object": "video.generation",
  "created_at": 1781179001000,
  "model": "seedance-1-5-pro-251215",
  "status": "queued"
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 400 | 不支持的模型，或生成参数非法 |
| 401 | API Key 无效或缺失 |
| 402 | 余额不足 |
| 500 | 模型上游未配置（已退款） |
| 502 | 上游请求失败（已退款） |

---

### GET /v1/videos/generations/{id}

查询视频生成任务的状态。仅可查询属于当前 API Key 所属用户的任务。

**响应 — 排队中 / 生成中**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "object": "video.generation",
  "created_at": 1781179001000,
  "model": "seedance-1-5-pro-251215",
  "status": "running"
}
```

**响应 — 生成成功**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "object": "video.generation",
  "created_at": 1781179001000,
  "model": "seedance-1-5-pro-251215",
  "status": "succeeded",
  "url": "https://..."
}
```

`url` 为签名 URL，有效期 **24 小时**。

**响应 — 生成失败**
```json
{
  "id": "cgt-20260611195952-9l74f",
  "object": "video.generation",
  "status": "failed",
  "error": { "message": "Generation failed" }
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 401 | API Key 无效或缺失 |
| 404 | 任务不存在或不属于当前用户 |
| 500 | 模型上游未配置 |
| 502 | 上游请求失败 |

---

> 别名：`POST /v1/generations`、`GET /v1/generations/{id}` 等价于
> `/v1/videos/generations`（前端使用前者，旧路径保留）。

---

### Python 调用示例（OpenAI SDK）

先安装依赖：`pip install openai httpx`

```python
import time
import httpx
from openai import OpenAI

API_KEY = "sk_live_..."
BASE = "https://<your-host>/v1"

client = OpenAI(api_key=API_KEY, base_url=BASE)
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# 查询模型列表 — 可直接使用 OpenAI SDK 原生方法
for m in client.models.list().data:
    print(m.id)

# 提交生成任务并轮询状态
with httpx.Client(timeout=30) as http:
    resp = http.post(
        f"{BASE}/videos/generations",
        headers=headers,
        json={
            "model": "seedance-1-5-pro-251215",
            "prompt": "一只猫在花园里散步",
            "duration": 5,
            "resolution": "720p",
        },
    )
    task_id = resp.json()["id"]

    while True:
        s = http.get(f"{BASE}/videos/generations/{task_id}", headers=headers).json()
        print("状态：", s["status"])
        if s["status"] == "succeeded":
            print("视频链接：", s["url"])
            break
        if s["status"] == "failed":
            print("错误：", s["error"]["message"])
            break
        time.sleep(10)
```

---

## Playground 接口

供网页控制台直接生成（JWT 鉴权，扣用户自身 credit，计费渠道标记为 `playground`）。

### POST /api/playground/generations

**认证：** JWT

**请求体**
```json
{ "model": "…", "prompt": "…", "resolution": "720p", "ratio": "16:9", "fps": 24, "duration": 5, "image_url": null }
```

**响应 200（`data`）**
```json
{ "id": "task-1", "status": "queued", "model": "…", "created_at": 1781179001000 }
```

余额不足返回 `402`（上游未启动时已扣 credit 会退回）；模型/参数非法返回 `400`。

### GET /api/playground/generations/{id}

**认证：** JWT（仅本人任务可见，否则 `404`）

**响应 200（`data`）**
```json
{ "id": "task-1", "status": "succeeded", "output_url": "https://…/video.mp4" }
```

`status` ∈ `queued` | `running` | `succeeded` | `failed`。完成后结果 URL 写入记录，后续轮询直接返回。

---

## 管理员接口

全部 `/api/admin/*` 接口（仪表盘、用户、生成记录、充值交易、退款、模型、系统配置、充值套餐）见独立文档 [admin-api-zh.md](./admin-api-zh.md)。

---

## 部署：三实例拆分

服务按路由职责拆分为三个可独立部署的实例，各自使用不同的 FastAPI 入口与 Dockerfile：

| 实例 | 入口 | Dockerfile | 鉴权 | 路由 |
|---|---|---|---|---|
| **Inference**（推理） | `app.main_inference:app` | `Dockerfile.inference` | API Key | `/v1`、`/v2` |
| **Public**（公开控制台） | `app.main:app` | `Dockerfile` | JWT（用户） | 认证、API Key、余额、用量、计费、模型、资料、定价、偏好、上传、Playground |
| **Admin**（管理后台） | `app.main_admin:app` | `Dockerfile.admin` | JWT（管理员角色） | `/api/admin/*`（仪表盘、用户、生成记录、系统配置、充值套餐等） |

三者共享同一套代码与数据库，仅通过入口文件加载的路由不同，互相之间的接口在各自实例上均返回 404。

**部署建议**：Admin 实例应部署在私有 / 内网环境，不对公网开放，避免管理接口暴露在公共访问面上；Public 与 Inference 实例可正常对外提供服务。

## 健康检查

### GET /healthz

无需认证。不使用响应信封。

**响应 200**
```json
{ "status": "ok" }
```
