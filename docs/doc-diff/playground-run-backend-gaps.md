# Playground 运行 / 代码示例 / OpenAI SDK — 后端缺口说明

> 面向后端实现。  
> 前端页面：`src/views/models/ModelDetailView.vue`、`src/components/playground/PlaygroundInputPanel.vue`  
> 关联文档：  
> - [`playground-schema-backend-gaps.md`](./playground-schema-backend-gaps.md)（Input Schema，已实现前端联调）  
> - [`rest-api-zh.md`](../api-doc/rest-api-zh.md)（当前文档化为 `/v1/videos/generations`，**应改为通用 `/v1/generations`**；另有 `/v2/generate`，**无 Playground 专用接口**）  
> - [`billing-backend-gaps.md`](./billing-backend-gaps.md)（账单 `style: web | api`）  
> - [`backend-global-adjustments.md`](./backend-global-adjustments.md)（时间戳 13 位毫秒、多语言）

---

## 1. 背景

模型详情页 Playground 包含两类能力：

| 能力 | 认证 | 前端状态 |
|---|---|---|
| **表单 / JSON 运行** | JWT（控制台登录） | UI 已完成，当前为 **Mock 模拟生成** |
| **HTTP / Python / JavaScript 代码视图** | 用户自行用 `sk_live_` API Key 调用 | 代码由前端 **本地模板生成**，待与真实 API 对齐 |

当前前端代码示例指向 **不存在的占位接口**（后续将改为 `/v1/generations`）：

```
POST {origin}/v1/generations
Body: { "model": "<api_model_id>", "prompt": "...", ...schema fields }
```

而后端文档仅有：

| 路由 | 认证 | 请求体特点 |
|---|---|---|
| `POST /v1/videos/generations` | API Key | **路径含 `videos`，不推荐**；应迁移为 `POST /v1/generations` |
| `POST /v2/generate` | API Key | BytePlus `content[]` 透传格式 |
| （无） | JWT | **无 Playground 运行接口** |

**结论：后端需新增 Playground 运行能力，并实现统一的 `POST/GET /v1/generations`（路径不含媒介类型，`model` 在请求体）；前端将在后端定稿后更新代码模板。**

---

## 2. 设计原则

1. **OpenAI SDK 为一等公民**：外部集成路径以 `/v1/*` + OpenAI Python/JS SDK 为准（与 `rest-api-zh.md` 一致），不仅支持裸 HTTP。
2. **Playground 走控制台 JWT 路径**：网页内「Run」不强制用户粘贴 API Key；与外部 API 调用共用同一生成管线，但**调用方式必须可区分**（计费统计依赖此字段）。
3. **输入以 Schema 为准**：Playground 表单字段来自 `GET /api/models/{id}/input-schema`；运行接口应接受 Schema 定义的 `snake_case` 字段集合（或等价 `input` 对象），而非仅 `prompt`。
4. **金额对外只暴露 USD**：内部 credits 换算规则见 [`billing-backend-gaps.md`](./billing-backend-gaps.md)；Playground 预估价、扣费流水均用 `cost_usd` / `amount_usd`。预估价通过 [`playground-pricing-backend-gaps.md`](./playground-pricing-backend-gaps.md) 的 Quote 接口按当前 input 计算，**禁止**前端自行套用公式。
5. **模型双标识**：控制台展示 `model_path`（如 `bytedance/seedance-2.0/text-to-video`）；上游 / OpenAI 列表使用内部 `model` id（如 `dreamina-seedance-2-0-260128`）。后端负责映射。
6. **路径与媒介类型解耦**：生成接口 URL **不得**包含 `video` / `image` / `audio` 等媒介字眼（如 ~~`/v1/videos/generations`~~）。统一使用 **`POST /v1/generations`**；由请求体 **`model`** 字段决定调用哪个模型及输出类型（视频、图像、音频等均由 Schema 与模型元数据决定）。

---

## 3. ⚠️ 调用方式区分（计费统计必做）

前端账单流水中已预留 `style` 枚举（见 [`billing-backend-gaps.md`](./billing-backend-gaps.md)）：

| `style` | 场景 |
|---|---|
| `web` | 控制台 Playground（JWT） |
| `api` | API Key 外部调用 |
| `topup` / `bonus` | 充值 / 赠送 |

**仅有 `web` / `api` 不足以支撑运营与计费分析。** 建议在生成任务 / 用量记录中增加更细粒度的 **`invocation_channel`**（或等价字段），并在管理端统计、账单流水中可聚合：

| `invocation_channel` | 说明 | 典型认证 |
|---|---|---|
| `playground` | 网页 Playground 点击 Run | JWT |
| `openai_sdk` | OpenAI Python / Node SDK（`base_url` 指向 `/v1`） | API Key |
| `http_v1` | 裸 HTTP 调用 `/v1/generations` | API Key |
| `http_v2` | 裸 HTTP 调用 `/v2/generate` | API Key |

### 后端需保证

1. **写入时机**：任务创建时根据入口路由 + SDK 特征（如 `User-Agent`、可选请求头 `X-Varo-Client: openai-sdk/...`）写入，不可事后推断。
2. **用量接口透出**：`GET /api/usage` 每条记录增加 `invocation_channel`（及 `cost_usd`，替代 `credits_consumed` 对外暴露）。
3. **账单流水**：`GET /api/billing/records` 中 `style=web` 对应 Playground，`style=api` 对应 API Key；可选增加 `invocation_channel` 供 CSV 导出细分。
4. **API Key 维度**：`api` 类调用需关联 `api_key_id` / `api_key` 前缀（账单 `api_key` 字段已在前端预留）。
5. **Playground 不绑定 API Key**：JWT 运行任务 `api_key` 为 `null`，通过 `user_id` 关联。

> **提醒后端：** 若未来按渠道定价、配额或报表拆分，必须在第一期就把 `invocation_channel` 落库；事后补标无法还原历史调用方式。

---

## 4. 新增：Playground 运行接口（JWT）

### `POST /api/playground/generations`

控制台内点击 **Run** 时调用（已登录）。未登录时前端跳转登录，不调用此接口。

| 项 | 说明 |
|---|---|
| 认证 | **JWT**（`Authorization: Bearer <access_token>`） |
| 计费 | 扣减用户余额（USD / 内部 credits），`invocation_channel = playground` |
| 批量 | 支持 `batch_size`（1–4），与前端 Run 按钮旁 `Nx` 一致 |

**请求体**

```json
{
  "model_id": "seedance-t2v",
  "input": {
    "prompt": "A cinematic shot of waves at sunset",
    "aspect_ratio": "16:9",
    "resolution": "720p",
    "duration": 5,
    "generate_audio": true
  },
  "batch_size": 1
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `model_id` | 是 | 控制台模型 ID，与 `GET /api/models/{id}` 一致 |
| `input` | 是 | 符合该模型 Input Schema 的字段对象；服务端按 Schema 校验 |
| `batch_size` | 否 | 默认 `1`，最大 `4` |

**响应 200（单任务）**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "gen_01H...",
    "object": "generation",
    "status": "queued",
    "model": "bytedance/seedance-2.0/text-to-video",
    "created_at": 1749633592000,
    "batch_size": 1,
    "usage": {
      "cost_usd": 0.48
    }
  }
}
```

**响应 200（`batch_size > 1`）**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "object": "list",
    "data": [
      { "id": "gen_01H...", "object": "generation", "status": "queued", "created_at": 1749633592000 }
    ]
  }
}
```

**错误码**

| HTTP | code | 场景 |
|---|---|---|
| 400 | 400 | Schema 校验失败（附 `details` 列出字段错误） |
| 401 | 401 | 未登录 |
| 402 | 402 | 余额不足（`balance_usd` 不足） |
| 404 | 404 | `model_id` 不存在或已下架 |
| 500 / 502 | 同左 | 上游失败；已扣费需按现有规则退款 |

---

### `GET /api/playground/generations/{id}`

轮询任务状态（Playground 右侧进度条 + 结果展示）。

| 项 | 说明 |
|---|---|
| 认证 | JWT |
| 权限 | 仅任务所属用户 |

**响应 — 成功**

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "gen_01H...",
    "object": "generation",
    "status": "completed",
    "model": "bytedance/seedance-2.0/text-to-video",
    "created_at": 1749633592000,
    "output": {
      "type": "video",
      "url": "https://..."
    },
    "usage": {
      "cost_usd": 0.48
    }
  }
}
```

**`status` 枚举（与前端一致）**

| 值 | 含义 |
|---|---|
| `queued` | 排队中 |
| `processing` | 生成中（可选返回 `progress` 0–100） |
| `completed` | 成功 |
| `failed` | 失败（附 `error.message`） |

**与 OpenAI `/v1` 响应的关系：** 建议内部复用同一任务表；对外 JSON 形状为通用 `generation` 对象（`object: "generation"`），字段命名遵循全局规范（`created_at` 13 位毫秒，见 [`backend-global-adjustments.md`](./backend-global-adjustments.md)）。

---

## 5. 统一生成接口 `/v1/generations`（支持 OpenAI SDK）

### 5.0 路径设计（替代 `/v1/videos/generations`）

| 项 | 规范 |
|---|---|
| 创建任务 | **`POST /v1/generations`** |
| 查询任务 | **`GET /v1/generations/{id}`** |
| 媒介类型 | **不在 URL 中体现**；由请求体 `model` + Schema 字段决定 |
| 弃用 | `POST /v1/videos/generations`、`GET /v1/videos/generations/{id}` 可保留短期别名并返回 `Deprecation` 头，新集成一律用 `/v1/generations` |

平台同时支持视频、图像、语言模型等多类能力，路径若写死 `videos` 会导致后续每新增一类媒介就要加路由。与 Replicate `POST /v1/predictions`、Stripe 等资源型 API 类似，**单一入口 + 请求体标明 `model`** 更易扩展。

现有 `rest-api-zh.md` 中的 `POST /v1/videos/generations` 仅文档化 `prompt` + `duration`，**无法承载 Playground Schema 全量字段**（如 `reference_images`、`aspect_ratio`、`generate_audio` 等），且路径命名不符合上述原则。

### 5.1 请求体扩展（推荐）

在保持 OpenAI SDK 可调用的前提下，扩展请求体：

```json
{
  "model": "dreamina-seedance-2-0-260128",
  "prompt": "A cinematic shot of waves at sunset",
  "duration": 5,
  "aspect_ratio": "16:9",
  "resolution": "720p",
  "reference_images": ["https://..."],
  "generate_audio": true
}
```

| 规则 | 说明 |
|---|---|
| 字段命名 | 与 Input Schema `properties` 一致（`snake_case`） |
| `prompt` | 保留为 OpenAI 惯例别名；与 Schema 中 `prompt` 字段等价 |
| 未知字段 | 建议忽略或 400；需在 OpenAPI 文档列出支持的扩展字段 |
| `model` | 使用 **内部 model id**（`GET /v1/models` 返回的 `id`），不是 `model_path` |

### 5.2 OpenAI SDK 对接要求

| 语言 | 要求 |
|---|---|
| **Python** | `pip install openai`；`OpenAI(api_key=..., base_url="https://<host>/v1")` |
| **Node.js** | `npm install openai`；`new OpenAI({ apiKey, baseURL: "https://<host>/v1" })` |

**必须验证的 SDK 能力：**

1. `client.models.list()` → `GET /v1/models`
2. 创建生成任务 → `POST /v1/generations`（SDK 使用 `client.post("/generations", body={...})`）
3. 查询任务 → `GET /v1/generations/{id}`
4. 认证头：`Authorization: Bearer sk_live_...`
5. 错误体：建议兼容 OpenAI 风格 `{ "error": { "message": "...", "type": "..." } }`

> **说明：** 不使用 OpenAI 官方的 `client.videos.generations.create()`，因其路径固定为 `/videos/generations`。本平台以 **`base_url` + `client.post("/generations")`** 为推荐集成方式，与媒介无关的统一资源模型。

### 5.3 建议增加的请求头（用于精确统计）

| Header | 说明 |
|---|---|
| `X-Varo-Invocation-Channel` | 可选；客户端显式声明 `openai_sdk` / `http_v1`。未传时由服务端根据路由默认为 `http_v1` 或 SDK 探测 |
| `X-Varo-Client` | 可选；如 `openai-python/1.30.0`、`openai-node/4.50.0` |

Playground 代码视图生成示例时，将按此规范输出（**不再使用** `/api/v1/predictions` 或 `/v1/videos/generations`）。

### 5.4 `/v2` 与 `/v1` 的关系

| 路径 | 定位 |
|---|---|
| `/v1/*` | **对外主推**；OpenAI SDK、文档示例、Playground 代码视图 |
| `/v2/*` | BytePlus 原生 `content[]` 透传；`invocation_channel = http_v2` |

两套入口应写入同一任务与计费流水，仅 `invocation_channel` 不同。

---

## 6. 代码示例视图规范（前端将按此对齐）

Playground 输入区顶部可切换 **Form / JSON / HTTP / Python / JavaScript**。后三种为**只读示例 + 复制**，用户用自有 API Key 在外部执行。

### 6.1 统一约定

| 项 | 规范 |
|---|---|
| Base URL | `https://<host>/v1`（非 `/api/v1`） |
| 创建任务 | **`POST /v1/generations`** |
| 查询任务 | **`GET /v1/generations/{id}`** |
| 认证 | `Authorization: Bearer sk_live_...` |
| 请求体 | 扁平 Schema 字段 + **`model`**（内部 id）；**不是** `{ model, input: {...} }` 包装；**`model` 为必填**，服务端据此解析模型类型与 Schema |
| `model` 取值 | 模型详情返回的 **`api_model_id`**（新增字段，见 §7） |

### 6.2 Python 示例（OpenAI SDK + 轮询）

与 `rest-api-zh.md` 一致，但需支持扩展字段：

```python
import time
from openai import OpenAI

API_KEY = "sk_live_..."
client = OpenAI(api_key=API_KEY, base_url="https://<host>/v1")

# 创建任务（model 标明模型；其余字段与 Schema 一致）
generation = client.post(
    "/generations",
    body={
        "model": "dreamina-seedance-2-0-260128",
        "prompt": "A cinematic shot of waves at sunset",
        "duration": 5,
        "aspect_ratio": "16:9",
        "resolution": "720p",
        "generate_audio": True,
    },
    cast_to=dict,
)

task_id = generation["id"]

while True:
    status = client.get(f"/generations/{task_id}", cast_to=dict)
    if status["status"] == "succeeded":
        print(status["url"])
        break
    if status["status"] == "failed":
        raise RuntimeError(status.get("error", {}).get("message", "Generation failed"))
    time.sleep(5)
```

> 统一走 `client.post("/generations")` / `client.get("/generations/{id}")`，不依赖 OpenAI SDK 的 `videos.*` 命名空间。

### 6.3 JavaScript 示例（OpenAI Node SDK）

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk_live_...",
  baseURL: "https://<host>/v1",
});

const generation = await client.post("/generations", {
  body: {
    model: "dreamina-seedance-2-0-260128",
    prompt: "A cinematic shot of waves at sunset",
    duration: 5,
    aspect_ratio: "16:9",
    resolution: "720p",
    generate_audio: true,
  },
});

let status = generation;
while (status.status === "queued" || status.status === "running") {
  await new Promise((r) => setTimeout(r, 5000));
  status = await client.get(`/generations/${generation.id}`);
}

if (status.status === "succeeded") {
  console.log(status.url);
}
```

### 6.4 HTTP 原始示例

```http
POST https://<host>/v1/generations
Authorization: Bearer sk_live_...
Content-Type: application/json

{
  "model": "dreamina-seedance-2-0-260128",
  "prompt": "A cinematic shot of waves at sunset",
  "duration": 5,
  "aspect_ratio": "16:9",
  "resolution": "720p",
  "generate_audio": true
}
```

`model` 为必填；服务端根据 `model` 查表得到模型类型（video / image / …）及对应 Input Schema，校验其余字段。

### 6.5 JSON 视图（Playground 内可编辑）

Playground **JSON 模式**仍可用于 Run（走 JWT `POST /api/playground/generations`），请求体形状：

```json
{
  "model_id": "seedance-t2v",
  "input": {
    "prompt": "...",
    "duration": 5
  },
  "batch_size": 2
}
```

与外部 API 的扁平 `/v1` 体区分开：JSON 视图面向控制台运行，代码视图面向 API Key 集成。

---

## 7. 模型详情需补充的字段

`GET /api/models/{id}` 建议增加：

| 字段 | 类型 | 说明 |
|---|---|---|
| `model_path` | string | 展示用路径，如 `bytedance/seedance-2.0/text-to-video` |
| `api_model_id` | string | OpenAI `/v1` 使用的 `model` 值，如 `dreamina-seedance-2-0-260128` |

前端代码视图用 `api_model_id` 填入示例；Playground Run 用 `model_id` + `input`。

---

## 8. 需调整的现有接口

### 8.1 `GET /api/usage`

**现状：** 仅视频任务列表，`credits_consumed`，无调用方式。

**建议：**

```json
{
  "task_id": "cgt-20260611195952-9l74f",
  "model": "dreamina-seedance-2-0-260128",
  "duration": 5,
  "cost_usd": 2.00,
  "status": "completed",
  "invocation_channel": "openai_sdk",
  "api_key_prefix": "sk_live_1f78",
  "created_at": 1749633592000
}
```

| 变更 | 说明 |
|---|---|
| `credits_consumed` → `cost_usd` | 对外不暴露 credits |
| 新增 `invocation_channel` | 见 §3 |
| 新增 `api_key_prefix` | Playground 任务为 `null` |
| `created_at` | 13 位毫秒时间戳 |

### 8.2 `POST /v1/generations` 响应

| 变更 | 说明 |
|---|---|
| 路径 | 使用 **`/v1/generations`**，弃用 `/v1/videos/generations` |
| `object` | `"generation"`（非 `video.generation`） |
| `created` → `created_at` | 13 位毫秒（见全局规范） |
| `status` 值 | 与 Playground 统一：`queued` / `processing` / `completed` / `failed`；或文档明确别名映射（如 `running` → `processing`，`succeeded` → `completed`） |
| 输出 | 成功时 `output: { "type": "video" \| "image" \| "audio" \| ..., "url": "..." }`，类型由模型决定，不在 URL 中体现 |

### 8.3 删除或禁止文档化

| 路径 | 说明 |
|---|---|
| `POST /api/v1/predictions` | **不存在**；前端历史占位，后端勿实现 |
| `POST /v1/videos/generations` | **弃用**；迁移至 `POST /v1/generations` |
| `GET /v1/videos/generations/{id}` | **弃用**；迁移至 `GET /v1/generations/{id}` |

---

## 9. 与官方文档 `rest-api-zh.md` 的同步清单

后端实现后请更新 `docs/api-doc/rest-api-zh.md`：

- [ ] 新增 § Playground：`POST/GET /api/playground/generations`
- [ ] **将** `POST/GET /v1/videos/generations` **改为** `POST/GET /v1/generations`（路径不含媒介类型；`model` 在请求体）
- [ ] 扩展 `POST /v1/generations` 请求体（Schema 扩展字段表）
- [ ] 补充 **Node.js OpenAI SDK** 示例（`client.post("/generations")`）
- [ ] 统一 `created_at`、`object: "generation"`、状态枚举、错误体
- [ ] 用量接口增加 `invocation_channel`、`cost_usd`
- [ ] 说明 `model_path` vs `api_model_id` 映射
- [ ] 明确 `/v1/generations` 为对外主推路径；`/v2` 为 BytePlus 原生路径

---

## 10. 前端待对齐项（后端定稿后）

| 文件 | 改动 |
|---|---|
| `src/utils/playground-request-snippets.ts` | 端点改为 `/v1/generations`；请求体扁平化 + 必填 `model`；Python/JS 改用 OpenAI SDK 模板 |
| `src/views/models/ModelDetailView.vue` | 接入真实 `POST/GET /api/playground/generations`，移除 Mock |
| `src/api/` | 新增 `playground.ts` API 客户端 |
| `src/types/index.ts` | 对齐 `status`、`created_at`、`usage.cost_usd` |

---

## 11. 实现优先级建议

| 优先级 | 项 |
|---|---|
| **P0** | `invocation_channel` 落库 + `GET /api/usage` 透出；Playground JWT 运行接口 |
| **P0** | 实现 `/v1/generations`（替代 `/v1/videos/generations`）；支持 Schema 全字段；验证 OpenAI Python/Node SDK |
| **P1** | `api_model_id` 模型映射；Playground 轮询与 `batch_size` |
| **P1** | 账单流水 `style=web` 与 Playground 任务关联 |
| **P2** | `X-Varo-Client` 统计；旧路径 `/v1/videos/generations` 兼容期与下线计划 |

---

## 12. 自检清单（给后端）

- [ ] Playground Run 使用 JWT，**不**要求 API Key
- [ ] 外部调用 `POST /v1/generations` 可用 **OpenAI Python SDK** 与 **OpenAI Node SDK**（`client.post("/generations")`）完成创建 + 轮询
- [ ] 生成 URL **不含** `video` / `image` 等媒介字眼；`model` 在请求体中必填
- [ ] 所有生成入口写入 `invocation_channel`，计费统计可按渠道查询
- [ ] Playground 扣费在账单中体现为 `style: web`；API 扣费为 `style: api`
- [ ] 对外响应不含 `credits_*` 字段，使用 `cost_usd` / `amount_usd`
- [ ] 时间戳统一 13 位毫秒
- [ ] 不存在 `/api/v1/predictions` 路由
