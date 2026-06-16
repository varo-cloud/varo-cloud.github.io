import { http, unwrap } from './http'
import type { ApiKey, CreateApiKeyResult } from '@/types'

export function fetchApiKeys() {
  return unwrap<ApiKey[]>(http.get('/api-keys'))
}

export function createApiKey(name: string) {
  return unwrap<CreateApiKeyResult>(http.post('/api-keys', { name }))
}

export function deleteApiKey(id: string) {
  return unwrap<null>(http.delete(`/api-keys/${id}`))
}
