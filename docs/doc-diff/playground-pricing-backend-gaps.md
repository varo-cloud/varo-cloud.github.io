# Playground 动态计价（Quote）— 后端缺口说明

> 面向后端实现。  
> 前端页面：`PlaygroundInputPanel.vue`、`PlaygroundOutputPanel.vue`  
> 关联文档：  
> - [`playground-schema-backend-gaps.md`](./playground-schema-backend-gaps.md)（Input Schema）  
> - [`playground-run-backend-gaps.md`](./playground-run-backend-gaps.md)（运行 / 扣费）  
> - [`billing-backend-gaps.md`](./billing-backend-gaps.md)（USD、credits 不暴露）  
> - [`model-docs-backend-gaps.md`](./model-docs-backend-gaps.md)（README 定价表为说明性文案）

---

## 1. 问题

Playground Run 按钮旁需展示**本次运行的精确费用**。费用随用户输入变化，例如 Seedance 2.0 T2V：

| 因素 | 影响 |
|---|---|
| `duration` | 输出秒数越长越贵 |
| `resolution` | 720p = 2× 480p，1080p = 5×，4k = 10× |
| `reference_videos` | **计费模式切换**：无参考视频按输出时长锚定；有参考视频按「输入视频时长 + 输出时长」按秒计费 |
| `batch_size` | 总价 × N（1–4） |
| 折扣 | 活动价 / 标准价划线 |

**现状（前端）：** 使用模型详情静态字段 `per_run_price_usd × batch_size`，仅在默认配置（如 5s·480p）下正确；用户改 slider 后价格**不更新**。

**结论：动态价格必须由后端计价，前端只负责展示与防抖请求。**

---

## 2. 设计原则

1. **计价逻辑只在后端维护一份**（与真实扣费、账单流水共用），前端不算公式。
2. **Quote 与 Run 同价**：用户看到的预估价 = 提交后扣费额（除非运行中上游失败退款）。
3. **对外只暴露 USD**：`cost_usd`、`standard_cost_usd`；禁止 `credits_*`。
4. **未登录也展示预估价**（参考 WaveSpeed「$0.6 每次运行」），降低试用门槛；余额不足拦截仍仅登录态。
5. **README 定价表**为运营说明，**不以 README 为准**；Playground 以 Quote API 为准。

---

## 3. 新增：`POST /api/models/{model_id}/quote`

根据当前 Playground 输入实时返回本次运行费用。

### 认证

| 场景 | 认证 |
|---|---|
| Playground 展示预估价 | **无需登录**（公开） |
| 与 Run 配合 | Run 时后端再次计价扣费，不依赖 quote 缓存 |

### 请求体

```json
{
  "input": {
    "prompt": "A cinematic shot of waves at sunset",
    "aspect_ratio": "16:9",
    "resolution": "720p",
    "duration": 10,
    "generate_audio": true,
    "reference_videos": []
  },
  "batch_size": 2
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `input` | 是 | 与 Playground / `POST /api/playground/generations` 的 `input` 一致；按 Input Schema 校验 |
| `batch_size` | 否 | 默认 `1`，最大 `4` |

### 响应 200

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "cost_usd": 2.40,
    "standard_cost_usd": 3.00,
    "discount_percent": 20,
    "unit_cost_usd": 1.20,
    "batch_size": 2,
    "runs_per_ten_usd": 8,
    "breakdown": {
      "billing_mode": "output_duration",
      "billed_seconds": 10,
      "resolution": "720p",
      "rate_per_second_usd": 0.12,
      "has_reference_videos": false
    }
  }
}
```

### 响应字段

| 字段 | 类型 | 说明 |
|---|---|---|
| `cost_usd` | number | **本次运行总价**（已含 `batch_size`），Run 按钮展示此值 |
| `standard_cost_usd` | number | 可选，划线原价（有折扣时） |
| `discount_percent` | number | 可选，如 `20` 表示 -20% |
| `unit_cost_usd` | number | 可选，单次（`batch_size=1`）价格，便于展示「$1.20 / run」 |
| `batch_size` | number | 回显请求中的批量数 |
| `runs_per_ten_usd` | number | 可选，`$10` 余额约可运行次数（`floor(10 / unit_cost_usd)`） |
| `breakdown` | object | 可选，调试与高级展示；前端 V1 可不渲染 |

### `billing_mode` 建议枚举

| 值 | 说明 |
|---|---|
| `output_duration` | 按输出视频秒数 × 分辨率单价（无 reference_videos） |
| `input_plus_output_duration` | 按参考视频时长（clamp 2–15s）+ 输出时长（有 reference_videos） |
| `per_image` | 图像模型按张 |
| `per_request` | 固定价/次 |

后端按 `model_id` 注册计价策略；新增模型时只改后端，前端无需发版。

### 错误码

| HTTP | 场景 |
|---|---|
| 400 | Schema 校验失败 |
| 404 | `model_id` 不存在 |
| 422 | 参数组合无法计价（如参考视频超时长限制） |

---

## 4. 与运行接口的关系

```
用户改表单 ──debounce──► POST .../quote ──► 更新 Run 按钮价格
用户点 Run ───────────► POST .../playground/generations
                              │
                              └─► 服务端用同一套计价函数扣费
```

| 要求 | 说明 |
|---|---|
| **同一函数** | `quote(input, batch_size)` 与 `run` 扣费必须调用同一 `calculate_cost_usd()` |
| **无需 quote_id** | V1 可不返回 quote token；Run 时按提交瞬间 input 计价 |
| **响应回显** | `POST /api/playground/generations` 响应 `usage.cost_usd` 应与用户看到的预估一致 |

外部 API（`POST /v1/generations`）扣费规则与 Playground **相同 input 同价**；可选在 402 前不提供 quote，但文档应说明计价维度。

---

## 5. 静态字段与动态 Quote 的分工

| 字段 / 接口 | 用途 | 是否随表单变化 |
|---|---|---|
| `starting_price_usd` + `price_unit` | 模型卡片、定价页「起价」 | 否 |
| `price_detail`（如 `5s · 720p`） | 卡片上下文说明 | 否 |
| `per_run_price_usd` | **默认 Schema 配置**下的单次价；Quote 加载前的占位 | 否（仅默认配置） |
| **`POST .../quote`** | Playground **实时精确价** | **是** |

流程：

1. 页面加载：先显示 `per_run_price_usd`（或 skeleton）
2. 首次 Quote 返回后：替换为 `cost_usd`
3. 用户改 `duration` / `resolution` 等：防抖重新 Quote
4. 生成完成：右侧结果区展示 `usage.cost_usd`（实际扣费）

---

## 6. 前端集成方案（后端就绪后）

### 6.1 调用时机

| 事件 | 行为 |
|---|---|
| `formValues` / `batch_size` 变化 | `debounce(300ms)` 调用 quote |
| 切换模型 / Schema 重置 | 立即 quote |
| JSON 模式编辑 | 解析成功后同样触发 quote |
| 请求进行中 | Run 按钮价格区显示 loading 或保留上一笔有效价 |

### 6.2 展示位置

| 位置 | 展示内容 |
|---|---|
| Run 按钮 | `$2.40`（+ 划线 `$3.00` 若有折扣） |
| Run 按钮旁 `Nx` | 已含在 `cost_usd` 中 |
| 输出区底部 | `~16 / $10`（`runs_per_ten_usd`） |
| 未登录 | 仍显示预估价；CTA 为「免费试用」 |

### 6.3 余额不足

`balance_usd < cost_usd` 时禁用 Run（现有逻辑），比较对象改为 **quote 返回的 `cost_usd`**。

### 6.4 不建议前端本地计价

即使 README 写了「720p = 2× 480p」，**也不要**在前端复现公式：

- 参考视频、促销、模型版本切换易漂移
- API 与 Playground 会不一致
- 维护成本高于防抖 Quote

---

## 7. Seedance 2.0 计价示例（后端实现参考）

### 无 `reference_videos`

锚定：480p · 5s = **$0.60**，按秒 prorate，分辨率倍率：

| resolution | 倍率 |
|---|---|
| 480p | 1× |
| 720p | 2× |
| 1080p | 5× |
| 4k | 10× |

`cost = 0.60 × (duration / 5) × resolution_multiplier × batch_size`

例：720p · 10s · batch=1 → `0.60 × 2 × 2 = $2.40`

### 有 `reference_videos`

切换为按秒：`input_seconds + output_seconds`（input 总时长 clamp 2–15s）

| resolution | $/秒 |
|---|---|
| 480p | 0.075 |
| 720p | 0.15 |
| 1080p | 0.375 |
| 4k | 0.750 |

例：参考视频合计 5s，输出 5s，720p → `10 × 0.15 = $1.50`

---

## 8. `rest-api-zh.md` 同步清单

- [ ] 新增 `POST /api/models/{model_id}/quote`
- [ ] 说明与 Playground Run、`POST /v1/generations` 共用计价
- [ ] 响应字段 `cost_usd`、`standard_cost_usd`、`breakdown`
- [ ] 明确 `per_run_price_usd` 仅为默认配置快照，非通用价格

---

## 9. 实现优先级

| 优先级 | 项 |
|---|---|
| **P0** | 后端 `calculate_cost_usd(model_id, input, batch_size)` 单点实现 |
| **P0** | `POST /api/models/{id}/quote` 公开接口 |
| **P0** | Playground Run 扣费与 quote 同函数 |
| **P1** | 前端 `usePlaygroundQuote` + Run 按钮联动 | ✅ 已实现 |
| **P1** | `runs_per_ten_usd`、折扣划线价 | ✅ 已实现 |
| **P2** | `breakdown` 在 UI 展开说明计费明细 |

---

## 10. 前端实现（Mock 联调）

| 文件 | 状态 |
|---|---|
| `src/api/playground.ts` | ✅ `fetchPlaygroundQuote` |
| `src/composables/usePlaygroundQuote.ts` | ✅ 防抖 300ms、fallback、loading |
| `mock/playground-quote.ts` | ✅ Seedance T2V 计价 + 通用 fallback |
| `PlaygroundInputPanel.vue` | ✅ Run 按钮展示 `cost_usd` / 划线价 |
| `ModelDetailView.vue` | ✅ 接入 composable |
| `PlaygroundOutputPanel.vue` | ✅ `unit_cost_usd`、`runs_per_ten_usd` 来自 quote |

后端上线后 Mock 可移除；`fetchPlaygroundQuote` 路径不变。
