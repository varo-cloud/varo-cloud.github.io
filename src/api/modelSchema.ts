import { http, unwrap } from './http'
import { extractInputSchema } from '@/utils/model-schema'

export function fetchModelInputSchema(modelId: string) {
  return unwrap<unknown>(http.get(`/models/${modelId}/input-schema`)).then(extractInputSchema)
}
