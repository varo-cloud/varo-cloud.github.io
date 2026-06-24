import { http, unwrap } from './http'
import type { PricingCategory, PricingItem, PricingMediaType, PricingPriceUnit } from '@/types'

interface ApiPricingItem {
  id: string
  model_id?: string
  name: string
  standard_price_usd: number
  starting_price_usd: number
  price_unit: PricingPriceUnit
  discount_percent?: number | null
  category?: PricingCategory
  media_type?: PricingMediaType
}

function mapPricingItem(raw: ApiPricingItem): PricingItem {
  return {
    id: raw.id,
    modelId: raw.model_id,
    name: raw.name,
    standardPriceUsd: raw.standard_price_usd,
    startingPriceUsd: raw.starting_price_usd,
    priceUnit: raw.price_unit,
    discountPercent: raw.discount_percent ?? undefined,
    category: raw.category,
    mediaType: raw.media_type,
  }
}

export function fetchPricing() {
  return unwrap<ApiPricingItem[]>(http.get('/pricing')).then((items) => items.map(mapPricingItem))
}
