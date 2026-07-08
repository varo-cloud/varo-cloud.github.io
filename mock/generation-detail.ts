import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'

function getToken(headers: Record<string, string>): string | null {
  const auth = headers.authorization || headers.Authorization
  if (!auth) return null
  return auth.replace(/^Bearer\s+/i, '')
}

function unauthorized() {
  return { code: 401, message: 'Unauthorized', data: null }
}

function notFound() {
  return { code: 404, message: 'Generation not found', data: null }
}

function resolveModelFromTaskId(taskId: string): string {
  const match = taskId.match(/^cgt-(.+)-(\d+)$/)
  if (!match) return 'seedance-2.0/text-to-video'
  return match[1]!.replace(/-/g, '/')
}

function resolveStatusFromTaskId(taskId: string): 'succeeded' | 'failed' | 'processing' {
  if (taskId.endsWith('-002')) return 'failed'
  if (taskId.endsWith('-004')) return 'processing'
  return 'succeeded'
}

export default [
  {
    url: /^\/api\/generations\/[^/]+$/,
    method: 'get',
    response: ({
      url,
      headers,
    }: {
      url: string
      headers: Record<string, string>
    }) => {
      if (!getToken(headers)) return unauthorized()

      const taskId = url.match(/\/api\/generations\/([^/?]+)/)?.[1]
      if (!taskId) return notFound()

      const model = resolveModelFromTaskId(taskId)
      const status = resolveStatusFromTaskId(taskId)
      const createdAt = Date.now() - 3_600_000

      return success({
        task_id: taskId,
        model,
        category: 'video',
        capability: 'text-to-video',
        status,
        invocation_channel: taskId.endsWith('-002') ? 'api' : 'playground',
        api_key_prefix: taskId.endsWith('-002') ? 'sk_live_abcd' : null,
        cost_usd: status === 'failed' ? 0 : 1.2,
        created_at: createdAt,
        request: {
          model,
          prompt: 'A cinematic shot of waves crashing on a beach at sunset',
          image_url: null,
          first_image: null,
          last_image: null,
          reference_images: [],
          reference_videos: [],
          reference_audios: [],
          duration: 5,
          resolution: '720p',
          ratio: '16:9',
          fps: 24,
          generate_audio: false,
          audio: null,
          camera_fixed: false,
          seed: -1,
          batch_size: 1,
        },
        result: {
          type: 'video',
          output_url:
            status === 'succeeded'
              ? 'https://static.wavespeed.ai/examples/567920'
              : null,
          error: status === 'failed' ? { message: 'Generation failed' } : null,
        },
      })
    },
  },
] as unknown as MockMethod[]
