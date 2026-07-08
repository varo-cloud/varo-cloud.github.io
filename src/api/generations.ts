import { http, unwrap } from './http'
import type { GenerationDetail, GenerationRequest, GenerationResult, ModelCategory } from '@/types'

interface ApiGenerationResult {
  type: 'video' | 'image'
  output_url: string | null
  error: { message: string } | null
}

interface ApiGenerationDetail {
  task_id: string
  model: string
  category: ModelCategory
  capability: string
  status: 'queued' | 'processing' | 'succeeded' | 'failed'
  invocation_channel: string | null
  api_key_prefix: string | null
  cost_usd: number
  created_at: number
  request: GenerationRequest
  request_partial?: boolean
  result: ApiGenerationResult
}

function mapGenerationResult(raw: ApiGenerationResult): GenerationResult {
  return {
    type: raw.type,
    output_url: raw.output_url,
    error: raw.error,
  }
}

function mapGenerationDetail(raw: ApiGenerationDetail): GenerationDetail {
  return {
    taskId: raw.task_id,
    model: raw.model,
    category: raw.category,
    capability: raw.capability,
    status: raw.status,
    invocationChannel: raw.invocation_channel,
    apiKeyPrefix: raw.api_key_prefix,
    costUsd: raw.cost_usd,
    createdAt: raw.created_at,
    request: raw.request,
    requestPartial: raw.request_partial,
    result: mapGenerationResult(raw.result),
  }
}

export function fetchGenerationDetail(taskId: string) {
  return unwrap<ApiGenerationDetail>(http.get(`/generations/${encodeURIComponent(taskId)}`)).then(
    mapGenerationDetail,
  )
}
