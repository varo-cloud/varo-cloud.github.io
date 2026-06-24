import type { InputSchema } from '@/types/schema'

function isInputSchema(payload: unknown): payload is InputSchema {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'type' in payload &&
    payload.type === 'object' &&
    'properties' in payload &&
    typeof payload.properties === 'object'
  )
}

/** Accept plain Input schema or OpenAPI wrapper (`components.schemas.Input`). */
export function extractInputSchema(payload: unknown): InputSchema {
  if (isInputSchema(payload)) {
    return payload
  }

  if (typeof payload === 'object' && payload !== null && 'components' in payload) {
    const input = (payload as { components?: { schemas?: { Input?: InputSchema } } }).components
      ?.schemas?.Input
    if (isInputSchema(input)) {
      return input
    }
  }

  throw new Error('Invalid model input schema payload')
}
