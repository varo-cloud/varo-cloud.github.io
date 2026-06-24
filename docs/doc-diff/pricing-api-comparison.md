# 定价页接口对比（前端 vs 后端文档）

> 对比基准  
> - 前端：`src/views/pricing/PricingView.vue`、`src/api/pricing.ts`、`src/components/pricing/PricingTableRow.vue`  
> - 后端：`docs/api-doc/rest-api-zh.md`  
> - 日期：2026-06-22

---

## 总览

| 前端调用 | 后端文档 | 状态 |
|---|---|---|
| `GET /api/pricing` | 无 | ❌ 完全缺失 |

定价页依赖**独立的价格目录接口**，与现有的 `GET /api/models`、`GET /v1/models` 用途和数据结构均不同，无法直接复用。

---

## 1. 前端页面功能

### 数据加载

- 挂载时调用 `fetchPricing()` → `GET /api/pricing`
- 一次拉取全量列表，**分类 / 媒体类型筛选在前端完成**（无查询参数）

### 分类 Tab（`category`）

| 前端值 | 展示文案（en-US） |
|---|---|
| `image-video` | Image & Video Models |
| `language` | Language Models |
| `serverless` | Serverless GPU |

### 媒体类型切换（`mediaType`，仅 `image-video` 分类显示）

| 前端值 | 展示文案 |
|---|---|
| `video` | Video |
| `image` | Image |
| `llm` | LLM |

切换到 `language` 时自动将媒体类型设为 `llm`；`serverless` 分类不显示媒体切换器。

### 表格列

| 列 | 前端字段 | 说明 |
|---|---|---|
| Model | `name` | 模型/产品名称 |
| Standard Price (USD) | `standardPriceUsd` | 标准单价，格式 `$0.086`（最多 3 位小数，去尾零） |
| Price | `startingPriceUsd` + `priceUnit` | 展示为「Start from **$0.086**/s video」 |
| Discount | `discountPercent` | 有值时显示 `-15%` 徽章，无值显示 `--` |
| View | `modelId ?? id` | 跳转模型详情页 `models/:id` |

### 路由与鉴权

- 路由：`/pricing`（支持 `/:locale` 前缀）
- **无需登录**（`meta.requiresAuth` 未设置）

---

## 2. 前端期望数据结构

当前 `src/types/index.ts` 中 `PricingItem`（camelCase，供组件使用）：

```typescript
interface PricingItem {
  id: string
  modelId?: string
  name: string
  standardPriceUsd: number
  startingPriceUsd: number
  priceUnit: string
  discountPercent?: number
  category: 'image-video' | 'language' | 'serverless'
  mediaType: 'video' | 'image' | 'llm'
}
```

当前 `src/api/pricing.ts` **未做 snake_case 映射**，Mock 直接返回 camelCase。联调时应与项目其他 API 层一致：后端返回 snake_case，前端 API 层映射为 camelCase。

建议后端响应字段（snake_case）：

| 前端字段 | 建议后端字段 | 类型 | 必填 |
|---|---|---|---|
| `id` | `id` | string | ✅ 定价条目唯一 ID |
| `modelId` | `model_id` | string | 可选，跳转模型详情用 |
| `name` | `name` | string | ✅ |
| `standardPriceUsd` | `standard_price_usd` | number | ✅ USD，最多 3 位小数 |
| `startingPriceUsd` | `starting_price_usd` | number | ✅ USD |
| `priceUnit` | `price_unit` | string | ✅ 如 `/s video`、`/Pic`、`/1K tokens`、`/hr` |
| `discountPercent` | `discount_percent` | number | 可选，整数百分比 |
| `category` | `category` | string | ✅ 枚举见上 |
| `mediaType` | `media_type` | string | ✅ 枚举见上 |

**金额原则：** 与 [`billing-backend-gaps.md`](./billing-backend-gaps.md) 一致，控制台/定价相关接口只暴露 USD，不返回 `credits` 或 `credits_per_second`。

---

## 3. 后端现有相关接口（均不满足定价页）

### `GET /api/models`（JWT）

```json
[
  { "id": "seedance-1-5-pro-251215", "credits_per_second": 40, "active": true }
]
```

| 差异 | 说明 |
|---|---|
| 鉴权 | 定价页为公开页，此接口需 JWT |
| 字段 | 仅 `id` / `credits_per_second` / `active`，无名称、分类、折扣、价格单位 |
| 结构 | 返回模型费率，非定价目录；一条模型可对应多条定价（不同分辨率/时长档位） |
| 分页 | 无分页；定价页需要全量目录 |

### `GET /v1/models`（公开，OpenAI 兼容）

```json
{
  "object": "list",
  "data": [
    { "id": "seedance-1-5-pro-251215", "object": "model", "owned_by": "varo" }
  ]
}
```

| 差异 | 说明 |
|---|---|
| 格式 | OpenAI 列表格式，无价格字段 |
| 用途 | API 调用方列举可用模型，非控制台定价展示 |

### 模型列表 Mock（`GET /api/models`，控制台用）

前端 Models 页使用的 `Model` 类型含 `startingPriceUsd`、`originalPriceUsd`、`discountPercent` 等，但：

- 与 `PricingItem` 字段语义不完全一致（`originalPriceUsd` ≠ `standardPriceUsd` 命名）
- 缺少 `category`、`mediaType`
- 定价页条目可与模型多对一（同模型不同规格多行）
- 后端文档中 `GET /api/models` 尚未提供这些富字段

---

## 4. 与 Models 页的关系

| | Models 页 | Pricing 页 |
|---|---|---|
| 接口 | `GET /api/models`（分页 + 搜索） | `GET /api/pricing`（全量） |
| 目的 | 浏览、收藏、进入 Playground | 按分类查看标准价/折扣价 |
| 数据粒度 | 一个模型一条 | 一个定价 SKU 一条（可重复模型名） |
| 筛选 | 服务端 `q` + 前端 Tab | 前端 `category` + `mediaType` |

两页数据有交集（均可跳转模型详情），但**不应强行合并为一个接口**。

---

## 5. 前端待对齐项（后端实现后）

| 项 | 说明 |
|---|---|
| API 映射层 | `src/api/pricing.ts` 增加 `ApiPricingItem` + `mapPricingItem`，后端 snake_case → 前端 camelCase |
| Mock 数据 | `mock/pricing.ts` 改为返回 snake_case，与真实 API 一致 |
| 多语言名称 | 若后端按 `X-Locale` 返回本地化 `name`，前端无需改动（见 [`backend-global-adjustments.md`](./backend-global-adjustments.md)） |

---

## 6. 结论

- 后端**没有** `GET /api/pricing`，定价页目前仅靠 Mock 运行。
- 现有 `GET /api/models` / `GET /v1/models` **不能**替代定价页接口。
- 需后端新增专用定价目录接口，字段规范见 [`pricing-backend-gaps.md`](./pricing-backend-gaps.md)。
