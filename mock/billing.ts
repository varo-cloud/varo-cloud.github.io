import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'

const transactions = [
  {
    id: 'tx-1',
    type: 'topup' as const,
    amountUsd: 20,
    description: 'Stripe top-up',
    createdAt: '2026-06-01T09:00:00Z',
  },
  {
    id: 'tx-2',
    type: 'usage' as const,
    amountUsd: -1.02,
    description: 'Seedance 2.0 T2V — 720p 5s',
    createdAt: '2026-06-02T14:30:00Z',
  },
  {
    id: 'tx-3',
    type: 'usage' as const,
    amountUsd: -0.85,
    description: 'Kling T2V — 480p 4s',
    createdAt: '2026-06-05T11:15:00Z',
  },
  {
    id: 'tx-4',
    type: 'topup' as const,
    amountUsd: 50,
    description: 'Stripe top-up',
    createdAt: '2026-06-10T16:00:00Z',
  },
]

export default [
  {
    url: '/api/billing/balance',
    method: 'get',
    response: () => success({ balanceUsd: 68.13 }),
  },
  {
    url: '/api/billing/transactions',
    method: 'get',
    response: () => success(transactions),
  },
] as MockMethod[]
