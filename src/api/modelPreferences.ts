import { http, unwrap } from './http'
import type { ModelPreferences } from '@/types'

export function fetchModelPreferences() {
  return unwrap<ModelPreferences>(http.get('/user/model-preferences'))
}

export function addModelFavourite(modelId: string) {
  return unwrap<ModelPreferences>(http.post(`/models/${modelId}/favourite`))
}

export function removeModelFavourite(modelId: string) {
  return unwrap<ModelPreferences>(http.delete(`/models/${modelId}/favourite`))
}

export function recordModelVisit(modelId: string) {
  return unwrap<ModelPreferences>(http.post(`/models/${modelId}/visit`))
}
