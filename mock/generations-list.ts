import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'

interface MockGenerationListItem {
  task_id: string
  model: string
  category: 'video' | 'image'
  capability: string
  status: 'queued' | 'processing' | 'succeeded' | 'failed'
  duration: number | null
  cost_usd: number
  invocation_channel: string | null
  api_key_prefix: string | null
  prompt: string | null
  output_url: string | null
  created_at: number
}

const MOCK_ITEMS: MockGenerationListItem[] = [
  {
    task_id: 'cgt-seedance-2.0-text-to-video-001',
    model: 'seedance-2.0/text-to-video',
    category: 'video',
    capability: 'text-to-video',
    status: 'succeeded',
    duration: 5,
    cost_usd: 1.2,
    invocation_channel: 'playground',
    api_key_prefix: null,
    prompt: 'A cinematic shot of waves crashing on a beach at sunset',
    output_url: 'https://cdn.example.com/sample.mp4',
    created_at: Date.now() - 3_600_000,
  },
  {
    task_id: 'cgt-seedance-2.0-text-to-video-002',
    model: 'seedance-2.0/text-to-video',
    category: 'video',
    capability: 'text-to-video',
    status: 'failed',
    duration: null,
    cost_usd: 0,
    invocation_channel: 'api',
    api_key_prefix: 'sk_live_abcd',
    prompt: 'A drone flyover of a mountain range',
    output_url: null,
    created_at: Date.now() - 7_200_000,
  },
  {
    task_id: 'cgt-flux-1/text-to-image-001',
    model: 'flux-1/text-to-image',
    category: 'image',
    capability: 'text-to-image',
    status: 'succeeded',
    duration: null,
    cost_usd: 0.04,
    invocation_channel: 'playground',
    api_key_prefix: null,
    prompt: 'A watercolor painting of a cat wearing a hat',
    output_url: 'https://cdn.example.com/sample.png',
    created_at: Date.now() - 86_400_000,
  },
  {
    task_id: 'cgt-seedance-2.0-text-to-video-004',
    model: 'seedance-2.0/text-to-video',
    category: 'video',
    capability: 'text-to-video',
    status: 'processing',
    duration: 5,
    cost_usd: 0,
    invocation_channel: 'playground',
    api_key_prefix: null,
    prompt: 'Neon city street at night in the rain',
    output_url: null,
    created_at: Date.now() - 120_000,
  },
]

function getToken(headers: Record<string, string>): string | null {
  const auth = headers.authorization || headers.Authorization
  if (!auth) return null
  return auth.replace(/^Bearer\s+/i, '')
}

function unauthorized() {
  return { code: 401, message: 'Unauthorized', data: null }
}

function badRequest(message: string) {
  return { code: 400, message, data: null }
}

export default [
  {
    url: /^\/api\/generations$/,
    method: 'get',
    response: ({
      query,
      headers,
    }: {
      query: Record<string, string>
      headers: Record<string, string>
    }) => {
      if (!getToken(headers)) return unauthorized()

      const createdFrom = query.created_from ? Number(query.created_from) : null
      const createdTo = query.created_to ? Number(query.created_to) : null

      if (
        createdFrom != null &&
        createdTo != null &&
        Number.isFinite(createdFrom) &&
        Number.isFinite(createdTo) &&
        createdFrom > createdTo
      ) {
        return badRequest('Invalid time range')
      }

      const category = query.category
      if (category && category !== 'video' && category !== 'image') {
        return badRequest('Invalid category')
      }

      let filtered = [...MOCK_ITEMS]

      if (category === 'video' || category === 'image') {
        filtered = filtered.filter((item) => item.category === category)
      }

      if (query.status) {
        filtered = filtered.filter((item) => item.status === query.status)
      }

      if (createdFrom != null && Number.isFinite(createdFrom)) {
        filtered = filtered.filter((item) => item.created_at >= createdFrom)
      }

      if (createdTo != null && Number.isFinite(createdTo)) {
        filtered = filtered.filter((item) => item.created_at <= createdTo)
      }

      filtered.sort((a, b) => b.created_at - a.created_at)

      const offset = Math.max(0, Number(query.offset) || 0)
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))

      return success({
        items: filtered.slice(offset, offset + limit),
        total: filtered.length,
        offset,
        limit,
      })
    },
  },
] as unknown as MockMethod[]
