import { http, unwrap } from './http'
import type { Model, ModelDetail } from '@/types'

export function fetchModels() {
  return unwrap<Model[]>(http.get('/models'))
}

export function fetchModelDetail(id: string) {
  return unwrap<ModelDetail>(http.get(`/models/${id}`))
}
