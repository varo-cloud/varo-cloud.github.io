import { http, unwrap } from './http'
import type { PlaygroundQuote, PlaygroundQuotePayload } from '@/types'

interface ApiPlaygroundQuote {
  cost_usd: number
  standard_cost_usd?: number | null
  discount_percent?: number | null
  unit_cost_usd?: number | null
  batch_size: number
  runs_per_ten_usd?: number | null
  breakdown?: PlaygroundQuote['breakdown']
}

function mapPlaygroundQuote(raw: ApiPlaygroundQuote): PlaygroundQuote {
  return {
    cost_usd: raw.cost_usd,
    standard_cost_usd: raw.standard_cost_usd ?? undefined,
    discount_percent: raw.discount_percent ?? undefined,
    unit_cost_usd: raw.unit_cost_usd ?? undefined,
    batch_size: raw.batch_size,
    runs_per_ten_usd: raw.runs_per_ten_usd ?? undefined,
    breakdown: raw.breakdown,
  }
}

export function fetchPlaygroundQuote(modelId: string, payload: PlaygroundQuotePayload) {
  return unwrap<ApiPlaygroundQuote>(
    http.post(`/models/${modelId}/quote`, {
      input: payload.input,
      batch_size: payload.batch_size ?? 1,
    }),
  ).then(mapPlaygroundQuote)
}
