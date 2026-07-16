import { getOAuthAuthorizeUrl } from '@/api/auth'
import { assetUrl } from '@/utils/assetUrl'
import type { OAuthProvider } from '@/types'

const OAUTH_PENDING_KEY = 'varo:oauth-pending'
const OAUTH_PENDING_TTL_MS = 15 * 60 * 1000

export interface OAuthPendingState {
  state: string
  provider: OAuthProvider
  /** App path to land on after login (may include locale prefix / query) */
  returnTo: string | null
  createdAt: number
}

function randomState(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`
}

/** Absolute callback URL registered with the OAuth backend / providers. */
export function buildOAuthCallbackUrl(callbackPath: string): string {
  const relative = assetUrl(callbackPath.startsWith('/') ? callbackPath : `/${callbackPath}`)
  return new URL(relative, window.location.origin).href
}

export function saveOAuthPending(pending: Omit<OAuthPendingState, 'createdAt' | 'state'> & { state?: string }) {
  const value: OAuthPendingState = {
    state: pending.state ?? randomState(),
    provider: pending.provider,
    returnTo: pending.returnTo,
    createdAt: Date.now(),
  }
  try {
    sessionStorage.setItem(OAUTH_PENDING_KEY, JSON.stringify(value))
  } catch {
    // ignore storage errors
  }
  return value
}

export function readOAuthPending(): OAuthPendingState | null {
  try {
    const raw = sessionStorage.getItem(OAUTH_PENDING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OAuthPendingState
    if (!parsed?.state || !parsed?.provider || typeof parsed.createdAt !== 'number') {
      return null
    }
    if (Date.now() - parsed.createdAt > OAUTH_PENDING_TTL_MS) {
      clearOAuthPending()
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearOAuthPending() {
  try {
    sessionStorage.removeItem(OAUTH_PENDING_KEY)
  } catch {
    // ignore storage errors
  }
}

/**
 * Start Google / GitHub OAuth: ask backend for authorize_url, then full-page redirect.
 */
export async function startOAuthLogin(
  provider: OAuthProvider,
  options: { callbackPath: string; returnTo?: string | null },
) {
  const pending = saveOAuthPending({
    provider,
    returnTo: options.returnTo ?? null,
  })
  const redirectUri = buildOAuthCallbackUrl(options.callbackPath)
  const { authorize_url } = await getOAuthAuthorizeUrl(provider, {
    redirect_uri: redirectUri,
    state: pending.state,
  })

  if (!authorize_url) {
    clearOAuthPending()
    throw new Error('Missing authorize_url')
  }

  window.location.assign(authorize_url)
}
