const TOKEN_KEY = 'auth_token'

/** 本地 dev 固定 token（VITE_DEV_BEARER_TOKEN），优先于 localStorage，避免旧 token 导致 401 */
export function resolveRequestBearerToken(): string | null {
  if (import.meta.env.DEV) {
    const devToken = import.meta.env.VITE_DEV_BEARER_TOKEN?.trim()
    if (devToken) return devToken
  }
  return localStorage.getItem(TOKEN_KEY)
}
