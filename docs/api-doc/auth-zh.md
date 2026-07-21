# Varo — genflow-api 认证 API 文档

无密码（邮箱 OTP）与 Google / GitHub OAuth 认证。用户通过邮箱验证码或第三方授权登录，服务端颁发 JWT access token 与可轮换的 refresh token。系统无密码，账号在首次验证验证码或首次完成 OAuth 时自动创建。

- Base URL：部署相关，形如 `https://<your-host>`
- 交互式文档（Swagger）：`<Base URL>/docs`
- 相关文档：[计费 / Stripe API](./stripe-zh.md) ｜ [其余 REST API](./rest-api-zh.md)

---

## 令牌模型

| 令牌 | 用途 | 有效期 |
|---|---|---|
| access token（JWT） | 调用控制台接口（`/api/*`，`/api/auth` 除外） | **15 分钟** |
| refresh token | 换取新的 access token | **7 天，滑动续期** |

- access token 通过 `Authorization: Bearer <access_token>` 传递，claims 含 `sub`（用户 ID）与 `role`。
- refresh token 为高熵随机串，服务端仅存其 SHA-256 哈希。每次刷新都会**颁发新 token 并立即撤销旧 token**（轮换），每次刷新有效期顺延 7 天。
- 视频生成接口使用的 `sk_live_` API Key 与本流程无关，详见 [其余 REST API](./rest-api-zh.md)。

---

## 用户流程

### 注册 / 登录（同一流程）

```
1. 用户在登录页完成 Cloudflare Turnstile 人机验证，获得一次性 `turnstile_token`
2. POST /api/auth/request-otp   { email, turnstile_token }  -> 发送 6 位验证码到邮箱
3. 用户从邮件获取验证码（开发环境下验证码输出到服务器日志）
4. 用户再次完成 Turnstile 验证（token 单次有效），获得新的 `turnstile_token`
5. POST /api/auth/verify-otp    { email, code, turnstile_token }  -> 返回 access_token + refresh_token
   首次登录的邮箱会自动创建账号（初始 credits 余额为 0）
6. 用 access_token 调用控制台接口（Authorization: Bearer <access_token>）
```

### 维持会话

```
access token 过期（15 分钟）后：
  POST /api/auth/refresh   { refresh_token }   -> 返回新的 access_token + refresh_token
  注意：旧 refresh token 立即失效，请用返回的新 refresh token 替换本地存储。

若 refresh token 也已过期（超过 7 天未刷新）：
  需重新走 request-otp / verify-otp 登录流程。
```

### 退出登录

```
POST /api/auth/logout   { refresh_token }   -> 撤销该 refresh token
```

### Google / GitHub OAuth

```
1. 前端 GET /api/auth/oauth/{google|github}/authorize?redirect_uri=<前端回调>&state=<csrf>
   -> { authorize_url }   （后端缓存 state；authorize_url 指向 IdP 或后端跳转页）
2. 浏览器跳转到 authorize_url，用户在 Google / GitHub 授权
3. IdP 回调后端；后端换 token、创建/绑定用户，再 302 到前端 redirect_uri：
   ?code=<一次性登录码>&state=<原 state>
   失败时：?error=access_denied&error_description=...&state=...
4. 前端校验 sessionStorage 中的 state，再 POST /api/auth/oauth/exchange { code }
   -> 返回与 verify-otp 相同的 TokenPair
```

> 请勿把 access/refresh token 直接放在 URL query 中（会进历史记录 / Referer）。改用短时、单次有效的 `code`。

### 在 Google / GitHub 注册 OAuth 应用（必做）

Client ID / Secret **只放后端环境变量**，不要写进前端仓库。注册时填写的 **Authorized redirect URI 必须是后端 callback**，不是前端的 `/auth/callback`。

#### Google Cloud

1. 打开 [Google Cloud Console](https://console.cloud.google.com/) → 选中或新建项目  
2. **APIs & Services → OAuth consent screen**  
   - User Type：外部产品用 External；内部员工可用 Internal  
   - 填写 App name、User support email、Developer contact  
   - Scopes：至少 `openid`、`email`、`profile`  
   - 测试阶段把测试账号加进 Test users；上线前做 Verification（仅需基础 scope 时通常较简单）  
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**  
   - Application type：**Web application**  
   - Authorized JavaScript origins（可选，前端域名）：  
     - 本地：`http://localhost:5173`  
     - 正式：`https://varo.cloud`（及 staging 域名）  
     - 测试: `https://varo-staging.github.io/`
   - Authorized redirect URIs（**后端**）：  
     - 本地：`http://localhost:<api-port>/api/auth/oauth/google/callback`  
     - 正式：`https://api.varo.cloud/api/auth/oauth/google/callback`
     - 测试: `https://staging.api.varo.cloud/api/auth/oauth/google/callback`
4. 创建后得到 **Client ID**、**Client Secret** → 配到后端，例如：  
   - `GOOGLE_OAUTH_CLIENT_ID`  
   - `GOOGLE_OAUTH_CLIENT_SECRET`  
   - `GOOGLE_OAUTH_REDIRECT_URI`（与上表 redirect URI 完全一致）

#### GitHub

1. 打开 [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers) → **New OAuth App**  
2. 填写：  
   - Application name：如 `Varo`  
   - Homepage URL：如 `https://varo.cloud`  
   - Authorization callback URL（**后端**）：  
     - 本地：`http://localhost:<api-port>/api/auth/oauth/github/callback`  
     - 正式：`https://api.varo.cloud/api/auth/oauth/github/callback` 
     - 测试: `https://staging.api.varo.cloud/api/auth/oauth/github/callback`
3. 创建后记下 **Client ID**，再 **Generate a new client secret**  
4. 配到后端，例如：  
   - `GITHUB_OAUTH_CLIENT_ID`  
   - `GITHUB_OAUTH_CLIENT_SECRET`  
   - `GITHUB_OAUTH_REDIRECT_URI`  
5. Scope：登录建议 `read:user` + `user:email`（否则可能拿不到主邮箱）

#### 环境对照建议

| 环境 | Google / GitHub Redirect URI | 前端 callback（后端 302 目标） |
|---|---|---|
| 本地 | `http://localhost:<api>/api/auth/oauth/{provider}/callback` | `http://localhost:5173/auth/callback` |
| Staging | `https://staging.api.varo.cloud/api/auth/oauth/{provider}/callback` | `https://varo-staging.github.io/auth/callback` |
| Production | `https://api.varo.cloud/api/auth/oauth/{provider}/callback` | `https://varo.cloud/auth/callback` |

每个环境通常各自建一套 OAuth Client（或同一 Client 里加多条 redirect URI）。本地 mock（`VITE_USE_MOCK=true`）不访问真实 IdP，**不必**先完成上述注册即可点按钮联调前端。

---

## 接口

### POST /api/auth/request-otp

向指定邮箱发送 6 位验证码。验证码有效期 **10 分钟**，同一邮箱 **15 分钟内最多请求 3 次**。无论邮箱是否已注册，响应均为 `{ "sent": true }`（避免账号枚举）。

**请求体**
```json
{
  "email": "user@example.com",
  "turnstile_token": "0.KBtT-rMY9..."
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `email` | string | 是 | 用户邮箱 |
| `turnstile_token` | string | 是 | Cloudflare Turnstile 前端 widget 返回的一次性 token，后端须调用 [Siteverify API](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) 校验 |

**响应 200**
```json
{ "sent": true }
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 400 | `turnstile_token` 缺失、无效、已过期或已使用 |
| 422 | 邮箱格式不合法 |
| 429 | 请求过于频繁（15 分钟内超过 3 次） |

> 开发环境（`EMAIL_DRIVER=log`）下验证码会以 `INFO genflow: OTP for <email>: <code>` 形式输出到服务器日志；生产环境（`EMAIL_DRIVER=smtp`）通过邮件发送。

---

### POST /api/auth/verify-otp

校验验证码，成功后返回 access token 与 refresh token。验证码**单次有效**，最多允许 **5 次错误尝试**。若邮箱首次登录，则自动创建账号（初始 credits 余额为 0）。

**请求体**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "turnstile_token": "0.KBtT-rMY9..."
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `email` | string | 是 | 用户邮箱 |
| `code` | string | 是 | 6 位验证码 |
| `turnstile_token` | string | 是 | Cloudflare Turnstile token，须通过 Siteverify 校验 |

**响应 200**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "token_type": "bearer"
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 400 | 验证码无效、已过期或错误次数过多；或 `turnstile_token` 校验失败 |
| 422 | 邮箱格式不合法 |

---

### POST /api/auth/refresh

用 refresh token 换取新的 access token 与 refresh token，旧 refresh token 立即失效（轮换）。

**请求体**
```json
{ "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..." }
```

**响应 200**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "bmV3cmVmcmVzaHRva2Vu...",
  "token_type": "bearer"
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 401 | refresh token 无效、已撤销或已过期 |

---

### POST /api/auth/logout

撤销指定 refresh token，使其立即失效。

**请求体**
```json
{ "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..." }
```

**响应 200**
```json
{ "revoked": true }
```

---

### GET /api/auth/oauth/{provider}/authorize

发起 Google / GitHub OAuth。`provider` 为 `google` 或 `github`。

前端传入自身回调地址与 CSRF `state`；后端返回浏览器应跳转的 `authorize_url`（通常为 IdP 授权页，或后端再 302 到 IdP）。

**Query**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `redirect_uri` | string | 是 | 前端回调绝对地址，如 `https://varo.cloud/auth/callback` 或 `https://varo.cloud/zh-CN/auth/callback`。须在后端白名单内 |
| `state` | string | 是 | 前端生成的随机串；后端在 IdP 回调后原样带回 |

**响应 200**
```json
{
  "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 404 | 不支持的 `provider` |
| 422 | `redirect_uri` / `state` 缺失或非法 |

---

### GET /api/auth/oauth/{provider}/callback

**仅后端使用**（注册在 Google / GitHub 控制台的 Redirect URI）。前端不直接调用。

处理完成后对前端 `redirect_uri` 做 302：

- 成功：`?code=<one_time_login_code>&state=<原 state>`
- 失败：`?error=<code>&error_description=<msg>&state=<原 state>`（可选）

`code` 建议：**5 分钟内有效、仅可兑换一次**，服务端仅存哈希。

---

### POST /api/auth/oauth/exchange

用后端颁发的一次性登录码换取与 OTP 登录相同的 TokenPair。

**请求体**
```json
{ "code": "oauth_..." }
```

**响应 200**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "token_type": "bearer"
}
```

**错误码**
| 状态码 | 原因 |
|---|---|
| 400 | `code` 无效、已过期或已使用 |
| 422 | 请求体不合法 |
