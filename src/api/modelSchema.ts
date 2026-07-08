import { http, unwrap } from './http'
import { extractInputSchema } from '@/utils/model-schema'
import { normalizeModelSlug } from '@/utils/model-slug'

export function fetchModelInputSchema(modelId: string) {
  return unwrap<unknown>(http.get(`/models/${normalizeModelSlug(modelId)}/input-schema`)).then(
    extractInputSchema,
  )
}
