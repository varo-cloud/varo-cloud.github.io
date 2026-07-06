import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'

interface MockHistoryEntry {
  task_id: string
  status: string
  cost_usd: number
  invocation_channel: string
  created_at: number
}

const historyBySlug = new Map<string, MockHistoryEntry[]>()

function getToken(headers: Record<string, string>): string | null {
  const auth = headers.authorization || headers.Authorization
  if (!auth) return null
  return auth.replace(/^Bearer\s+/i, '')
}

function unauthorized() {
  return { code: 401, message: 'Unauthorized', data: null }
}

function extractSlugFromHistoryPath(url: string): string | null {
  const match = url.match(/^\/api\/models\/([^/]+\/[^/?]+)\/history/)
  return match ? decodeURIComponent(match[1]!) : null
}

function seedHistory(slug: string): MockHistoryEntry[] {
  const now = Date.now()
  return [
    {
      task_id: `cgt-${slug.replace(/\//g, '-')}-001`,
      status: 'succeeded',
      cost_usd: 1.2,
      invocation_channel: 'playground',
      created_at: now - 3_600_000,
    },
    {
      task_id: `cgt-${slug.replace(/\//g, '-')}-002`,
      status: 'failed',
      cost_usd: 0,
      invocation_channel: 'api',
      created_at: now - 7_200_000,
    },
    {
      task_id: `cgt-${slug.replace(/\//g, '-')}-003`,
      status: 'succeeded',
      cost_usd: 0.84,
      invocation_channel: 'playground',
      created_at: now - 86_400_000,
    },
  ]
}

function getHistory(slug: string): MockHistoryEntry[] {
  if (!historyBySlug.has(slug)) {
    historyBySlug.set(slug, seedHistory(slug))
  }
  return historyBySlug.get(slug)!
}

export default [
  {
    url: /^\/api\/models\/[^/]+\/[^/?]+\/history$/,
    method: 'get',
    response: ({
      url,
      query,
      headers,
    }: {
      url: string
      query: Record<string, string>
      headers: Record<string, string>
    }) => {
      if (!getToken(headers)) return unauthorized()

      const slug = extractSlugFromHistoryPath(url)
      if (!slug) {
        return { code: 404, message: 'Model not found', data: null }
      }

      const offset = Math.max(0, Number(query.offset) || 0)
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
      const items = getHistory(slug)

      return success({
        items: items.slice(offset, offset + limit),
        total: items.length,
        offset,
        limit,
      })
    },
  },
] as unknown as MockMethod[]
