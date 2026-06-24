# 定价页 — 后端接口缺失清单

> 供后端开发参考。前端页面：`src/views/pricing/PricingView.vue`  
> 对比文档：[`pricing-api-comparison.md`](./pricing-api-comparison.md)

---

## 设计原则

1. **功能以前端为准**：分类 Tab、媒体类型筛选、标准价/起价/折扣展示、跳转模型详情。
2. **金额只暴露 USD**：不返回 `credits`、`credits_per_second`；内部换算由后端完成（参见 [`billing-backend-gaps.md`](./billing-backend-gaps.md)）。
3. **命名**：响应字段使用 **snake_case**；枚举值与前端一致（kebab-case / 小写）。
4. **公开接口**：定价页无需登录，建议与 `GET /api/billing/packages` 一样**无需 JWT**。

---

## P0 — 阻塞联调

### 1. 新增 `GET /api/pricing`

获取定价目录全量列表，供定价页表格展示。

**认证：** 无（公开）

**请求参数：** 无（筛选由前端根据 `category` / `media_type` 完成）

**响应 200**

```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": "veo-31-lite-i2v",
      "model_id": "seedance-i2v",
      "name": "Veo 3.1 Lite Image-to-video",
      "standard_price_usd": 0.086,
      "starting_price_usd": 0.086,
      "price_unit": "/s video",
      "discount_percent": 15,
      "category": "image-video",
      "media_type": "video"
    },
    {
      "id": "flux-pro-image",
      "name": "Flux Pro Image",
      "standard_price_usd": 0.04,
      "starting_price_usd": 0.04,
      "price_unit": "/Pic",
      "category": "image-video",
      "media_type": "image"
    },
    {
      "id": "gpt-4o",
      "name": "GPT-4o",
      "standard_price_usd": 0.005,
      "starting_price_usd": 0.005,
      "price_unit": "/1K tokens",
      "category": "language",
      "media_type": "llm"
    },
    {
      "id": "a100-80gb",
      "name": "A100 80GB",
      "standard_price_usd": 2.49,
      "starting_price_usd": 2.49,
      "price_unit": "/hr",
      "category": "serverless",
      "media_type": "llm"
    }
  ]
}
```

> 外层 `{ code, message, data }` 与项目现有 API 包装格式一致。

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✅ | 定价条目唯一 ID（可与 `model_id` 不同，同一模型可有多个定价 SKU） |
| `model_id` | string | 可选 | 关联控制台模型 ID；有值时前端「View」跳转到 `/models/{model_id}` |
| `name` | string | ✅ | 展示名称 |
| `standard_price_usd` | number | ✅ | 标准单价（USD） |
| `starting_price_usd` | number | ✅ | 起价（USD），表格「Price」列加粗展示 |
| `price_unit` | string | ✅ | 单位后缀，原样拼接在价格后，如 `/s video`、`/Pic`、`/1K tokens`、`/hr` |
| `discount_percent` | number | 可选 | 折扣百分比整数，如 `15` 表示 `-15%`；无折扣可省略或 `null` |
| `category` | string | ✅ | `image-video` \| `language` \| `serverless` |
| `media_type` | string | ✅ | `video` \| `image` \| `llm` |

#### 枚举与前端筛选逻辑

| `category` | 前端 Tab | 是否显示媒体切换 |
|---|---|---|
| `image-video` | Image & Video Models | 是（`video` / `image` / `llm`） |
| `language` | Language Models | 否 |
| `serverless` | Serverless GPU | 否 |

前端筛选规则：

```text
item.category === activeCategory
且当 activeCategory === 'image-video' 时，还需 item.media_type === activeMediaType
```

#### 金额计算建议（后端内部）

若费率存于 `config.model_rates` 的 credits 字段，响应前换算为 USD：

```python
CREDITS_PER_USD = 100  # 示例，以实际配置为准

def credits_to_usd(credits: float) -> float:
    return round(credits / CREDITS_PER_USD, 3)

# standard_price_usd = credits_to_usd(standard_credits)
# starting_price_usd = credits_to_usd(starting_credits)
```

`discount_percent` 可由后端计算：`(1 - starting / standard) * 100`，或由运营配置表直接存储。

#### 数据来源建议

- 新建 `pricing_catalog` 配置表（或 CMS），与 `model_rates` 解耦。
- `model_id` 外键关联控制台模型，便于「View」跳转；无对应模型时可省略 `model_id`。
- 列表按 `category`、`media_type`、排序权重排序返回（前端不再排序）。

**原因：** 定价页展示的是**面向用户的价目表**（含分类、折扣、多 SKU），与 API 费率接口 `GET /api/models` 的 `{ id, credits_per_second }` 粒度不同，不宜混用。

---

## P1 — 体验增强（非阻塞）

### 2. 多语言名称

前端已通过 `X-Locale` / `Accept-Language` 传递 `en-US` 或 `zh-CN`（见 [`backend-global-adjustments.md`](./backend-global-adjustments.md)）。

**建议：** `name` 按请求 locale 返回对应语言；或返回 `name_en` / `name_zh`，由前端选择（需同步改前端映射）。

### 3. 缓存

定价数据变更频率低，建议：

- `Cache-Control: public, max-age=300`（5 分钟）
- 或 CDN 边缘缓存

---

## 与 `GET /api/models` 的边界

| 接口 | 受众 | 数据 |
|---|---|---|
| `GET /api/pricing` | 访客 / 未登录用户 | 价目表：分类、标准价、折扣、单位 |
| `GET /api/models` | 已登录控制台 | 可用模型 + 计费费率（USD） |

控制台模型费率改造见 [`billing-backend-gaps.md`](./billing-backend-gaps.md) 第 6 节，**不替代**本定价接口。

---

## 联调检查清单

- [ ] 实现 `GET /api/pricing`，公开无需 JWT
- [ ] 响应使用统一包装 `{ code, message, data }`
- [ ] 所有金额字段为 `_usd` 后缀的 `number`，禁止返回 credits
- [ ] 字段 snake_case：`model_id`、`standard_price_usd`、`starting_price_usd`、`price_unit`、`discount_percent`、`media_type`
- [ ] `category` / `media_type` 枚举值与上文一致
- [ ] `model_id` 有值时对应 `GET /api/models/{model_id}` 可访问的模型
- [ ] 无折扣条目省略 `discount_percent` 或返回 `null`，前端显示 `--`
- [ ] （可选）按 `X-Locale` 返回本地化 `name`

---

## 前端联调准备

后端就绪后，前端将：

1. 在 `src/api/pricing.ts` 增加 snake_case → camelCase 映射
2. 将 `mock/pricing.ts` 改为 snake_case 响应

无需改动 `PricingView.vue` 业务逻辑。
