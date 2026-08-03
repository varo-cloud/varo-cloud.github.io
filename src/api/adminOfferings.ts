import { http, unwrap } from './http'
import { adminApiBaseUrl } from '@/utils/apiBaseUrl'
import {
  exampleFromGeneration,
  exampleToApiPayload,
  mapApiExample,
  parseOfferingModelId,
  suggestExampleId,
  upsertExample,
  type OfferingExample,
} from '@/utils/offeringExamples'

const adminRequestConfig = { baseURL: adminApiBaseUrl() }

interface ApiBaseModel {
  seq_id: number
  slug: string
}

interface ApiOffering {
  seq_id: number
  model_id: number
  capability: string
  examples: Array<Record<string, unknown>>
}

interface ApiAdminGenerationDetail {
  task_id: string
  model: string
  status: string
  request?: Record<string, unknown>
  input?: Record<string, unknown>
  request_partial?: boolean
  output_url?: string | null
  result?: {
    type?: string
    output_url?: string | null
  } | null
}

export interface AdminOffering {
  seqId: number
  modelId: number
  capability: string
  examples: OfferingExample[]
}

export class AdminOfferingError extends Error {
  readonly code:
    | 'invalid_model'
    | 'offering_not_found'
    | 'not_completed'
    | 'no_output'
    | 'request_failed'

  constructor(
    message: string,
    code: AdminOfferingError['code'],
  ) {
    super(message)
    this.name = 'AdminOfferingError'
    this.code = code
  }
}

function mapOffering(raw: ApiOffering): AdminOffering {
  return {
    seqId: raw.seq_id,
    modelId: raw.model_id,
    capability: raw.capability,
    examples: (raw.examples ?? []).map(mapApiExample),
  }
}

function normalizeStatus(status: string) {
  if (status === 'succeeded' || status === 'completed') return 'completed'
  return status
}

function resolveOutputUrl(detail: ApiAdminGenerationDetail): string {
  const fromResult = detail.result?.output_url?.trim()
  if (fromResult) return fromResult
  return detail.output_url?.trim() ?? ''
}

function resolveInput(detail: ApiAdminGenerationDetail): Record<string, unknown> {
  return { ...(detail.request ?? detail.input ?? {}) }
}

async function fetchAdminGenerationDetail(taskId: string): Promise<ApiAdminGenerationDetail> {
  return unwrap<ApiAdminGenerationDetail>(
    http.get(`/admin/generations/${encodeURIComponent(taskId)}`, adminRequestConfig),
  )
}

async function fetchAdminBaseModels(): Promise<ApiBaseModel[]> {
  return unwrap<ApiBaseModel[]>(http.get('/admin/base-models', adminRequestConfig))
}

async function fetchAdminOfferings(modelId?: number): Promise<AdminOffering[]> {
  const params = modelId != null ? { model_id: modelId } : undefined
  const raw = await unwrap<ApiOffering[]>(
    http.get('/admin/model-offerings', { ...adminRequestConfig, params }),
  )
  return raw.map(mapOffering)
}

async function updateAdminOffering(
  seqId: number,
  payload: Record<string, unknown>,
): Promise<AdminOffering> {
  const raw = await unwrap<ApiOffering>(
    http.put(`/admin/model-offerings/${seqId}`, payload, adminRequestConfig),
  )
  return mapOffering(raw)
}

async function resolveOffering(model: string): Promise<AdminOffering> {
  const parsed = parseOfferingModelId(model)
  if (!parsed) {
    throw new AdminOfferingError('Invalid model format', 'invalid_model')
  }

  // Prefer list endpoints over GET /admin/base-models/{slug} (path slug lookups can 404).
  const baseModels = await fetchAdminBaseModels()
  const baseModel = baseModels.find((m) => m.slug === parsed.slug)
  if (!baseModel) {
    throw new AdminOfferingError(`Offering not found: ${model}`, 'offering_not_found')
  }

  const offerings = await fetchAdminOfferings(baseModel.seq_id)
  const offering = offerings.find((o) => o.capability === parsed.capability)
  if (!offering) {
    throw new AdminOfferingError(`Offering not found: ${model}`, 'offering_not_found')
  }
  return offering
}

/**
 * Promote a generation to a Playground example:
 * 1. GET `/admin/generations/{taskId}`
 * 2. Resolve offering seq_id via base-models + model-offerings lists
 * 3. PUT `/admin/model-offerings/{seqId}` with `{ examples: [...] }`
 */
export async function setGenerationAsExample(
  taskId: string,
): Promise<{ exampleId: string; replaced: boolean; model: string }> {
  try {
    const detail = await fetchAdminGenerationDetail(taskId)

    if (normalizeStatus(detail.status) !== 'completed') {
      throw new AdminOfferingError('Generation is not completed', 'not_completed')
    }

    const outputUrl = resolveOutputUrl(detail)
    if (!outputUrl) {
      throw new AdminOfferingError('Missing output URL', 'no_output')
    }

    const model = detail.model?.trim() ?? ''
    const input = resolveInput(detail)
    const offering = await resolveOffering(model)

    const suggestedId = suggestExampleId(input, detail.task_id)
    const existing = offering.examples.find((e) => e.id === suggestedId)
    const example = exampleFromGeneration(
      input,
      outputUrl,
      detail.task_id,
      existing?.sortOrder ?? offering.examples.length,
    )

    const { list: nextExamples, replaced } = upsertExample(offering.examples, example)
    await updateAdminOffering(offering.seqId, {
      examples: nextExamples.map(exampleToApiPayload),
    })

    return { exampleId: example.id, replaced, model }
  } catch (e) {
    if (e instanceof AdminOfferingError) throw e
    throw new AdminOfferingError(
      e instanceof Error ? e.message : 'Request failed',
      'request_failed',
    )
  }
}
