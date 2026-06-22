import { http, unwrap } from './http'
import type { FetchModelsParams, ModelDetail, ModelsPage } from '@/types'

export function fetchModels(params?: FetchModelsParams) {
  return unwrap<ModelsPage>(http.get('/models', { params }))
}

export function fetchModelDetail(id: string) {
  return unwrap<ModelDetail>(http.get(`/models/${id}`))
}
