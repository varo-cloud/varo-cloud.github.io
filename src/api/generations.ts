import { http, unwrap } from './http'
import type {
  FetchGenerationsParams,
  GenerationDetail,
  GenerationListItem,
  GenerationRequest,
  GenerationResult,
  ModelCategory,
} from '@/types'

interface ApiGenerationResult {
  type: 'video' | 'image' | 'text'
  output_url: string | null
  text?: string | null
  content?: string | null
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
  const text =
    (typeof raw.text === 'string' && raw.text.trim() ? raw.text : null)
    ?? (typeof raw.content === 'string' && raw.content.trim() ? raw.content : null)

  return {
    type: raw.type,
    output_url: raw.output_url,
    text,
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

interface ApiGenerationListItem {
  task_id: string
  model: string
  category: ModelCategory
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

interface ApiGenerationListPage {
  items: ApiGenerationListItem[]
  total: number
  offset: number
  limit: number
}

function mapGenerationListItem(raw: ApiGenerationListItem): GenerationListItem {
  return {
    taskId: raw.task_id,
    model: raw.model,
    category: raw.category,
    capability: raw.capability,
    status: raw.status,
    duration: raw.duration,
    costUsd: raw.cost_usd,
    invocationChannel: raw.invocation_channel,
    apiKeyPrefix: raw.api_key_prefix,
    prompt: raw.prompt,
    outputUrl: raw.output_url,
    createdAt: raw.created_at,
  }
}

export function fetchGenerations(params?: FetchGenerationsParams) {
  const query: Record<string, string | number> = {}

  if (params?.offset != null) query.offset = params.offset
  if (params?.limit != null) query.limit = params.limit
  if (params?.createdFrom != null) query.created_from = params.createdFrom
  if (params?.createdTo != null) query.created_to = params.createdTo
  if (params?.status) query.status = params.status
  if (params?.model) query.model = params.model
  if (params?.invocationChannel) query.invocation_channel = params.invocationChannel
  if (params?.category) query.category = params.category

  return unwrap<ApiGenerationListPage>(http.get('/generations', { params: query })).then(
    (raw) => ({
      items: (raw.items ?? []).map(mapGenerationListItem),
      total: raw.total ?? raw.items?.length ?? 0,
      offset: raw.offset ?? params?.offset ?? 0,
      limit: raw.limit ?? params?.limit ?? 20,
    }),
  )
}
