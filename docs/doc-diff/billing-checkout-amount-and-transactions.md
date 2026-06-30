# Billing 后端改动需求 — 自定义充值金额 & 充值记录完成时间

> **读者**：后端开发  
> **来源**：前端 Billing 页联调需求（`src/views/billing/BillingView.vue`）  
> **日期**：2026-06-26  
> **优先级**：P0（阻塞充值页自定义金额与充值历史展示）

---

## 背景

前端充值页已支持：

1. **预设档位**（如 $10 / $25 / $50）— 来自 `GET /api/billing/packages`，仅用于 UI 展示与快捷选择  
2. **自定义金额** — 用户输入 $1 ~ $10,000 之间的任意美元金额  

当前后端 `POST /api/billing/checkout` 仅接受 `{ "package": "starter" }` 这类套餐 ID，无法完成自定义金额充值。  
同时，充值历史表格与详情弹窗需要展示 **完成时间**，但 `GET /api/billing/transactions` 尚未返回 `completed_at`。

---

## 改动一：Checkout 改为按金额充值（不再接受 `package`）

### 现状（`docs/api-doc/stripe-zh.md`）

```http
POST /api/billing/checkout
Authorization: Bearer <access_token>
Content-Type: application/json

{ "package": "starter" }
```

- `package` 取值限定为 `starter` / `pro` / `business`  
- Stripe Price 通过环境变量 `STRIPE_PRICE_STARTER` 等固定映射  
- Webhook 按套餐查表决定入账 credits  

### 目标

**Checkout 请求体只接受美元金额，不再接受 `package`。**

```http
POST /api/billing/checkout
Authorization: Bearer <access_token>
Content-Type: application/json

{ "amount_usd": 20.00 }
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `amount_usd` | number | 是 | 充值金额（美元），最多 2 位小数 |

### 校验规则（建议与前端一致）

| 规则 | 值 |
|---|---|
| 最小金额 | `1.00` USD |
| 最大金额 | `10000.00` USD |
| 小数精度 | 最多 2 位；服务端应 `round(amount_usd, 2)` |
| 非法值 | 返回 **400**，`message` 说明原因 |

**错误示例：**

```json
{ "code": 400, "message": "amount_usd must be between 1 and 10000", "data": null }
```

### 响应（不变）

```json
{ "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_..." }
```

### 服务端处理流程（建议）

```
1. 校验 amount_usd 范围与精度
2. 创建 pending 交易记录（见下方「交易表字段」）
3. 创建 Stripe Checkout Session：
   - mode: payment
   - line_items 使用 price_data 动态定价（unit_amount = amount_usd * 100，currency = usd）
   - metadata 写入 transaction_id / user_id / amount_usd
   - success_url / cancel_url 由后端配置（前端已不再传这两个字段）
4. 返回 checkout_url
5. Webhook checkout.session.completed：
   - 按 metadata 中的 amount_usd 计算 credits 并入账
   - 将交易 status 置为 completed，写入 completed_at
```

### Credits 换算（内部逻辑，不暴露给前端）

换算比例仍由服务端 `config` 维护，例如：

```
credits = round(amount_usd * CREDITS_PER_USD)
```

示例：`CREDITS_PER_USD = 100` 时，`$20.00 → 2000 credits`。

**Webhook 必须以 Session / 交易记录中保存的 `amount_usd` 为准**，不要依赖 Stripe Price ID 反查套餐。

### Stripe 集成要点

| 项目 | 说明 |
|---|---|
| 固定 Price ID | 自定义金额场景下**不再适用**；改用 Checkout `price_data` 或 Payment Link 动态金额 |
| Session metadata | 必须携带 `transaction_id`，Webhook 幂等更新时用 |
| 金额一致性 | Session 实际支付金额必须与入库 `amount_usd` 一致，防止篡改 |

### 交易表 / pending 记录建议字段

创建 Checkout 时写入：

| 字段 | 说明 |
|---|---|
| `amount_usd` | 用户选择的充值金额 |
| `status` | 初始 `pending` |
| `created_at` | 发起时间（13 位毫秒） |
| `stripe_session_id` | 关联 Stripe Session |
| `package_id` | **可废弃或恒为 `null`**；不再从 checkout 请求读取 |

### 与 `GET /api/billing/packages` 的关系

| 接口 | 是否保留 | 说明 |
|---|---|---|
| `GET /api/billing/packages` | **可保留** | 仅给前端展示预设档位（`id` + `price_usd`），**不参与 checkout 扣款逻辑** |
| `POST /api/billing/checkout` | **改** | 前端选预设档时，也会发送对应 `price_usd` 作为 `amount_usd`，而不是 `package` |

**前端发送示例：**

```json
// 用户选 $25 预设档
{ "amount_usd": 25 }

// 用户自定义 $37.50
{ "amount_usd": 37.5 }
```

### 需废弃的行为

- ❌ 请求体 `{ "package": "starter" }`  
- ❌ 通过 `STRIPE_PRICE_STARTER` / `PRO` / `BUSINESS` 映射固定 Stripe Price（若全面改为动态金额）  
- ❌ Webhook 按 `package` 查 `credit_packages` 决定入账（改为按 `amount_usd`）

### 文档需同步修改

- `docs/api-doc/stripe-zh.md` — `POST /api/billing/checkout` 请求体与流程说明  
- 充值流程图第 3 步：`{ package }` → `{ amount_usd }`

---

## 改动二：充值记录返回完成时间 `completed_at`

### 现状（`docs/api-doc/stripe-zh.md`）

```json
[
  {
    "id": "uuid",
    "amount_usd": 10,
    "credits_granted": 1000,
    "status": "completed",
    "created_at": "2026-06-15T10:00:00Z"
  }
]
```

问题：

1. 缺少 `completed_at`，前端「完成时间」列只能显示 `—`  
2. `created_at` 仍为 ISO8601 字符串，与项目全局约定（13 位毫秒）不一致  
3. 仍返回 `credits_granted`，控制台前端不需要（见 [`billing-backend-gaps.md`](./billing-backend-gaps.md)）

### 目标响应 `GET /api/billing/transactions`

```json
[
  {
    "id": "uuid",
    "amount_usd": 10.00,
    "status": "completed",
    "created_at": 1749976800000,
    "completed_at": 1749976860000,
    "payment_method": "stripe",
    "payment_detail": "Visa ••4242",
    "receipt_url": "https://pay.stripe.com/receipts/..."
  }
]
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | 交易 ID |
| `amount_usd` | number | 是 | 充值金额（美元） |
| `status` | string | 是 | `pending` \| `completed` \| `failed` \| `expired` |
| `created_at` | number | 是 | **发起时间**，13 位 Unix 毫秒（UTC） |
| `completed_at` | number \| null | 是 | **完成时间**，13 位 Unix 毫秒；仅 `status=completed` 时有值，其余为 `null` |
| `payment_method` | string | 建议 | 固定 `"stripe"` 即可 |
| `payment_detail` | string \| null | 建议 | 如 `Visa ••4242`，来自 Stripe PaymentIntent |
| `receipt_url` | string \| null | 可选 | Stripe 收据链接 |

### `completed_at` 赋值时机

| 场景 | `completed_at` |
|---|---|
| 创建 Checkout，写入 `pending` 记录 | `null` |
| Webhook `checkout.session.completed` 成功入账 | 设为 Webhook 处理成功时刻（或 Stripe `payment_status=paid` 时间） |
| 支付失败 / Session 过期 | `null`，`status` 改为 `failed` 或 `expired` |
| 用户取消支付（未付款） | 保持 `pending` 或标记 `expired`，`completed_at` 仍为 `null` |

**前端展示逻辑：**

- `created_at` → 表格列「发起时间」  
- `completed_at` → 表格列「完成时间」；为 `null` 时显示 `—`  

### 需移除或不再返回的字段

| 字段 | 原因 |
|---|---|
| `credits_granted` | 控制台不向用户展示 credits |
| `package_id` | checkout 改为金额制后可省略；若暂留兼容，自定义充值时为 `null` |

### Webhook 侧需补充的写入

在 `checkout.session.completed` 处理中，除更新 `status=completed`、增加 credits 外，**必须写入**：

```sql
UPDATE transactions
SET status = 'completed',
    completed_at = <ms_timestamp>,
    payment_detail = <from Stripe>,
    receipt_url = <from Stripe>
WHERE id = :transaction_id AND status = 'pending';
```

保持现有「`WHERE status='pending'` 条件更新」幂等策略，避免重复入账。

---

## 前端对接说明（供后端理解联调行为）

| 场景 | 前端请求 / 期望 |
|---|---|
| 选预设 $10 档 | `POST /checkout` → `{ "amount_usd": 10 }` |
| 自定义 $37.50 | `POST /checkout` → `{ "amount_usd": 37.5 }` |
| 充值历史列表 | `GET /transactions`，读取 `created_at`、`completed_at`、`status` |
| 充值详情弹窗 | 同上；`completed_at` 为空则显示 `—` |
| 时间格式 | 前端已支持 number（毫秒）；若误返 ISO 字符串会尝试 `Date.parse`，**请统一返回毫秒整数** |

相关前端文件：

- `src/api/billing.ts` — `createCheckoutSession`、`mapTransaction`  
- `src/views/billing/BillingView.vue` — 自定义金额校验 `$1 ~ $10000`  
- `src/components/billing/BillingTransactionRow.vue` — 完成时间列  
- `mock/billing.ts` — 本地 Mock 已按 `{ amount_usd }` + `completed_at` 实现，可作参考  

---

## 联调验收清单

### Checkout（改动一）

- [ ] `POST /api/billing/checkout` 接受 `{ "amount_usd": 20 }`，拒绝 `{ "package": "starter" }`（或明确 400 deprecated）  
- [ ] `amount_usd` 小于 1 或大于 10000 返回 400  
- [ ] Stripe Checkout 页面显示金额与请求一致  
- [ ] 支付成功后 Webhook 按 `amount_usd` 入账 credits，而非按套餐 ID  
- [ ] 预设档位（$10/$25/$50）通过传对应 `amount_usd` 可正常充值  

### Transactions（改动二）

- [ ] `GET /api/billing/transactions` 每条记录含 `created_at`（13 位毫秒）  
- [ ] `status=completed` 的记录含非空 `completed_at`（13 位毫秒）  
- [ ] `status=pending` / `failed` / `expired` 的记录 `completed_at` 为 `null`  
- [ ] 不再返回 `credits_granted`（或标记废弃）  
- [ ] Webhook 完成后刷新列表，「完成时间」列有值  

---

## 参考：Mock 实现（仅开发环境）

本地 Mock 已实现的 checkout 逻辑（`mock/billing.ts`）：

```typescript
// POST /api/billing/checkout
const customAmountUsd = Number(body.amount_usd)
const hasCustomAmount =
  Number.isFinite(customAmountUsd) && customAmountUsd > 0 && !body.package

if (hasCustomAmount) {
  amountUsd = Math.round(customAmountUsd * 100) / 100
} else {
  // 旧逻辑：package → 固定价格（后端改造后应删除 package 分支）
}

// GET /api/billing/transactions 映射
completed_at: tx.completedAt ?? null  // 毫秒整数
```

生产环境以 Stripe Webhook 为准；Mock 的 `mock-complete` 接口无需实现到生产。

---

## 变更摘要

| 接口 | 变更类型 | 要点 |
|---|---|---|
| `POST /api/billing/checkout` | **Breaking** | 请求体 `{ package }` → `{ amount_usd }`；Stripe 改动态定价 |
| `GET /api/billing/transactions` | **Additive + 字段调整** | 新增 `completed_at`；`created_at` 改毫秒；移除 `credits_granted` |
| `POST /api/billing/webhook` | **内部逻辑** | 入账按 `amount_usd`；写入 `completed_at` |
| `GET /api/billing/packages` | 无 breaking 变更 | 仍可返回预设价格，仅供 UI 展示 |
