import { http, unwrap } from './http'
import { buildPlaygroundRunBody } from '@/utils/playground-request-snippets'
import { resolveMediaPreviewKind } from '@/utils/mediaPreview'
import { normalizeModelSlug } from '@/utils/model-slug'
import type { GenerationStatus, PlaygroundGenerationResult, PlaygroundQuote, PlaygroundQuotePayload } from '@/types'
import type { SchemaFormValues } from '@/types/schema'

interface ApiPlaygroundGeneration {
  id: string
  object?: 'generation'
  status: string
  model: string
  created_at: number
  output?: {
    type?: 'image' | 'video' | 'text'
    url?: string
    text?: string
    content?: string
  }
  output_url?: string
  output_text?: string
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
  outputText?: string
  outputType?: 'image' | 'video' | 'text'
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

function resolveOutputText(raw: ApiPlaygroundGeneration): string | undefined {
  const fromOutput = raw.output?.text ?? raw.output?.content
  if (typeof fromOutput === 'string' && fromOutput.trim()) return fromOutput
  if (typeof raw.output_text === 'string' && raw.output_text.trim()) return raw.output_text
  return undefined
}

function mapPlaygroundGenerationSnapshot(raw: ApiPlaygroundGeneration): PlaygroundGenerationSnapshot {
  const outputUrl = resolveOutputUrl(raw)
  const outputText = resolveOutputText(raw)
  const outputType =
    raw.output?.type
    ?? (outputText ? 'text' as const : undefined)
    ?? (outputUrl ? resolveMediaPreviewKind(outputUrl) as 'image' | 'video' : undefined)

  return {
    id: raw.id,
    status: mapApiStatus(raw.status),
    model: raw.model,
    createdAt: normalizeCreatedAt(raw.created_at),
    progress: raw.progress,
    outputUrl,
    outputText,
    outputType,
    usage: raw.usage,
    errorMessage: raw.error?.message,
  }
}

export function mapPlaygroundGenerationResult(
  snapshot: PlaygroundGenerationSnapshot,
  fallbackUnitCostUsd = 0,
): PlaygroundGenerationResult {
  const type = snapshot.outputType ?? (snapshot.outputText ? 'text' : 'image')
  return {
    id: snapshot.id,
    object: 'generation',
    status: snapshot.status === 'failed' ? 'failed' : 'completed',
    model: snapshot.model,
    created_at: snapshot.createdAt,
    output: {
      type,
      url: snapshot.outputUrl ?? '',
      text: snapshot.outputText,
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
    http.post(`/models/${normalizeModelSlug(slug)}/quote`, {
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
