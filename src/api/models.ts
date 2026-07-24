import { http, unwrap } from './http'
import { normalizeModelSlug } from '@/utils/model-slug'
import type {
  FetchModelHistoryParams,
  FetchModelsParams,
  Model,
  ModelCategory,
  ModelDetail,
  ModelExample,
  ModelFacetsResponse,
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
  publisher_logo_url?: string | null
  starting_price_usd?: number | null
  standard_price_usd?: number | null
  /** Price multiplier vs standard, e.g. 0.9 → 10% off */
  discount?: number | null
  price_unit?: PricingPriceUnit | null
  price_detail?: string | null
  is_hot?: boolean | null
  is_new?: boolean | null
  sort_order?: number | null
  is_favourited?: boolean | null
}

interface ApiModelExample {
  id: string
  title: string
  description?: string | null
  input: Record<string, unknown>
  output_url?: string | null
  thumbnail_url?: string | null
  sort_order?: number | null
}

interface ApiModelDetail extends ApiModelCard {
  readme_md?: string | null
  faq?: ModelFaqItem[] | null
  input_schema?: Record<string, unknown> | null
  examples?: ApiModelExample[] | null
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
    id: normalizeModelSlug(raw.slug),
    baseModelId: raw.model_id,
    capability: raw.capability,
    category: raw.category,
    displayName: raw.display_name,
    startingPriceUsd: raw.starting_price_usd ?? 0,
    originalPriceUsd: raw.standard_price_usd ?? undefined,
    discount: raw.discount ?? null,
    priceUnit: raw.price_unit ?? 'per_second',
    priceDetail: raw.price_detail ?? undefined,
    description: raw.description ?? '',
    thumbnailUrl: raw.thumbnail_url ?? undefined,
    iconUrl: raw.icon_url ?? undefined,
    publisherLogoUrl: raw.publisher_logo_url ?? undefined,
    isHot: raw.is_hot ?? undefined,
    isNew: raw.is_new ?? undefined,
    sortOrder: raw.sort_order ?? undefined,
    isFavourited: raw.is_favourited ?? false,
  }
}

function mapModelExample(raw: ApiModelExample): ModelExample {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? undefined,
    input: raw.input,
    outputUrl: raw.output_url ?? undefined,
    thumbnailUrl: raw.thumbnail_url ?? undefined,
    sortOrder: raw.sort_order ?? undefined,
  }
}

function sortModelExamples(examples: ModelExample[]): ModelExample[] {
  return [...examples].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER
    if (orderA !== orderB) return orderA - orderB
    return a.id.localeCompare(b.id)
  })
}

function mapModelDetail(raw: ApiModelDetail): ModelDetail {
  const examples = raw.examples?.map(mapModelExample)

  return {
    ...mapModel(raw),
    readmeMd: raw.readme_md ?? undefined,
    faq: raw.faq ?? undefined,
    inputSchema: raw.input_schema ?? undefined,
    examples: examples?.length ? sortModelExamples(examples) : undefined,
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

export function fetchModelFacets() {
  return unwrap<ModelFacetsResponse>(http.get('/models/facets')).then((data) => ({
    categories: data.categories ?? [],
    capabilities: data.capabilities ?? [],
    publishers: data.publishers ?? [],
    base_models: data.base_models ?? [],
  }))
}

export function fetchModelDetail(slug: string) {
  return unwrap<ApiModelDetail>(http.get(`/models/${normalizeModelSlug(slug)}`)).then(mapModelDetail)
}

export function fetchModelExamples(slug: string) {
  return unwrap<ApiModelExample[]>(http.get(`/models/${normalizeModelSlug(slug)}/examples`)).then(
    (raw) => sortModelExamples((raw ?? []).map(mapModelExample)),
  )
}

function fetchUserModelsPage(path: string, params?: FetchModelsParams) {
  return unwrap<ApiModelsPage | ApiModelCard[]>(http.get(path, { params })).then((raw) =>
    normalizeModelsPage(raw, params),
  )
}

export function fetchRecentModels(params?: FetchModelsParams) {
  return fetchUserModelsPage('/user/recent-models', params)
}

export function fetchFavouriteModels(params?: FetchModelsParams) {
  return fetchUserModelsPage('/user/model-preferences', params)
}

export function fetchModelHistory(slug: string, params?: FetchModelHistoryParams) {
  return unwrap<ApiModelHistoryPage | ApiModelHistoryEntry[]>(
    http.get(`/models/${normalizeModelSlug(slug)}/history`, { params }),
  ).then((raw) => normalizeModelHistoryPage(raw, params))
}
