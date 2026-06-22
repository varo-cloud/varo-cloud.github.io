import { http, unwrap } from './http'
import type { FetchModelsParams, ModelDetail, ModelsPage } from '@/types'

export function fetchModels(params?: FetchModelsParams) {
  return unwrap<ModelsPage>(http.get('/models', { params }))
}

export function fetchModelDetail(id: string) {
  return unwrap<ModelDetail>(http.get(`/models/${id}`))
}

export function fetchModelsByIds(ids: string[]) {
  if (ids.length === 0) return Promise.resolve([] as ModelsPage['items'])
  return unwrap<ModelsPage['items']>(http.get('/models/batch', { params: { ids: ids.join(',') } }))
}
