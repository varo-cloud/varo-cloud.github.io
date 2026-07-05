import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'
import { findCatalogModelBySlug } from './models'

const RESOLUTION_MULTIPLIERS: Record<string, number> = {
  '480p': 1,
  '720p': 2,
  '1080p': 5,
  '4k': 10,
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100
}

function calculateQuote(slug: string, input: Record<string, unknown>): number {
  const model = findCatalogModelBySlug(slug)
  const baseRate = model?.starting_price_usd ?? 0.072
  const duration = Math.min(15, Math.max(4, Number(input.duration) || 5))
  const resolution = typeof input.resolution === 'string' ? input.resolution : '720p'
  const multiplier = RESOLUTION_MULTIPLIERS[resolution] ?? 1

  if (slug === 'seedance-2.0/text-to-video') {
    return roundUsd(0.6 * (duration / 5) * multiplier)
  }

  return roundUsd(baseRate * duration)
}

function extractSlugFromPath(url: string): string | null {
  const match = url.match(/^\/api\/models\/([^/]+\/[^/?]+)\/quote/)
  return match ? decodeURIComponent(match[1]!) : null
}

export function calculatePlaygroundQuote(
  slug: string,
  input: Record<string, unknown>,
  _batchSize: number,
): { cost_usd: number } {
  return { cost_usd: calculateQuote(slug, input) }
}

export default [
  {
    url: /^\/api\/models\/[^/]+\/[^/?]+\/quote$/,
    method: 'post',
    response: ({
      url,
      body,
    }: {
      url: string
      body: { input?: Record<string, unknown>; batch_size?: number }
    }) => {
      const slug = extractSlugFromPath(url)
      const model = slug ? findCatalogModelBySlug(slug) : undefined
      if (!model) {
        return { code: 404, message: 'Model not found', data: null }
      }

      if (!body?.input || typeof body.input !== 'object') {
        return { code: 400, message: 'input is required', data: null }
      }

      const quote = calculatePlaygroundQuote(slug!, body.input, body.batch_size ?? 1)
      return success(quote)
    },
  },
] as unknown as MockMethod[]
