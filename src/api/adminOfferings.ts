import { http, unwrap } from './http'
import {
  exampleToApiPayload,
  mapApiExample,
  type OfferingExample,
} from '@/utils/offeringExamples'

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

export interface AdminBaseModel {
  seqId: number
  slug: string
}

export interface AdminOffering {
  seqId: number
  modelId: number
  capability: string
  examples: OfferingExample[]
}

function mapBaseModel(raw: ApiBaseModel): AdminBaseModel {
  return {
    seqId: raw.seq_id,
    slug: raw.slug,
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

export async function fetchAdminBaseModel(slug: string): Promise<AdminBaseModel> {
  const raw = await unwrap<ApiBaseModel>(
    http.get(`/admin/base-models/${encodeURIComponent(slug)}`),
  )
  return mapBaseModel(raw)
}

export async function fetchAdminOfferings(modelId?: number): Promise<AdminOffering[]> {
  const params = modelId != null ? { model_id: modelId } : undefined
  const raw = await unwrap<ApiOffering[]>(http.get('/admin/model-offerings', { params }))
  return raw.map(mapOffering)
}

export function offeringExamplesToPayload(examples: OfferingExample[]): Record<string, unknown> {
  return {
    examples: examples.map(exampleToApiPayload),
  }
}

export async function updateAdminOffering(
  seqId: number,
  payload: Record<string, unknown>,
): Promise<AdminOffering> {
  const raw = await unwrap<ApiOffering>(http.put(`/admin/model-offerings/${seqId}`, payload))
  return mapOffering(raw)
}
