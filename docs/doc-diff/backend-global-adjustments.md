# 后端全局调整清单

> 状态：待后端逐项落地  
> 日期：2026-06-22  
> 受众：后端团队  
> 说明：本文档汇总需要后端**跨模块、全局统一**的调整项。各业务模块的接口缺失与字段差异见同目录下其他 doc-diff 文件。

**关联文档：** [`rest-api-zh.md`](../api-doc/rest-api-zh.md) · [`auth-zh.md`](../api-doc/auth-zh.md) · [`stripe-zh.md`](../api-doc/stripe-zh.md) · [`api-keys-backend-gaps.md`](./api-keys-backend-gaps.md) · [`billing-backend-gaps.md`](./billing-backend-gaps.md) · [`auto-top-up-api-draft.md`](./auto-top-up-api-draft.md)

---

## 一、时间戳统一为 13 位毫秒

### 1.1 统一规范

所有 REST API **响应体**（及需要前端传时间的请求体）中的时间字段，统一改为 **13 位 Unix 毫秒时间戳**。

| 项目 | 规范 |
|---|---|
| 类型 | JSON `number`（整数） |
| 精度 | Unix 毫秒（13 位，如 `1749600000000`） |
| 命名 | snake_case，后缀 `_at`（如 `created_at`） |
| 时区 | UTC 对应的绝对时刻；**禁止**返回 ISO8601 字符串 |
| 空值 | 未发生时返回 `null`，不要省略字段 |
| 禁止 | 10 位秒级时间戳、`"2026-06-11T11:56:41Z"` 等字符串格式 |

#### 正确 vs 错误示例

```json
// ✅ 正确
{ "created_at": 1749600000000 }

// ❌ 错误 — ISO8601 字符串（当前控制台 API 多数接口）
{ "created_at": "2026-06-11T11:56:41Z" }

// ❌ 错误 — 10 位秒级时间戳（当前视频代理 API）
{ "created": 1749600000 }
```

#### 数据库与 API 的边界

数据库层可继续使用 `timestamptz` / `datetime`；**仅在序列化到 JSON 响应时**转换为 13 位毫秒整数。不要在 API 层直接透传 ISO 字符串。

#### 字段命名统一

视频代理接口当前使用 `created`（无 `_at` 后缀、10 位秒）。建议与其他接口对齐为 `created_at`（13 位毫秒）。若短期无法改名，至少将 `created` 的值改为 13 位毫秒。

---

### 1.2 需调整的已有接口

以下接口在**当前后端文档**中已存在，且时间字段格式不符合规范。

#### API Key

| 接口 | 字段 | 文档现状 | 目标 |
|---|---|---|---|
| `POST /api/api-keys` | `created_at` | ISO8601 字符串 | 13 位毫秒 |
| `GET /api/api-keys` | `created_at` | ISO8601 字符串 | 13 位毫秒 |

**调整后示例：**

```json
{
  "id": "uuid",
  "prefix": "sk_live_1f78",
  "created_at": 1749633401000,
  "is_active": true
}
```

#### 用量

| 接口 | 字段 | 文档现状 | 目标 |
|---|---|---|---|
| `GET /api/usage` | `created_at` | ISO8601 字符串 | 13 位毫秒 |

**调整后示例：**

```json
{
  "task_id": "cgt-20260611195952-9l74f",
  "model": "seedance-1-5-pro-251215",
  "duration": 5,
  "credits_consumed": 200,
  "status": "queued",
  "created_at": 1749633592000
}
```

#### 用户资料

| 接口 | 字段 | 文档现状 | 目标 |
|---|---|---|---|
| `GET /api/user/profile` | `created_at` | ISO8601 字符串 | 13 位毫秒 |

**调整后示例：**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user",
  "balance": 1750,
  "created_at": 1748736000000
}
```

> 前端当前未展示该字段，但规范上应与其他接口保持一致。

#### 充值交易

| 接口 | 字段 | 文档现状 | 目标 |
|---|---|---|---|
| `GET /api/billing/transactions` | `created_at` | ISO8601 字符串 | 13 位毫秒 |

**调整后示例：**

```json
{
  "id": "uuid",
  "amount_usd": 10,
  "credits_granted": 1000,
  "status": "completed",
  "created_at": 1749976800000
}
```

#### 视频生成代理（`/v1`）

| 接口 | 字段 | 文档现状 | 目标 |
|---|---|---|---|
| `POST /v1/videos/generations` | `created` | 10 位秒 | 13 位毫秒；建议改名为 `created_at` |
| `GET /v1/videos/generations/{id}` | `created` | 10 位秒 | 同上 |

**调整后示例（推荐命名）：**

```json
{
  "id": "cgt-20260611195952-9l74f",
  "object": "video.generation",
  "created_at": 1749633592000,
  "model": "seedance-1-5-pro-251215",
  "status": "queued"
}
```

---

### 1.3 待实现接口的时间字段（新建时即遵守本规范）

以下接口尚未在后端落地，前端已在 UI 或 doc-diff 中预留。实现时**直接使用 13 位毫秒**，不要再用 ISO8601。

| 模块 | 接口 | 字段 | 说明 |
|---|---|---|---|
| API Key | `GET /api/api-keys` | `last_used_at` | 最后一次使用时间；从未使用为 `null` |
| 计费 | `GET /api/billing/transactions` | `completed_at` | Webhook 完成时间；pending 为 `null` |
| 计费 | `GET /api/billing/records` | `created_at` | 每条流水的时间 |
| 自动充值 | `GET /api/billing/auto-top-up` | `last_triggered_at` | 上次自动触发时间；未触发为 `null` |
| 自动充值 | `GET /api/billing/auto-top-up` | `updated_at` | 配置最后更新时间 |

账单流水示例：

```json
{
  "id": "uuid",
  "style": "api",
  "key": "seedance-1-5-pro · 720p · 5s",
  "api_key": "******1f78",
  "amount_credits": -200,
  "created_at": 1749899520000
}
```

---

### 1.4 全量字段清单（Checklist）

| # | 模块 | 接口 | 字段 | 当前格式 | 目标格式 |
|---|---|---|---|---|---|
| 1 | API Key | `POST /api/api-keys` | `created_at` | ISO8601 字符串 | 13 位毫秒 |
| 2 | API Key | `GET /api/api-keys` | `created_at` | ISO8601 字符串 | 13 位毫秒 |
| 3 | API Key | `GET /api/api-keys` | `last_used_at` | 未实现（草案为 ISO8601） | 13 位毫秒 \| null |
| 4 | 用量 | `GET /api/usage` | `created_at` | ISO8601 字符串 | 13 位毫秒 |
| 5 | 用户 | `GET /api/user/profile` | `created_at` | ISO8601 字符串 | 13 位毫秒 |
| 6 | 计费 | `GET /api/billing/transactions` | `created_at` | ISO8601 字符串 | 13 位毫秒 |
| 7 | 计费 | `GET /api/billing/transactions` | `completed_at` | 未实现（草案为 ISO8601） | 13 位毫秒 \| null |
| 8 | 计费 | `GET /api/billing/records` | `created_at` | 未实现（草案为 ISO8601） | 13 位毫秒 |
| 9 | 自动充值 | `GET /api/billing/auto-top-up` | `last_triggered_at` | 未实现 | 13 位毫秒 \| null |
| 10 | 自动充值 | `GET /api/billing/auto-top-up` | `updated_at` | 未实现 | 13 位毫秒 |
| 11 | 视频代理 | `POST /v1/videos/generations` | `created` → `created_at` | 10 位秒 | 13 位毫秒 |
| 12 | 视频代理 | `GET /v1/videos/generations/{id}` | `created` → `created_at` | 10 位秒 | 13 位毫秒 |

---

### 1.5 改造建议

**序列化层统一出口** — 建议在 Pydantic schema / JSON encoder 层集中处理：

```python
# 伪代码示意
def to_api_timestamp(dt: datetime | None) -> int | None:
    if dt is None:
        return None
    return int(dt.timestamp() * 1000)  # 13 位毫秒
```

**OpenAPI / Swagger** — 时间字段改为 `type: integer`、`format: int64`，移除 `format: date-time`。

**文档同步** — 落地后更新 `rest-api-zh.md`、`stripe-zh.md` 及本目录各 doc-diff 示例。

---

### 1.6 前端对接说明

前端内部统一以 **Unix 毫秒**（`number`）存储与比较时间，与 13 位规范一致：

- 类型定义：`src/types/index.ts` 中 `createdAt`、`lastUsedAt`、`completedAt` 均为 `number`
- 展示格式：`2026/6/13 16:51:37`（`formatTimestamp` + `compactDatetime`）
- API 映射层：`src/api/api-keys.ts`、`src/api/billing.ts` 当前兼容 ISO 字符串与数字；后端切换为 13 位毫秒后，前端将移除 ISO 字符串兼容

**注意：** 若后端返回 10 位秒级时间戳，前端的时间比较（如「10 分钟内完成的充值」）和展示都会出现错误。请务必返回 13 位毫秒。

---

### 1.7 验收标准

- [ ] 所有 REST 响应中的时间字段均为 JSON 整数，长度为 13 位
- [ ] 无任何接口返回 ISO8601 时间字符串
- [ ] 视频代理接口不再返回 10 位秒级 `created`
- [ ] 新增接口（records、auto-top-up 扩展字段等）直接采用本规范
- [ ] Swagger 与官方 API 文档示例已更新

---

## 二、多语言（Locale）解析

### 2.1 背景

前端已支持 **英文** 与 **简体中文** 两种语言。UI 文案由前端 `vue-i18n` 本地维护；后端需根据请求语言返回对应的**服务端文案**（如错误提示、邮件内容等）。

**重要：** API 请求的 URL **不含**语言前缀。语言信息仅通过 **HTTP 请求头** 传递，后端不应从 API path 或 query 解析 locale。

---

### 2.2 前端支持的语言

| 语言 | Locale 标识 | URL 路径前缀 | 是否默认 |
|---|---|---|---|
| English | `en-US` | 无（如 `/billing`） | ✅ 默认 |
| 简体中文 | `zh-CN` | `/zh-CN`（如 `/zh-CN/billing`） | |

- 类型定义：`LocaleType = 'en-US' | 'zh-CN'`（见 `src/i18n/index.ts`）
- 默认语言：`en-US`
- 用户切换语言后写入 `localStorage` 键 `locale`，并在路由 guard 中与 URL 同步

> URL 前缀仅用于前端页面路由与 Stripe 回调地址（`success_url` / `cancel_url`），**不会**拼接到 API base URL。

---

### 2.3 前端如何传递 Locale（后端解析依据）

前端在**每一次** API 请求中自动附加两个请求头（见 `src/api/http.ts`）：

| 请求头 | 值 | 说明 |
|---|---|---|
| `X-Locale` | `en-US` 或 `zh-CN` | **首选**，前端显式传递，语义明确 |
| `Accept-Language` | 同上 | 与 `X-Locale` 相同，遵循 HTTP 惯例 |

**示例请求：**

```http
GET /api/user/profile HTTP/1.1
Host: api.example.com
Authorization: Bearer <access_token>
X-Locale: zh-CN
Accept-Language: zh-CN
```

Token 刷新（`POST /api/auth/refresh`）同样携带上述请求头。

---

### 2.4 后端解析规则（建议实现）

#### 优先级

```
1. X-Locale 请求头（若存在且可识别）
2. Accept-Language 请求头（取第一个可识别的 language tag）
3. 默认 fallback → en-US
```

#### 规范化映射

后端收到原始 tag 后，应归一化为前端使用的两个标识之一：

| 传入值（示例） | 归一化结果 |
|---|---|
| `en-US`、`en`、`en_US` | `en-US` |
| `zh-CN`、`zh`、`zh_CN`、`zh-Hans` | `zh-CN` |
| 其他任何值 | `en-US`（fallback） |

#### 参考实现（Python 伪代码）

```python
SUPPORTED = {"en-US", "zh-CN"}
DEFAULT = "en-US"

NORMALIZE = {
    "en": "en-US",
    "en-us": "en-US",
    "en_us": "en-US",
    "zh": "zh-CN",
    "zh-cn": "zh-CN",
    "zh_cn": "zh-CN",
    "zh-hans": "zh-CN",
}

def resolve_locale(x_locale: str | None, accept_language: str | None) -> str:
    if x_locale:
        key = x_locale.strip().replace("_", "-").lower()
        if key in NORMALIZE:
            return NORMALIZE[key]
        if x_locale in SUPPORTED:
            return x_locale

    if accept_language:
        # 例: "zh-CN,zh;q=0.9,en;q=0.8" → 取 "zh-CN"
        first = accept_language.split(",")[0].strip().split(";")[0].strip()
        key = first.replace("_", "-").lower()
        if key in NORMALIZE:
            return NORMALIZE[key]
        if first in SUPPORTED:
            return first

    return DEFAULT
```

#### FastAPI 依赖注入示例

```python
from fastapi import Header

async def get_locale(
    x_locale: str | None = Header(default=None, alias="X-Locale"),
    accept_language: str | None = Header(default=None, alias="Accept-Language"),
) -> str:
    return resolve_locale(x_locale, accept_language)
```

---

### 2.5 后端需本地化的场景

| 场景 | 接口示例 | 说明 |
|---|---|---|
| 错误响应 `message` | 全部 `/api/*` | 统一响应体 `{ code, message, data }` 中的 `message` 需按 locale 返回 |
| OTP 邮件正文 | `POST /api/auth/request-otp` | 验证码邮件语言应与用户当前 UI 语言一致 |
| 未来扩展 | 模型描述、通知推送等 | 新增多语言字段时沿用 `en-US` / `zh-CN` 标识 |

#### 错误消息示例

用户语言为 `zh-CN` 时：

```json
{
  "code": 429,
  "message": "请求过于频繁，请 15 分钟后再试",
  "data": null
}
```

用户语言为 `en-US` 时：

```json
{
  "code": 429,
  "message": "Too many requests. Please try again in 15 minutes.",
  "data": null
}
```

> **前端现状：** 登录页（`AuthView.vue`）会**直接展示**后端返回的 `message` 作为错误提示；其他页面多数使用前端 i18n 兜底文案。因此认证相关接口的 `message` 本地化优先级最高。

---

### 2.6 不需要 / 不应做的

| ❌ 错误做法 | ✅ 正确做法 |
|---|---|
| 从 API URL path 解析 locale（如 `/api/zh-CN/...`） | 只从 `X-Locale` / `Accept-Language` 解析 |
| 要求前端在每个请求 body 里传 `locale` 字段 | 使用请求头，前端已全局注入 |
| 返回 `zh`、`en` 等短码 | 统一使用 `en-US`、`zh-CN` |
| 仅支持 `Accept-Language` 标准格式而忽略 `X-Locale` | 优先读 `X-Locale` |
| 对 `sk_live_` API Key 调用（`/v1/*`）强制要求 locale | 可选解析，无 header 时 fallback `en-US` |

---

### 2.7 验收标准

- [ ] 全局 middleware / dependency 统一解析 locale，各 endpoint 不重复实现
- [ ] 存在 `X-Locale: zh-CN` 时，错误 `message` 返回中文
- [ ] 无 locale 请求头时 fallback 为 `en-US`
- [ ] `Accept-Language: zh-CN,en;q=0.9` 正确识别为 `zh-CN`
- [ ] OTP 邮件语言与用户请求语言一致
- [ ] Swagger 文档注明 `X-Locale` 请求头及可选值

---

## 三、Cloudflare Turnstile 人机验证

### 3.1 背景

前端登录页（`AuthView.vue`）已集成 [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) 组件。用户在发送验证码、提交登录前须先通过人机验证；前端将 widget 返回的 token 随认证请求一并提交，**后端必须调用 Cloudflare Siteverify API 校验**，未通过则拒绝请求。

| 项目 | 说明 |
|---|---|
| 前端组件 | `src/components/auth/TurnstileWidget.vue` |
| 环境变量 | `VITE_TURNSTILE_SITE_KEY`（Site Key，仅前端使用） |
| 后端环境变量 | `TURNSTILE_SECRET_KEY`（Secret Key，仅服务端使用，**禁止**暴露给前端） |
| 请求字段 | `turnstile_token`（snake_case，放在 JSON body） |

---

### 3.2 需校验的接口

| 接口 | 是否必填 `turnstile_token` |
|---|---|
| `POST /api/auth/request-otp` | ✅ 是 |
| `POST /api/auth/verify-otp` | ✅ 是 |
| `POST /api/auth/refresh` | ❌ 否（已有 refresh token） |
| `POST /api/auth/logout` | ❌ 否 |

---

### 3.3 前端传参方式

前端在以下两个接口的请求体中附带 `turnstile_token`：

```json
// POST /api/auth/request-otp
{
  "email": "user@example.com",
  "turnstile_token": "0.KBtT-rMY9..."
}

// POST /api/auth/verify-otp
{
  "email": "user@example.com",
  "code": "123456",
  "turnstile_token": "0.KBtT-rMY9..."
}
```

**重要：Turnstile token 为单次有效。** 前端在每次 `request-otp` / `verify-otp` 调用后会重置 widget，用户需重新完成人机验证才能进行下一步操作。因此：

- 获取验证码后，用户须再次通过 Turnstile 才能点击「登录」
- 后端对同一 token 重复调用 Siteverify 会收到 `timeout-or-duplicate` 错误

---

### 3.4 后端校验流程

#### Siteverify API

```
POST https://challenges.cloudflare.com/turnstile/v0/siteverify
Content-Type: application/x-www-form-urlencoded

secret=<TURNSTILE_SECRET_KEY>&response=<turnstile_token>&remoteip=<客户端IP可选>
```

#### 成功响应示例

```json
{
  "success": true,
  "challenge_ts": "2026-06-22T08:00:00.000Z",
  "hostname": "varo.cloud",
  "error-codes": [],
  "action": "",
  "cdata": ""
}
```

#### 失败时常见 `error-codes`

| error-code | 含义 | 后端处理 |
|---|---|---|
| `missing-input-response` | 未传 token | 返回 400 |
| `invalid-input-response` | token 无效 | 返回 400 |
| `timeout-or-duplicate` | token 过期或已使用 | 返回 400 |
| `invalid-input-secret` | Secret Key 配置错误 | 记录日志，返回 500 |

#### 参考实现（Python）

```python
import httpx
from fastapi import HTTPException

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

async def verify_turnstile(token: str | None, remote_ip: str | None = None) -> None:
    if not token or not token.strip():
        raise HTTPException(status_code=400, detail="Human verification required")

    data = {
        "secret": settings.TURNSTILE_SECRET_KEY,
        "response": token.strip(),
    }
    if remote_ip:
        data["remoteip"] = remote_ip

    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.post(TURNSTILE_VERIFY_URL, data=data)
        result = resp.json()

    if not result.get("success"):
        raise HTTPException(status_code=400, detail="Human verification failed")
```

#### 在认证 endpoint 中调用

```python
@router.post("/auth/request-otp")
async def request_otp(body: RequestOtpBody, request: Request, locale: str = Depends(get_locale)):
    await verify_turnstile(body.turnstile_token, request.client.host if request.client else None)
    # ... 原有发码逻辑
```

校验应放在业务逻辑**之前**（邮箱校验、限流、发码等），避免 bot 消耗资源。

---

### 3.5 错误响应（需按 locale 本地化）

与第二节一致，`message` 应随 `X-Locale` 返回对应语言。建议文案：

| 场景 | en-US | zh-CN |
|---|---|---|
| token 缺失 | Human verification required | 请先完成人机验证 |
| token 校验失败 | Human verification failed. Please try again. | 人机验证失败，请重新验证 |
| token 过期/重复使用 | Human verification expired. Please verify again. | 人机验证已过期，请重新验证 |

**响应示例（HTTP 400）：**

```json
{
  "code": 400,
  "message": "人机验证失败，请重新验证",
  "data": null
}
```

> 前端在收到 400 后会自动重置 Turnstile widget，用户重新验证后可重试。

---

### 3.6 环境配置与测试 Key

#### 生产 / 测试环境

1. 在 [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) 创建站点
2. 添加允许的域名（生产域名、staging 域名、`localhost` 用于本地开发）
3. 获取 **Site Key** → 配置到前端 `VITE_TURNSTILE_SITE_KEY`
4. 获取 **Secret Key** → 配置到后端 `TURNSTILE_SECRET_KEY`（环境变量或密钥管理服务）

#### Cloudflare 官方测试 Key（联调用）

| 用途 | Site Key（前端） | Secret Key（后端） | 行为 |
|---|---|---|---|
| 始终通过 | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` | 验证永远成功 |
| 始终失败 | `2x00000000000000000000AB` | `2x0000000000000000000000000000000AA` | 验证永远失败 |
| 强制交互 | `3x00000000000000000000FF` | `3x0000000000000000000000000000000AA` | 强制出现挑战 |

当前前端各环境 `VITE_TURNSTILE_SITE_KEY` 见项目 `.env.*` 与 `TODO.md`。后端在开发环境应使用对应的测试 Secret Key，以便 mock / 联调时 Siteverify 返回 `success: true`。

---

### 3.7 验收标准

- [ ] `request-otp`、`verify-otp` 缺少 `turnstile_token` 时返回 400
- [ ] 无效 / 过期 token 返回 400，且 `message` 已本地化
- [ ] 有效 token 通过 Siteverify 后正常执行业务逻辑
- [ ] `TURNSTILE_SECRET_KEY` 仅存在于服务端，未提交到代码仓库
- [ ] `refresh`、`logout` 不要求 `turnstile_token`
- [ ] Swagger / auth 文档已更新请求体字段

---

## 四、（待补充）

后续其他全局调整项在此追加。
