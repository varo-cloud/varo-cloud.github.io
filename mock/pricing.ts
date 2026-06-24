import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'

interface ApiPricingItem {
  id: string
  model_id?: string
  name: string
  standard_price_usd: number
  starting_price_usd: number
  price_unit: string
  discount_percent?: number
  category: 'image-video' | 'language' | 'serverless'
  media_type: 'video' | 'image' | 'llm'
}

const pricingItems: ApiPricingItem[] = [
  {
    id: 'midjourney-v81-i2v',
    model_id: 'kling-i2v',
    name: 'Midjourney V8.1 Image-to-Video',
    standard_price_usd: 0.086,
    starting_price_usd: 0.086,
    price_unit: '/s video',
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'veo-31-lite-t2v',
    model_id: 'seedance-t2v',
    name: 'Veo 3.1 Lite Text-to-video',
    standard_price_usd: 0.086,
    starting_price_usd: 0.086,
    price_unit: '/s video',
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'veo-31-lite-i2v',
    model_id: 'seedance-i2v',
    name: 'Veo 3.1 Lite Image-to-video',
    standard_price_usd: 0.086,
    starting_price_usd: 0.086,
    price_unit: '/s video',
    discount_percent: 15,
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'veo-31-lite-i2v-2',
    model_id: 'kling-i2v',
    name: 'Veo 3.1 Lite Image-to-video',
    standard_price_usd: 0.086,
    starting_price_usd: 0.086,
    price_unit: '/s video',
    discount_percent: 15,
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'wan-27-video-edit',
    name: 'Wan-2.7 Video-edit',
    standard_price_usd: 0.1,
    starting_price_usd: 0.086,
    price_unit: '/s video',
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'veo-31-lite-start-end',
    name: 'Veo 3.1 Lite Start-End Frame to Video',
    standard_price_usd: 0.05,
    starting_price_usd: 0.086,
    price_unit: '/s video',
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'veo-31-lite-start-end-2',
    name: 'Veo 3.1 Lite Start-End Frame to Video',
    standard_price_usd: 0.05,
    starting_price_usd: 0.086,
    price_unit: '/s video',
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'veo-31-lite-start-end-3',
    name: 'Veo 3.1 Lite Start-End Frame to Video',
    standard_price_usd: 0.05,
    starting_price_usd: 0.086,
    price_unit: '/s video',
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'veo-31-lite-start-end-4',
    name: 'Veo 3.1 Lite Start-End Frame to Video',
    standard_price_usd: 0.05,
    starting_price_usd: 0.086,
    price_unit: '/s video',
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'veo-31-lite-i2v-3',
    model_id: 'seedance-i2v',
    name: 'Veo 3.1 Lite Image-to-video',
    standard_price_usd: 0.086,
    starting_price_usd: 0.086,
    price_unit: '/s video',
    discount_percent: 15,
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'veo-31-lite-i2v-4',
    model_id: 'kling-i2v',
    name: 'Veo 3.1 Lite Image-to-video',
    standard_price_usd: 0.086,
    starting_price_usd: 0.086,
    price_unit: '/s video',
    discount_percent: 15,
    category: 'image-video',
    media_type: 'video',
  },
  {
    id: 'flux-pro-image',
    name: 'Flux Pro Image',
    standard_price_usd: 0.04,
    starting_price_usd: 0.04,
    price_unit: '/Pic',
    category: 'image-video',
    media_type: 'image',
  },
  {
    id: 'dalle-3',
    name: 'DALL·E 3',
    standard_price_usd: 0.08,
    starting_price_usd: 0.08,
    price_unit: '/Pic',
    discount_percent: 10,
    category: 'image-video',
    media_type: 'image',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    standard_price_usd: 0.005,
    starting_price_usd: 0.005,
    price_unit: '/1K tokens',
    category: 'language',
    media_type: 'llm',
  },
  {
    id: 'claude-sonnet',
    name: 'Claude 3.5 Sonnet',
    standard_price_usd: 0.003,
    starting_price_usd: 0.003,
    price_unit: '/1K tokens',
    category: 'language',
    media_type: 'llm',
  },
  {
    id: 'a100-80gb',
    name: 'A100 80GB',
    standard_price_usd: 2.49,
    starting_price_usd: 2.49,
    price_unit: '/hr',
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
