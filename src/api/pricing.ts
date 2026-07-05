import { http, unwrap } from './http'
import type { PricingItem, PricingPriceUnit } from '@/types'

interface ApiPricingItem {
  id: string
  model_id: string
  name: string
  standard_price_usd: number
  starting_price_usd: number
  price_unit: PricingPriceUnit
}

function mapPricingItem(raw: ApiPricingItem): PricingItem {
  return {
    id: raw.id,
    modelId: raw.model_id,
    name: raw.name,
    standardPriceUsd: raw.standard_price_usd,
    startingPriceUsd: raw.starting_price_usd,
    priceUnit: raw.price_unit,
  }
}

export function fetchPricing() {
  return unwrap<ApiPricingItem[]>(http.get('/pricing')).then((items) => items.map(mapPricingItem))
}
