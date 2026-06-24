import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'
import type { PricingPriceUnit } from '../src/types'

interface ApiPricingItem {
  id: string
  model_id?: string
  name: string
  standard_price_usd: number
  starting_price_usd: number
  price_unit: PricingPriceUnit
  discount_percent?: number
  category?: 'image-video' | 'language' | 'serverless'
  media_type?: 'video' | 'image' | 'llm'
}

const pricingItems: ApiPricingItem[] = [
  {
    id: 'flux-pro-image',
    name: 'Flux Pro Image',
    standard_price_usd: 0.07,
    starting_price_usd: 0.07,
    price_unit: 'per_image',
    category: 'image-video',
    media_type: 'image',
  },
  {
    id: 'dalle-3',
    name: 'DALL·E 3',
    standard_price_usd: 0.14,
    starting_price_usd: 0.14,
    price_unit: 'per_image',
    discount_percent: 10,
    category: 'image-video',
    media_type: 'image',
  },
  {
    id: 'midjourney-v6',
    name: 'Midjourney V6',
    standard_price_usd: 0.04,
    starting_price_usd: 0.04,
    price_unit: 'per_image',
    category: 'image-video',
    media_type: 'image',
  },
  {
    id: 'sdxl-lightning',
    name: 'SDXL Lightning',
    standard_price_usd: 0.008,
    starting_price_usd: 0.008,
    price_unit: 'per_image',
    category: 'image-video',
    media_type: 'image',
  },
  {
    id: 'flux-schnell',
    name: 'Flux Schnell',
    standard_price_usd: 0.005,
    starting_price_usd: 0.005,
    price_unit: 'per_image',
    category: 'image-video',
    media_type: 'image',
  },
  {
    id: 'veo-31-lite-t2v',
    model_id: 'seedance-t2v',
    name: 'Veo 3.1 Lite Text-to-video',
    standard_price_usd: 0.1,
    starting_price_usd: 0.1,
    price_unit: 'per_second',
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'veo-31-lite-i2v',
    model_id: 'seedance-i2v',
    name: 'Veo 3.1 Lite Image-to-video',
    standard_price_usd: 0.1,
    starting_price_usd: 0.084,
    price_unit: 'per_second',
    discount_percent: 15,
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'wan-27-video-edit',
    name: 'Wan-2.7 Video-edit',
    standard_price_usd: 0.01,
    starting_price_usd: 0.01,
    price_unit: 'per_second',
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'kling-i2v-pricing',
    model_id: 'kling-i2v',
    name: 'Kling Image-to-Video',
    standard_price_usd: 0.084,
    starting_price_usd: 0.084,
    price_unit: 'per_second',
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'seedance-t2v-pricing',
    model_id: 'seedance-t2v',
    name: 'Seedance Text-to-Video',
    standard_price_usd: 0.15,
    starting_price_usd: 0.15,
    price_unit: 'per_second',
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    standard_price_usd: 5,
    starting_price_usd: 5,
    price_unit: 'per_million_tokens',
    category: 'language',
    media_type: 'llm',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    standard_price_usd: 3,
    starting_price_usd: 3,
    price_unit: 'per_million_tokens',
    category: 'language',
    media_type: 'llm',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    standard_price_usd: 0.75,
    starting_price_usd: 0.75,
    price_unit: 'per_million_tokens',
    category: 'language',
    media_type: 'llm',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini 1.5 Pro',
    standard_price_usd: 2,
    starting_price_usd: 2,
    price_unit: 'per_million_tokens',
    category: 'language',
    media_type: 'llm',
  },
  {
    id: 'llama-3-70b',
    name: 'Llama 3 70B',
    standard_price_usd: 2.5,
    starting_price_usd: 2.5,
    price_unit: 'per_million_tokens',
    category: 'language',
    media_type: 'llm',
  },
  {
    id: 'mixtral-8x7b',
    name: 'Mixtral 8x7B',
    standard_price_usd: 1.84,
    starting_price_usd: 1.84,
    price_unit: 'per_million_tokens',
    category: 'language',
    media_type: 'llm',
  },
  {
    id: 'a100-80gb',
    name: 'A100 80GB',
    standard_price_usd: 2.49,
    starting_price_usd: 2.49,
    price_unit: 'per_hour',
    category: 'serverless',
    media_type: 'llm',
  },
]

export default [
  {
    url: '/api/pricing',
    method: 'get',
    response: () => success(pricingItems),
  },
] as MockMethod[]
