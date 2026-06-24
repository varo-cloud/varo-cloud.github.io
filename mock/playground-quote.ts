import type { MockMethod } from 'vite-plugin-mock'
import type { PlaygroundQuote, PlaygroundQuoteBreakdown } from '../src/types'
import { success } from './_util'
import { findCatalogModelById } from './models'

const RESOLUTION_MULTIPLIERS: Record<string, number> = {
  '480p': 1,
  '720p': 2,
  '1080p': 5,
  '4k': 10,
}

const REF_VIDEO_RATE_PER_SECOND: Record<string, number> = {
  '480p': 0.075,
  '720p': 0.15,
  '1080p': 0.375,
  '4k': 0.75,
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100
}

function estimateReferenceVideoSeconds(referenceVideos: unknown): number {
  if (!Array.isArray(referenceVideos)) return 0

  const count = referenceVideos.filter((item) => typeof item === 'string' && item.trim()).length
  if (count === 0) return 0

  return Math.min(15, Math.max(2, count * 5))
}

function calculateSeedanceT2vQuote(
  input: Record<string, unknown>,
  batchSize: number,
  discountPercent: number,
): PlaygroundQuote {
  const duration = Math.min(15, Math.max(4, Number(input.duration) || 5))
  const resolution = typeof input.resolution === 'string' ? input.resolution : '720p'
  const referenceVideos = input.reference_videos
  const hasReferenceVideos =
    Array.isArray(referenceVideos) &&
    referenceVideos.some((item) => typeof item === 'string' && item.trim())

  let unitCost: number
  let breakdown: PlaygroundQuoteBreakdown

  if (hasReferenceVideos) {
    const inputSeconds = estimateReferenceVideoSeconds(referenceVideos)
    const billedSeconds = inputSeconds + duration
    const rate = REF_VIDEO_RATE_PER_SECOND[resolution] ?? REF_VIDEO_RATE_PER_SECOND['720p']
    unitCost = roundUsd(billedSeconds * rate)
    breakdown = {
      billing_mode: 'input_plus_output_duration',
      billed_seconds: billedSeconds,
      resolution,
      rate_per_second_usd: rate,
      has_reference_videos: true,
    }
  } else {
    const multiplier = RESOLUTION_MULTIPLIERS[resolution] ?? 1
    unitCost = roundUsd(0.6 * (duration / 5) * multiplier)
    breakdown = {
      billing_mode: 'output_duration',
      billed_seconds: duration,
      resolution,
      rate_per_second_usd: roundUsd(unitCost / duration),
      has_reference_videos: false,
    }
  }

  const costUsd = roundUsd(unitCost * batchSize)
  const standardCostUsd =
    discountPercent > 0 ? roundUsd(costUsd / (1 - discountPercent / 100)) : undefined

  return {
    cost_usd: costUsd,
    standard_cost_usd: standardCostUsd,
    discount_percent: discountPercent > 0 ? discountPercent : undefined,
    unit_cost_usd: unitCost,
    batch_size: batchSize,
    runs_per_ten_usd: unitCost > 0 ? Math.max(1, Math.floor(10 / unitCost)) : undefined,
    breakdown,
  }
}

function calculateGenericQuote(
  modelId: string,
  input: Record<string, unknown>,
  batchSize: number,
): PlaygroundQuote {
  const model = findCatalogModelById(modelId)
  const discountPercent = model?.discount_percent ?? 0
  let unitCost = model?.per_run_price_usd ?? model?.starting_price_usd ?? 0.36

  const duration = Number(input.duration)
  if (Number.isFinite(duration) && duration > 0) {
    const defaultDuration = 5
    unitCost = roundUsd(unitCost * (duration / defaultDuration))
  }

  const costUsd = roundUsd(unitCost * batchSize)
  const standardCostUsd =
    discountPercent > 0 ? roundUsd(costUsd / (1 - discountPercent / 100)) : undefined

  return {
    cost_usd: costUsd,
    standard_cost_usd: standardCostUsd,
    discount_percent: discountPercent > 0 ? discountPercent : undefined,
    unit_cost_usd: unitCost,
    batch_size: batchSize,
    runs_per_ten_usd: unitCost > 0 ? Math.max(1, Math.floor(10 / unitCost)) : undefined,
    breakdown: {
      billing_mode: 'per_request',
    },
  }
}

export function calculatePlaygroundQuote(
  modelId: string,
  input: Record<string, unknown>,
  batchSize: number,
): PlaygroundQuote {
  const model = findCatalogModelById(modelId)
  const discountPercent = model?.discount_percent ?? 0
  const normalizedBatch = Math.min(4, Math.max(1, Math.floor(batchSize) || 1))

  if (modelId === 'seedance-t2v') {
    return calculateSeedanceT2vQuote(input, normalizedBatch, discountPercent)
  }

  return calculateGenericQuote(modelId, input, normalizedBatch)
}

export default [
  {
    url: '/api/models/:id/quote',
    method: 'post',
    response: ({
      query,
      body,
    }: {
      query: Record<string, string>
      body: { input?: Record<string, unknown>; batch_size?: number }
    }) => {
      const model = findCatalogModelById(query.id)
      if (!model) {
        return { code: 404, message: 'Model not found', data: null }
      }

      if (!body?.input || typeof body.input !== 'object') {
        return { code: 400, message: 'input is required', data: null }
      }

      const batchSize = body.batch_size ?? 1
      const quote = calculatePlaygroundQuote(query.id, body.input, batchSize)

      return success(quote)
    },
  },
] as MockMethod[]
