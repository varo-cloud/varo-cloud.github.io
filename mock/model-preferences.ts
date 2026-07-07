import type { MockMethod } from 'vite-plugin-mock'
import type { ModelPreferences } from '../src/types'
import { findCatalogModelBySlug } from './models'
import {
  extractSlugFromPath,
  getPreferences,
  getToken,
  MAX_RECENT,
} from './_userPreferences'
import { success } from './_util'

function unauthorized() {
  return { code: 401, message: 'Unauthorized', data: null }
}

function buildUserModelsPage(
  slugs: string[],
  prefs: ModelPreferences,
  query: Record<string, string>,
) {
  const offset = Math.max(0, Number(query.offset) || 0)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))

  const items = slugs
    .map((slug) => findCatalogModelBySlug(slug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map((item) => ({
      ...item,
      is_favourited: prefs.favourites.includes(item.slug),
    }))

  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    offset,
    limit,
  }
}

export default [
  {
    url: '/api/user/model-preferences',
    method: 'get',
    response: ({
      headers,
      query,
    }: {
      headers: Record<string, string>
      query: Record<string, string>
    }) => {
      const token = getToken(headers)
      if (!token) return unauthorized()

      const prefs = getPreferences(token)
      return success(buildUserModelsPage(prefs.favourites, prefs, query))
    },
  },
  {
    url: '/api/user/recent-models',
    method: 'get',
    response: ({
      headers,
      query,
    }: {
      headers: Record<string, string>
      query: Record<string, string>
    }) => {
      const token = getToken(headers)
      if (!token) return unauthorized()

      const prefs = getPreferences(token)
      const slugs = prefs.recent.map((entry) => entry.id)
      return success(buildUserModelsPage(slugs, prefs, query))
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
