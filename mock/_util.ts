import type { ApiResponse } from '@/types'

export function success<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: 0, message, data }
}

export function fail(message: string, code = 1): ApiResponse<null> {
  return { code, message, data: null }
}
