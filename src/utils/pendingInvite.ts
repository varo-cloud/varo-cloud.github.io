const STORAGE_KEY = 'varo_pending_invite_code'

export function savePendingInviteCode(code: string): void {
  const trimmed = code.trim()
  if (!trimmed) return
  sessionStorage.setItem(STORAGE_KEY, trimmed)
}

export function readPendingInviteCode(): string | null {
  const value = sessionStorage.getItem(STORAGE_KEY)
  return value?.trim() || null
}

export function clearPendingInviteCode(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

/** Prefer binding the pending invite code right after login. */
export function resolvePostLoginPath(
  localePath: (path: string) => string,
  fallback: string | null,
): string | null {
  const code = readPendingInviteCode()
  if (code) return localePath(`/invite/${encodeURIComponent(code)}`)
  return fallback
}
