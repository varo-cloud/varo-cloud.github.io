import type { ModelPreferences } from '../src/types'

const MAX_RECENT = 50

const preferencesByToken = new Map<string, ModelPreferences>()

export function getToken(headers: Record<string, string>): string | null {
  const auth = headers.authorization || headers.Authorization
  if (!auth) return null
  return auth.replace(/^Bearer\s+/i, '')
}

export function emptyPreferences(): ModelPreferences {
  return { favourites: [], recent: [] }
}

export function getPreferences(token: string): ModelPreferences {
  if (!preferencesByToken.has(token)) {
    preferencesByToken.set(token, emptyPreferences())
  }
  return preferencesByToken.get(token)!
}

export function resolveIsFavourited(headers: Record<string, string>, slug: string): boolean {
  const token = getToken(headers)
  if (!token) return false
  return getPreferences(token).favourites.includes(slug)
}

export function extractSlugFromPath(url: string, action: string): string | null {
  const match = url.match(new RegExp(`^/api/models/([^/]+/[^/?]+)/${action}`))
  return match ? decodeURIComponent(match[1]!) : null
}

export { MAX_RECENT }
