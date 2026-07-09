import { http, unwrap } from './http'
import { extractInputSchema } from '@/utils/model-schema'
import { normalizeModelSlug } from '@/utils/model-slug'
import type { InputSchema } from '@/types/schema'

export function fetchModelInputSchema(modelId: string) {
  return unwrap<unknown>(http.get(`/models/${normalizeModelSlug(modelId)}/input-schema`)).then(
    extractInputSchema,
  )
}

/** Prefer embedded detail schema; fall back to dedicated input-schema endpoint. */
export async function loadModelInputSchema(
  modelId: string,
  embeddedSchema?: Record<string, unknown> | null,
): Promise<InputSchema | null> {
  if (embeddedSchema) {
    try {
      return extractInputSchema(embeddedSchema)
    } catch {
      // fall through to dedicated endpoint
    }
  }

  try {
    return await fetchModelInputSchema(modelId)
  } catch {
    return null
  }
}
