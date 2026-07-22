import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'
import { findCatalogModelBySlug } from './models'

type TaskStatus = 'queued' | 'running' | 'processing' | 'succeeded' | 'failed'

interface MockGenerationTask {
  id: string
  model: string
  status: TaskStatus
  createdAt: number
  pollCount: number
  outputUrl?: string
}

const SAMPLE_OUTPUT_URL = 'https://example.com/sample.mp4'

const tasks = new Map<string, MockGenerationTask>()

function createTaskId(): string {
  return `cgt-mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeStatus(status: TaskStatus): TaskStatus {
  if (status === 'running') return 'processing'
  return status
}

function advanceTask(task: MockGenerationTask): MockGenerationTask {
  task.pollCount += 1

  if (task.status === 'failed' || task.status === 'succeeded') {
    return task
  }

  if (task.pollCount >= 3) {
    task.status = 'succeeded'
    task.outputUrl = SAMPLE_OUTPUT_URL
    return task
  }

  task.status = task.pollCount === 1 ? 'queued' : 'processing'
  return task
}

function validateCreateBody(body: Record<string, unknown> | undefined) {
  if (!body || typeof body !== 'object') {
    return { code: 422, message: 'Invalid request', data: null }
  }

  const model = typeof body.model === 'string' ? body.model.trim() : ''
  if (!model) {
    return { code: 400, message: 'Unsupported model', data: null }
  }

  const catalogModel = findCatalogModelBySlug(model)
  if (!catalogModel) {
    return { code: 400, message: 'Unsupported model', data: null }
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) {
    return { code: 422, message: 'Invalid request', data: null }
  }

  const batchSize = Number(body.batch_size ?? 1)
  if (!Number.isFinite(batchSize) || batchSize < 1 || batchSize > 4) {
    return { code: 400, message: 'batch_size must be between 1 and 4', data: null }
  }

  return null
}

export default [
  {
    url: '/api/playground/generations',
    method: 'post',
    response: ({
      body,
      headers,
    }: {
      body: Record<string, unknown>
      headers: Record<string, string>
    }) => {
      const auth = headers.authorization || headers.Authorization
      if (!auth) {
        return { code: 401, message: 'Unauthorized', data: null }
      }

      const validationError = validateCreateBody(body)
      if (validationError) return validationError

      const model = String(body.model)
      const batchSize = Math.floor(Number(body.batch_size ?? 1))
      const now = Date.now()

      if (batchSize > 1) {
        const ids = Array.from({ length: batchSize }, () => {
          const id = createTaskId()
          tasks.set(id, {
            id,
            model,
            status: 'queued',
            createdAt: now,
            pollCount: 0,
          })
          return id
        })

        return success({ ids, batch_size: ids.length })
      }

      const id = createTaskId()
      tasks.set(id, {
        id,
        model,
        status: 'queued',
        createdAt: now,
        pollCount: 0,
      })

      return success({
        id,
        status: 'queued',
        model,
        created_at: now,
      })
    },
  },
  {
    url: /^\/api\/playground\/generations\/[^/]+$/,
    method: 'get',
    response: ({
      url,
      headers,
    }: {
      url: string
      headers: Record<string, string>
    }) => {
      const auth = headers.authorization || headers.Authorization
      if (!auth) {
        return { code: 401, message: 'Unauthorized', data: null }
      }

      const id = url.match(/\/api\/playground\/generations\/([^/?]+)/)?.[1]
      if (!id) {
        return { code: 404, message: 'Generation not found', data: null }
      }

      const task = tasks.get(id)
      if (!task) {
        return { code: 404, message: 'Generation not found', data: null }
      }

      const next = advanceTask(task)
      const status = normalizeStatus(next.status)

      if (status === 'succeeded') {
        return success({
          id: next.id,
          status: 'succeeded',
          output_url: next.outputUrl ?? SAMPLE_OUTPUT_URL,
        })
      }

      if (status === 'failed') {
        return success({
          id: next.id,
          status: 'failed',
          error: { message: 'Generation failed' },
        })
      }

      return success({
        id: next.id,
        status,
      })
    },
  },
] as unknown as MockMethod[]
