import type { MockMethod } from 'vite-plugin-mock'
import type { ModelPreferences } from '../src/types'
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
    url: '/api/models/:id/favourite',
    method: 'post',
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
      if (!prefs.favourites.includes(query.id)) {
        prefs.favourites = [...prefs.favourites, query.id]
      }
      return success(prefs)
    },
  },
  {
    url: '/api/models/:id/favourite',
    method: 'delete',
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
      prefs.favourites = prefs.favourites.filter((id) => id !== query.id)
      return success(prefs)
    },
  },
  {
    url: '/api/models/:id/visit',
    method: 'post',
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
      const filtered = prefs.recent.filter((entry) => entry.id !== query.id)
      prefs.recent = [{ id: query.id, visitedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT)
      return success(prefs)
    },
  },
] as MockMethod[]
