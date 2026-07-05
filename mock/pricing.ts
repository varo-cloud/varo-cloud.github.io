import type { MockMethod } from 'vite-plugin-mock'
import type { PricingPriceUnit } from '../src/types'
import { success } from './_util'

interface ApiPricingItem {
  id: string
  model_id: string
  name: string
  standard_price_usd: number
  starting_price_usd: number
  price_unit: PricingPriceUnit
}

const pricingItems: ApiPricingItem[] = [
  {
    id: 'seedance-2.0/text-to-video',
    model_id: 'seedance-2.0/text-to-video',
    name: 'Seedance 2.0 Text-to-Video',
    standard_price_usd: 0.09,
    starting_price_usd: 0.072,
    price_unit: 'per_second',
  },
  {
    id: 'seedance-2.0/image-to-video',
    model_id: 'seedance-2.0/image-to-video',
    name: 'Seedance 2.0 Image-to-Video',
    standard_price_usd: 0.1,
    starting_price_usd: 0.084,
    price_unit: 'per_second',
  },
  {
    id: 'kling-2.6/text-to-video',
    model_id: 'kling-2.6/text-to-video',
    name: 'Kling 2.6 Text-to-Video',
    standard_price_usd: 0.08,
    starting_price_usd: 0.066,
    price_unit: 'per_second',
  },
  {
    id: 'kling-2.6/image-to-video',
    model_id: 'kling-2.6/image-to-video',
    name: 'Kling 2.6 Image-to-Video',
    standard_price_usd: 0.08,
    starting_price_usd: 0.066,
    price_unit: 'per_second',
  },
  {
    id: 'flux-pro-image/text-to-image',
    model_id: 'flux-pro-image/text-to-image',
    name: 'Flux Pro Image',
    standard_price_usd: 0.07,
    starting_price_usd: 0.07,
    price_unit: 'per_image',
  },
  {
    id: 'gpt-4o/chat',
    model_id: 'gpt-4o/chat',
    name: 'GPT-4o',
    standard_price_usd: 5,
    starting_price_usd: 5,
    price_unit: 'per_million_tokens',
  },
]

export default [
  {
    url: '/api/pricing',
    method: 'get',
    response: () => success(pricingItems),
  },
] as MockMethod[]
