import { http, unwrap } from './http'
import type { ModelPreferences } from '@/types'

interface ApiModelRecentEntry {
  id: string
  visited_at: number
}

interface ApiModelPreferences {
  favourites?: string[]
  recent?: ApiModelRecentEntry[]
}

function mapModelPreferences(raw: ApiModelPreferences): ModelPreferences {
  return {
    favourites: raw.favourites ?? [],
    recent: (raw.recent ?? []).map((entry) => ({
      id: entry.id,
      visitedAt: entry.visited_at,
    })),
  }
}

export function addModelFavourite(modelId: string) {
  return unwrap<ApiModelPreferences>(http.post(`/models/${modelId}/favourite`)).then(
    mapModelPreferences,
  )
}

export function removeModelFavourite(modelId: string) {
  return unwrap<ApiModelPreferences>(http.delete(`/models/${modelId}/favourite`)).then(
    mapModelPreferences,
  )
}

export function recordModelVisit(modelId: string) {
  return unwrap<ApiModelPreferences>(http.post(`/models/${modelId}/visit`)).then(mapModelPreferences)
}
