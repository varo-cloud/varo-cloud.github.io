import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'

const MAY_12_2026 = Date.parse('2026-05-12T10:00:00Z')
const TWO_MINUTES_AGO = Date.now() - 2 * 60 * 1000

let apiKeys: Array<{
  id: string
  name: string
  keyMasked: string
  createdAt: number
  status: 'active' | 'revoked'
  totalCalls: number
  totalSpendUsd: number
  lastUsedAt: number | null
}> = [
  {
    id: 'key-1',
    name: 'production',
    keyMasked: '******BneyZM',
    createdAt: MAY_12_2026,
    status: 'active',
    totalCalls: 14208,
    totalSpendUsd: 84.21,
    lastUsedAt: TWO_MINUTES_AGO,
  },
  {
    id: 'key-2',
    name: 'staging',
    keyMasked: '******xK9pQ2',
    createdAt: MAY_12_2026,
    status: 'active',
    totalCalls: 14208,
    totalSpendUsd: 84.21,
    lastUsedAt: TWO_MINUTES_AGO,
  },
  {
    id: 'key-3',
    name: 'development',
    keyMasked: '******mN4vR8',
    createdAt: MAY_12_2026,
    status: 'revoked',
    totalCalls: 14208,
    totalSpendUsd: 84.21,
    lastUsedAt: TWO_MINUTES_AGO,
  },
]

export default [
  {
    url: '/api/api-keys',
    method: 'get',
    response: () => success(apiKeys),
  },
  {
    url: '/api/api-keys',
    method: 'post',
    response: ({ body }: { body: { name: string } }) => {
      const createdAt = Date.now()
      const newKey = {
        id: `key-${createdAt}`,
        name: body.name || 'Untitled',
        key: `wsk_live_${Math.random().toString(36).slice(2, 18)}`,
        createdAt,
      }
      apiKeys = [
        {
          id: newKey.id,
          name: newKey.name,
          keyMasked: `******${newKey.key.slice(-6)}`,
          createdAt: newKey.createdAt,
          status: 'active' as const,
          totalCalls: 0,
          totalSpendUsd: 0,
          lastUsedAt: null,
        },
        ...apiKeys,
      ]
      return success(newKey)
    },
  },
  {
    url: '/api/api-keys/:id',
    method: 'delete',
    response: ({ query }: { query: Record<string, string> }) => {
      apiKeys = apiKeys.filter((item) => item.id !== query.id)
      return success(null)
    },
  },
] as MockMethod[]
