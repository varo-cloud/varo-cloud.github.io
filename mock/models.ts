import type { MockMethod } from 'vite-plugin-mock'
import type { ModelCategory, PricingPriceUnit } from '../src/types'
import { resolveModelDoc } from './model-docs'
import { success } from './_util'

interface ModelCatalogEntry {
  slug: string
  model_id: number
  capability: string
  category: ModelCategory
  display_name: string
  description: string
  thumbnail_url?: string
  icon_url?: string
  starting_price_usd: number
  standard_price_usd?: number
  price_unit: PricingPriceUnit
  price_detail?: string
  is_hot?: boolean
  is_new?: boolean
  sort_order?: number
}

const baseModels: ModelCatalogEntry[] = [
  {
    slug: 'seedance-2.0/image-to-video',
    model_id: 1,
    capability: 'image-to-video',
    category: 'video',
    display_name: 'Seedance 2.0 Image-to-Video',
    starting_price_usd: 0.084,
    standard_price_usd: 0.1,
    price_unit: 'per_second',
    price_detail: '720p',
    is_hot: true,
    sort_order: 10,
    description:
      'Hollywood-grade cinematic image-to-video generation with native audio sync at 480p or 720p. Animates a starting frame with natural-language motion prompts.',
    thumbnail_url: '/assets/model-detail/model-thumb.jpg',
    icon_url: '/assets/models/seedance.svg',
  },
  {
    slug: 'seedance-2.0/text-to-video',
    model_id: 1,
    capability: 'text-to-video',
    category: 'video',
    display_name: 'Seedance 2.0 Text-to-Video',
    starting_price_usd: 0.072,
    standard_price_usd: 0.09,
    price_unit: 'per_second',
    price_detail: '480p',
    is_new: true,
    sort_order: 11,
    description:
      'Hollywood-grade cinematic text-to-video generation with native audio sync. Supports reference images, videos, and audios for style and motion guidance.',
    thumbnail_url: '/assets/models/card-thumb.jpg',
    icon_url: '/assets/models/seedance.svg',
  },
  {
    slug: 'kling-2.6/text-to-video',
    model_id: 2,
    capability: 'text-to-video',
    category: 'video',
    display_name: 'Kling 2.6 Text-to-Video',
    starting_price_usd: 0.066,
    standard_price_usd: 0.08,
    price_unit: 'per_second',
    price_detail: '720p',
    sort_order: 20,
    description:
      'High-quality text-to-video generation powered by Kling with cinematic motion control.',
    thumbnail_url: '/assets/models/card-thumb.jpg',
    icon_url: '/assets/models/seedance.svg',
  },
  {
    slug: 'kling-2.6/image-to-video',
    model_id: 2,
    capability: 'image-to-video',
    category: 'video',
    display_name: 'Kling 2.6 Image-to-Video',
    starting_price_usd: 0.066,
    standard_price_usd: 0.08,
    price_unit: 'per_second',
    price_detail: '720p',
    sort_order: 21,
    description:
      'Transform reference images into smooth video clips with Kling image-to-video.',
    thumbnail_url: '/assets/models/card-thumb.jpg',
    icon_url: '/assets/models/seedance.svg',
  },
]

const VARIANT_FAMILIES = [
  'seedance-2.0',
  'kling-2.6',
  'veo-2',
  'sora',
  'gen-3',
  'dream-machine',
  'hailuo',
  'wan-2.1',
  'pika-2.0',
  'stable-video',
]

const VARIANT_TEMPLATES = [
  { capability: 'text-to-video' as const },
  { capability: 'image-to-video' as const },
]

function buildModelCatalog(): ModelCatalogEntry[] {
  const catalog: ModelCatalogEntry[] = [...baseModels]
  let index = 0

  while (catalog.length < 48) {
    const family = VARIANT_FAMILIES[index % VARIANT_FAMILIES.length]
    const template = VARIANT_TEMPLATES[index % VARIANT_TEMPLATES.length]
    const variant = Math.floor(index / VARIANT_TEMPLATES.length) % 3
    const pricePerSecond = Number((0.04 + (index % 12) * 0.004).toFixed(3))
    const standardPerSecond = Number((pricePerSecond * 1.2).toFixed(3))
    const slugSuffix = variant > 0 ? `-v${variant + 1}` : ''

    catalog.push({
      slug: `${family}${slugSuffix}/${template.capability}`,
      model_id: 100 + index,
      capability: template.capability,
      category: 'video',
      display_name: `${family.replace(/-/g, ' ')} ${template.capability.replace(/-/g, ' ')}${variant > 0 ? ` v${variant + 1}` : ''}`,
      starting_price_usd: pricePerSecond,
      standard_price_usd: standardPerSecond,
      price_unit: 'per_second',
      price_detail: ['480p', '720p', '1080p'][index % 3],
      is_hot: index % 7 === 0,
      is_new: index % 11 === 3,
      sort_order: 100 + index,
      description: `${family} ${template.capability.replace(/-/g, ' ')} generation.`,
      thumbnail_url:
        index % 3 === 0 ? '/assets/model-detail/model-thumb.jpg' : '/assets/models/card-thumb.jpg',
      icon_url: '/assets/models/seedance.svg',
    })
    index += 1
  }

  return catalog
}

const models = buildModelCatalog()

export function findCatalogModelBySlug(slug: string): ModelCatalogEntry | undefined {
  return models.find((item) => item.slug === slug)
}

/** @deprecated use findCatalogModelBySlug */
export function findCatalogModelById(slug: string): ModelCatalogEntry | undefined {
  return findCatalogModelBySlug(slug)
}

function filterModels(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return models

  return models.filter((model) => {
    const baseSlug = model.slug.split('/')[0]?.toLowerCase() ?? ''
    return (
      model.display_name.toLowerCase().includes(q) ||
      baseSlug.includes(q) ||
      model.description.toLowerCase().includes(q)
    )
  })
}

function decodeBatchIds(raw: string): string[] {
  return raw
    .split(',')
    .filter(Boolean)
    .map((id) => {
      try {
        return decodeURIComponent(id)
      } catch {
        return id
      }
    })
}

function extractSlugFromPath(url: string): string | null {
  const match = url.match(/^\/api\/models\/([^?]+?)(?:\/(?:input-schema|quote|favourite|visit))?\/?(?:\?.*)?$/)
  if (!match) return null
  return decodeURIComponent(match[1]!)
}

export default [
  {
    url: '/api/models',
    method: 'get',
    response: ({ query }: { query: Record<string, string> }) => {
      const offset = Math.max(0, Number(query.offset) || 0)
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
      const filtered = filterModels(query.q ?? '')

      return success({
        items: filtered.slice(offset, offset + limit),
        total: filtered.length,
        offset,
        limit,
      })
    },
  },
  {
    url: '/api/models/batch',
    method: 'get',
    response: ({ query }: { query: Record<string, string> }) => {
      const slugs = decodeBatchIds(query.ids ?? '')
      const items = slugs
        .map((slug) => models.find((item) => item.slug === slug))
        .filter((item): item is ModelCatalogEntry => Boolean(item))

      return success(items)
    },
  },
  {
    url: /^\/api\/models\/[^/]+\/[^/?]+$/,
    method: 'get',
    response: ({ url }: { url: string }) => {
      const slug = extractSlugFromPath(url)
      const model = slug ? findCatalogModelBySlug(slug) : undefined
      if (!model) {
        return { code: 404, message: 'Model not found', data: null }
      }

      const doc = resolveModelDoc(model.slug)
      return success({
        ...model,
        readme_md: doc.readme_md || null,
        faq: doc.faq.length > 0 ? doc.faq : null,
        input_schema: null,
      })
    },
  },
] as unknown as MockMethod[]
