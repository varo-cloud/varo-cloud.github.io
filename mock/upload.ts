import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'

const MOCK_URLS: Record<string, string> = {
  image: '/assets/model-detail/sample-output.jpg',
  video: 'https://example.com/sample.mp4',
  audio: 'https://example.com/sample.mp3',
}

function resolveKind(query: Record<string, string>): string {
  const kind = query.kind
  if (kind && kind in MOCK_URLS) return kind
  return 'image'
}

export default [
  {
    url: '/api/upload',
    method: 'post',
    timeout: 120_000,
    response: ({
      headers,
      query,
    }: {
      headers: Record<string, string>
      query: Record<string, string>
    }) => {
      const auth = headers.authorization || headers.Authorization
      if (!auth) {
        return { code: 401, message: 'Unauthorized', data: null }
      }

      const kind = resolveKind(query)
      const id = `upload_${Date.now()}`

      return success({
        url: MOCK_URLS[kind] ?? MOCK_URLS.image,
        filename: `${id}.${kind === 'video' ? 'mp4' : kind === 'audio' ? 'mp3' : 'jpg'}`,
        mimeType:
          kind === 'video' ? 'video/mp4' : kind === 'audio' ? 'audio/mpeg' : 'image/jpeg',
        size: 1024 * 512,
      })
    },
  },
] as MockMethod[]
