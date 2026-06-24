import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'
import { resolveInputSchema } from './schemas'

export default [
  {
    url: '/api/models/:id/input-schema',
    method: 'get',
    response: ({ query }: { query: Record<string, string> }) => {
      const schema = resolveInputSchema(query.id)
      if (!schema) {
        return { code: 404, message: 'Model input schema not found', data: null }
      }

      return success(schema)
    },
  },
] as MockMethod[]
