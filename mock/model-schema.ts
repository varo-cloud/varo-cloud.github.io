import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'
import { resolveInputSchema } from './schemas'

function extractSlugFromPath(url: string): string | null {
  const match = url.match(/^\/api\/models\/([^/]+\/[^/?]+)\/input-schema/)
  return match ? decodeURIComponent(match[1]!) : null
}

export default [
  {
    url: /^\/api\/models\/[^/]+\/[^/?]+\/input-schema$/,
    method: 'get',
    response: ({ url }: { url: string }) => {
      const slug = extractSlugFromPath(url)
      if (!slug) {
        return { code: 404, message: 'Model input schema not found', data: null }
      }

      const schema = resolveInputSchema(slug)
      if (!schema) {
        return { code: 404, message: 'Model input schema not found', data: null }
      }

      return success(schema)
    },
  },
] as unknown as MockMethod[]
