import { createDefaultFormValues } from '@/utils/schema-form'
import type { GenerationRequest } from '@/types'
import type { InputSchema, SchemaFormValues } from '@/types/schema'

const REQUEST_META_KEYS = new Set(['model', 'batch_size', 'batchSize', 'n'])

export function resolveBatchSizeFromRequest(request: GenerationRequest): number {
  const batchSize = request.batch_size ?? request.n
  if (typeof batchSize === 'number' && Number.isFinite(batchSize) && batchSize >= 1) {
    return Math.floor(batchSize)
  }
  return 1
}

export function requestToFormValues(
  request: GenerationRequest,
  schema: InputSchema | undefined,
): SchemaFormValues {
  const values = createDefaultFormValues(schema)
  const schemaKeys = new Set(Object.keys(schema?.properties ?? {}))

  for (const [key, value] of Object.entries(request)) {
    if (REQUEST_META_KEYS.has(key)) continue
    if (schemaKeys.size > 0 && !schemaKeys.has(key)) continue
    if (value === null || value === undefined) continue
    values[key] = value
  }

  return values
}

/** Merge offering example `input` onto schema defaults for one-click Playground load. */
export function exampleInputToFormValues(
  input: Record<string, unknown>,
  schema: InputSchema | undefined,
): SchemaFormValues {
  return requestToFormValues(input as GenerationRequest, schema)
}
