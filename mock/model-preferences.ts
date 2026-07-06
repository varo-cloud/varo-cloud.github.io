import type { MockMethod } from 'vite-plugin-mock'
import type { ModelPreferences } from '../src/types'
import { findCatalogModelBySlug } from './models'
import { success } from './_util'

const MAX_RECENT = 50

const preferencesByToken = new Map<string, ModelPreferences>()

function getToken(headers: Record<string, string>): string | null {
  const auth = headers.authorization || headers.Authorization
  if (!auth) return null
  return auth.replace(/^Bearer\s+/i, '')
}

function emptyPreferences(): ModelPreferences {
  return { favourites: [], recent: [] }
}

function getPreferences(token: string): ModelPreferences {
  if (!preferencesByToken.has(token)) {
    preferencesByToken.set(token, emptyPreferences())
  }
  return preferencesByToken.get(token)!
}

function unauthorized() {
  return { code: 401, message: 'Unauthorized', data: null }
}

function extractSlugFromPath(url: string, action: string): string | null {
  const match = url.match(new RegExp(`^/api/models/([^/]+/[^/?]+)/${action}`))
  return match ? decodeURIComponent(match[1]!) : null
}

export default [
  {
    url: '/api/user/model-preferences',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token) return unauthorized()
      return success(getPreferences(token))
    },
  },
  {
    url: '/api/user/recent-models',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const token = getToken(headers)
      if (!token) return unauthorized()

      const prefs = getPreferences(token)
      const items = prefs.recent
        .map((entry) => findCatalogModelBySlug(entry.id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))

      return success(items)
    },
  },
  {
    url: /^\/api\/models\/[^/]+\/[^/?]+\/favourite$/,
    method: 'post',
    response: ({
      headers,
      url,
    }: {
      headers: Record<string, string>
      url: string
    }) => {
      const token = getToken(headers)
      if (!token) return unauthorized()

      const slug = extractSlugFromPath(url, 'favourite')
      if (!slug) return { code: 404, message: 'Model not found', data: null }

      const prefs = getPreferences(token)
      if (!prefs.favourites.includes(slug)) {
        prefs.favourites = [...prefs.favourites, slug]
      }
      return success(prefs)
    },
  },
  {
    url: /^\/api\/models\/[^/]+\/[^/?]+\/favourite$/,
    method: 'delete',
    response: ({
      headers,
      url,
    }: {
      headers: Record<string, string>
      url: string
    }) => {
      const token = getToken(headers)
      if (!token) return unauthorized()

      const slug = extractSlugFromPath(url, 'favourite')
      if (!slug) return success(getPreferences(token))

      const prefs = getPreferences(token)
      prefs.favourites = prefs.favourites.filter((id) => id !== slug)
      return success(prefs)
    },
  },
  {
    url: /^\/api\/models\/[^/]+\/[^/?]+\/visit$/,
    method: 'post',
    response: ({
      headers,
      url,
    }: {
      headers: Record<string, string>
      url: string
    }) => {
      const token = getToken(headers)
      if (!token) return unauthorized()

      const slug = extractSlugFromPath(url, 'visit')
      if (!slug) return { code: 404, message: 'Model not found', data: null }

      const prefs = getPreferences(token)
      const filtered = prefs.recent.filter((entry) => entry.id !== slug)
      prefs.recent = [{ id: slug, visitedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT)
      return success(prefs)
    },
  },
] as unknown as MockMethod[]
