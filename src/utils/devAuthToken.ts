const TOKEN_KEY = 'auth_token'

/**
 * 解析请求用 access token：
 * 1. 优先 localStorage（OTP 登录 + refresh 续期）
 * 2. 未登录时 dev 环境 fallback 到 VITE_DEV_BEARER_TOKEN
 */
export function resolveRequestBearerToken(): string | null {
  const stored = localStorage.getItem(TOKEN_KEY)
  if (stored) return stored

  if (import.meta.env.DEV) {
    const devToken = import.meta.env.VITE_DEV_BEARER_TOKEN?.trim()
    if (devToken) return devToken
  }

  return null
}
