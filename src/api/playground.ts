import { http, unwrap } from './http'
import { buildPlaygroundRunBody } from '@/utils/playground-request-snippets'
import { resolveMediaPreviewKind } from '@/utils/mediaPreview'
import type { GenerationStatus, PlaygroundGenerationResult, PlaygroundQuote, PlaygroundQuotePayload } from '@/types'
import type { SchemaFormValues } from '@/types/schema'

interface ApiPlaygroundGeneration {
  id: string
  object?: 'generation'
  status: string
  model: string
  created_at: number
  output?: {
    type?: 'image' | 'video'
    url?: string
  }
  output_url?: string
  progress?: number
  usage?: {
    cost_usd: number
  }
  error?: {
    message?: string
  }
}

interface ApiPlaygroundBatchCreateResponse {
  ids: string[]
  batch_size: number
}

export interface PlaygroundGenerationSnapshot {
  id: string
  status: Exclude<GenerationStatus, 'idle'>
  model: string
  createdAt: number
  progress?: number
  outputUrl?: string
  outputType?: 'image' | 'video'
  usage?: {
    cost_usd: number
  }
  errorMessage?: string
}

function normalizeCreatedAt(value: number): number {
  return value > 1_000_000_000_000 ? Math.floor(value / 1000) : value
}

function mapApiStatus(status: string): Exclude<GenerationStatus, 'idle'> {
  if (status === 'queued') return 'queued'
  if (status === 'running' || status === 'processing') return 'processing'
  if (status === 'succeeded' || status === 'completed') return 'completed'
  if (status === 'failed') return 'failed'
  return 'processing'
}

function resolveOutputUrl(raw: ApiPlaygroundGeneration): string | undefined {
  return raw.output?.url ?? raw.output_url
}

function mapPlaygroundGenerationSnapshot(raw: ApiPlaygroundGeneration): PlaygroundGenerationSnapshot {
  const outputUrl = resolveOutputUrl(raw)
  const outputType = raw.output?.type
    ?? (outputUrl ? resolveMediaPreviewKind(outputUrl) as 'image' | 'video' : undefined)

  return {
    id: raw.id,
    status: mapApiStatus(raw.status),
    model: raw.model,
    createdAt: normalizeCreatedAt(raw.created_at),
    progress: raw.progress,
    outputUrl,
    outputType,
    usage: raw.usage,
    errorMessage: raw.error?.message,
  }
}

export function mapPlaygroundGenerationResult(
  snapshot: PlaygroundGenerationSnapshot,
  fallbackUnitCostUsd = 0,
): PlaygroundGenerationResult {
  return {
    id: snapshot.id,
    object: 'generation',
    status: snapshot.status === 'failed' ? 'failed' : 'completed',
    model: snapshot.model,
    created_at: snapshot.createdAt,
    output: {
      type: snapshot.outputType ?? 'image',
      url: snapshot.outputUrl ?? '',
    },
    usage: snapshot.usage ?? { cost_usd: fallbackUnitCostUsd },
  }
}

function mapCreateResponse(
  raw: ApiPlaygroundGeneration | ApiPlaygroundBatchCreateResponse,
): PlaygroundGenerationSnapshot[] {
  if ('ids' in raw && Array.isArray(raw.ids)) {
    return raw.ids.map((id) => ({
      id,
      status: 'queued' as const,
      model: '',
      createdAt: Date.now(),
    }))
  }

  return [mapPlaygroundGenerationSnapshot(raw as ApiPlaygroundGeneration)]
}

interface ApiPlaygroundQuote {
  cost_usd: number
}

function mapPlaygroundQuote(raw: ApiPlaygroundQuote): PlaygroundQuote {
  return {
    cost_usd: raw.cost_usd,
  }
}

export function fetchPlaygroundQuote(slug: string, payload: PlaygroundQuotePayload) {
  return unwrap<ApiPlaygroundQuote>(
    http.post(`/models/${slug}/quote`, {
      input: payload.input,
    }),
  ).then(mapPlaygroundQuote)
}

export function createPlaygroundGeneration(
  modelSlug: string,
  input: SchemaFormValues,
  batchSize = 1,
) {
  return unwrap<ApiPlaygroundGeneration | ApiPlaygroundBatchCreateResponse>(
    http.post('/playground/generations', buildPlaygroundRunBody(modelSlug, input, batchSize)),
  ).then(mapCreateResponse)
}

export function fetchPlaygroundGeneration(id: string) {
  return unwrap<ApiPlaygroundGeneration>(http.get(`/playground/generations/${id}`)).then(
    mapPlaygroundGenerationSnapshot,
  )
}
