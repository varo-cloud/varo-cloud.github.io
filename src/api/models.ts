import { http, unwrap } from './http'
import type {
  FetchModelHistoryParams,
  FetchModelsParams,
  Model,
  ModelCategory,
  ModelDetail,
  ModelFaqItem,
  ModelHistoryEntry,
  ModelHistoryPage,
  ModelsPage,
  PricingPriceUnit,
} from '@/types'

interface ApiModelCard {
  slug: string
  model_id: number
  capability: string
  category: ModelCategory
  display_name: string
  description: string
  thumbnail_url?: string | null
  icon_url?: string | null
  starting_price_usd?: number | null
  standard_price_usd?: number | null
  price_unit?: PricingPriceUnit | null
  price_detail?: string | null
  is_hot?: boolean | null
  is_new?: boolean | null
  sort_order?: number | null
}

interface ApiModelDetail extends ApiModelCard {
  readme_md?: string | null
  faq?: ModelFaqItem[] | null
  input_schema?: Record<string, unknown> | null
}

interface ApiModelsPage {
  items: ApiModelCard[]
  total: number
  offset: number
  limit: number
}

interface ApiModelHistoryEntry {
  task_id: string
  status: string
  cost_usd?: number
  invocation_channel?: string
  created_at?: string | number
}

interface ApiModelHistoryPage {
  items: ApiModelHistoryEntry[]
  total: number
  offset: number
  limit: number
}

function parseTimestamp(value: string | number | undefined): number {
  if (typeof value === 'number') return value
  if (!value) return Date.now()
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : Date.now()
}

function mapModelHistoryEntry(raw: ApiModelHistoryEntry): ModelHistoryEntry {
  return {
    taskId: raw.task_id,
    status: raw.status,
    costUsd: raw.cost_usd ?? 0,
    invocationChannel: raw.invocation_channel ?? 'api',
    createdAt: parseTimestamp(raw.created_at),
  }
}

function normalizeModelHistoryPage(
  raw: ApiModelHistoryPage | ApiModelHistoryEntry[],
  params?: FetchModelHistoryParams,
): ModelHistoryPage {
  if (Array.isArray(raw)) {
    const offset = Math.max(0, params?.offset ?? 0)
    const limit = Math.min(100, Math.max(1, params?.limit ?? 20))

    return {
      items: raw.slice(offset, offset + limit).map(mapModelHistoryEntry),
      total: raw.length,
      offset,
      limit,
    }
  }

  return {
    items: (raw.items ?? []).map(mapModelHistoryEntry),
    total: raw.total ?? raw.items?.length ?? 0,
    offset: raw.offset ?? params?.offset ?? 0,
    limit: raw.limit ?? params?.limit ?? 20,
  }
}

function mapModel(raw: ApiModelCard): Model {
  return {
    id: raw.slug,
    baseModelId: raw.model_id,
    capability: raw.capability,
    category: raw.category,
    displayName: raw.display_name,
    startingPriceUsd: raw.starting_price_usd ?? 0,
    originalPriceUsd: raw.standard_price_usd ?? undefined,
    priceUnit: raw.price_unit ?? 'per_second',
    priceDetail: raw.price_detail ?? undefined,
    description: raw.description ?? '',
    thumbnailUrl: raw.thumbnail_url ?? undefined,
    iconUrl: raw.icon_url ?? undefined,
    isHot: raw.is_hot ?? undefined,
    isNew: raw.is_new ?? undefined,
    sortOrder: raw.sort_order ?? undefined,
  }
}

function mapModelDetail(raw: ApiModelDetail): ModelDetail {
  return {
    ...mapModel(raw),
    readmeMd: raw.readme_md ?? undefined,
    faq: raw.faq ?? undefined,
    inputSchema: raw.input_schema ?? undefined,
  }
}

function mapModelsPage(raw: ApiModelsPage): ModelsPage {
  return {
    items: (raw.items ?? []).map(mapModel),
    total: raw.total ?? raw.items?.length ?? 0,
    offset: raw.offset ?? 0,
    limit: raw.limit ?? raw.items?.length ?? 0,
  }
}

function filterModelsByQuery(items: ApiModelCard[], query?: string): ApiModelCard[] {
  const q = query?.trim().toLowerCase()
  if (!q) return items

  return items.filter((model) => {
    const baseSlug = model.slug.split('/')[0]?.toLowerCase() ?? ''
    return (
      model.display_name.toLowerCase().includes(q) ||
      baseSlug.includes(q) ||
      (model.description ?? '').toLowerCase().includes(q)
    )
  })
}

/** 兼容后端返回 data 为数组，或 data 为 { items, total, ... } 两种形态 */
function normalizeModelsPage(
  raw: ApiModelsPage | ApiModelCard[],
  params?: FetchModelsParams,
): ModelsPage {
  if (Array.isArray(raw)) {
    const offset = Math.max(0, params?.offset ?? 0)
    const limit = Math.min(100, Math.max(1, params?.limit ?? 20))
    const filtered = filterModelsByQuery(raw, params?.q)

    return {
      items: filtered.slice(offset, offset + limit).map(mapModel),
      total: filtered.length,
      offset,
      limit,
    }
  }

  return mapModelsPage(raw)
}

export function fetchModels(params?: FetchModelsParams) {
  return unwrap<ApiModelsPage | ApiModelCard[]>(http.get('/models', { params })).then((raw) =>
    normalizeModelsPage(raw, params),
  )
}

export function fetchModelDetail(slug: string) {
  return unwrap<ApiModelDetail>(http.get(`/models/${slug}`)).then(mapModelDetail)
}

export function fetchModelsByIds(slugs: string[]) {
  if (slugs.length === 0) return Promise.resolve([] as Model[])
  const ids = slugs.map(encodeURIComponent).join(',')
  return unwrap<ApiModelCard[]>(http.get('/models/batch', { params: { ids } })).then((items) =>
    items.map(mapModel),
  )
}

export function fetchRecentModels() {
  return unwrap<ApiModelCard[] | ApiModelsPage>(http.get('/user/recent-models')).then((raw) => {
    const items = Array.isArray(raw) ? raw : (raw.items ?? [])
    return items.map(mapModel)
  })
}

export function fetchModelHistory(slug: string, params?: FetchModelHistoryParams) {
  return unwrap<ApiModelHistoryPage | ApiModelHistoryEntry[]>(
    http.get(`/models/${slug}/history`, { params }),
  ).then((raw) => normalizeModelHistoryPage(raw, params))
}
