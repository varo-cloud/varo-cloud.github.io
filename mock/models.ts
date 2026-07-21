import type { MockMethod } from 'vite-plugin-mock'
import type { ModelCategory, PricingPriceUnit } from '../src/types'
import { resolveModelDoc } from './model-docs'
import { resolveOfferingExamplesApi } from './offering-examples'
import { resolveIsFavourited } from './_userPreferences'
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
  {
    slug: 'flux-1/text-to-image',
    model_id: 3,
    capability: 'text-to-image',
    category: 'image',
    display_name: 'Flux 1 Text-to-Image',
    starting_price_usd: 0.02,
    price_unit: 'per_image',
    sort_order: 30,
    description: 'High-quality text-to-image generation with Flux.',
    thumbnail_url: '/assets/models/card-thumb.jpg',
    icon_url: '/assets/models/seedance.svg',
  },
  {
    slug: 'flux-1/image-to-image',
    model_id: 3,
    capability: 'image-to-image',
    category: 'image',
    display_name: 'Flux 1 Image-to-Image',
    starting_price_usd: 0.025,
    price_unit: 'per_image',
    sort_order: 31,
    description: 'Image editing and transformation with Flux image-to-image.',
    thumbnail_url: '/assets/models/card-thumb.jpg',
    icon_url: '/assets/models/seedance.svg',
  },
  {
    slug: 'gpt-4o/llm',
    model_id: 4,
    capability: 'llm',
    category: 'llm',
    display_name: 'GPT-4o',
    starting_price_usd: 0.005,
    price_unit: 'per_million_tokens',
    sort_order: 40,
    description: 'Multimodal large language model for text generation.',
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

function extractFamilyKey(slug: string): string {
  return slug.split('/')[0]?.replace(/-v\d+$/, '') ?? slug
}

const FAMILY_PUBLISHER: Record<
  string,
  { slug: string; name: string; logo_url?: string | null }
> = {
  'seedance-2.0': { slug: 'bytedance', name: 'ByteDance', logo_url: '/assets/models/seedance.svg' },
  'kling-2.6': { slug: 'kuaishou', name: 'Kuaishou' },
  'flux-1': { slug: 'black-forest-labs', name: 'Black Forest Labs' },
  'gpt-4o': { slug: 'openai', name: 'OpenAI' },
  'veo-2': { slug: 'google', name: 'Google' },
  sora: { slug: 'openai', name: 'OpenAI' },
  'gen-3': { slug: 'runway', name: 'Runway' },
  'dream-machine': { slug: 'luma', name: 'Luma' },
  hailuo: { slug: 'minimax', name: 'MiniMax' },
  'wan-2.1': { slug: 'alibaba', name: 'Alibaba' },
  'pika-2.0': { slug: 'pika', name: 'Pika' },
  'stable-video': { slug: 'stability', name: 'Stability AI' },
}

function getPublisher(slug: string) {
  const family = extractFamilyKey(slug)
  return FAMILY_PUBLISHER[family] ?? { slug: 'other', name: 'Other', logo_url: null }
}

function withPublisherFields(item: ModelCatalogEntry) {
  const publisher = getPublisher(item.slug)
  return {
    ...item,
    publisher_slug: publisher.slug,
    publisher_name: publisher.name,
    publisher_logo_url: publisher.logo_url ?? null,
  }
}

function filterModels(query: Record<string, string>) {
  let filtered = models

  const category = query.category?.trim()
  if (category) {
    filtered = filtered.filter((model) => model.category === category)
  }

  const capability = query.capability?.trim()
  if (capability) {
    filtered = filtered.filter((model) => model.capability === capability)
  }

  const publisher = query.publisher?.trim()
  if (publisher) {
    filtered = filtered.filter((model) => getPublisher(model.slug).slug === publisher)
  }

  const q = query.q?.trim().toLowerCase()
  if (q) {
    filtered = filtered.filter((model) => {
      const baseSlug = model.slug.split('/')[0]?.toLowerCase() ?? ''
      return (
        model.display_name.toLowerCase().includes(q) ||
        baseSlug.includes(q) ||
        model.description.toLowerCase().includes(q)
      )
    })
  }

  return filtered
}

function buildFacets(catalog: ModelCatalogEntry[]) {
  const categoryBaseIds = new Map<string, Set<number>>()
  const capabilityCounts = new Map<string, number>()
  const publisherBaseIds = new Map<
    string,
    { slug: string; name: string; logo_url: string | null; ids: Set<number> }
  >()

  for (const item of catalog) {
    if (!categoryBaseIds.has(item.category)) {
      categoryBaseIds.set(item.category, new Set())
    }
    categoryBaseIds.get(item.category)!.add(item.model_id)
    capabilityCounts.set(item.capability, (capabilityCounts.get(item.capability) ?? 0) + 1)

    const publisher = getPublisher(item.slug)
    if (!publisherBaseIds.has(publisher.slug)) {
      publisherBaseIds.set(publisher.slug, {
        slug: publisher.slug,
        name: publisher.name,
        logo_url: publisher.logo_url ?? null,
        ids: new Set(),
      })
    }
    publisherBaseIds.get(publisher.slug)!.ids.add(item.model_id)
  }

  return {
    categories: [...categoryBaseIds.entries()]
      .map(([value, ids]) => ({ value, count: ids.size }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    capabilities: [...capabilityCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    publishers: [...publisherBaseIds.values()]
      .map(({ slug, name, logo_url, ids }, index) => ({
        slug,
        name,
        logo_url,
        count: ids.size,
        // Prefer camelCase to match production facets; leave some empty to exercise fallback covers.
        coverUrl: index % 3 === 0 ? null : `/assets/home/showcase-${String((index % 10) + 1).padStart(2, '0')}.${index % 10 === 1 ? 'jpeg' : 'png'}`,
      }))
      .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug)),
  }
}

function extractSlugFromPath(url: string): string | null {
  const match = url.match(
    /^\/api\/models\/([^?]+?)(?:\/(?:input-schema|examples|quote|favourite|visit))?\/?(?:\?.*)?$/,
  )
  if (!match) return null
  return decodeURIComponent(match[1]!)
}

export default [
  {
    url: '/api/models/facets',
    method: 'get',
    response: () => success(buildFacets(models)),
  },
  {
    url: '/api/models',
    method: 'get',
    response: ({
      query,
      headers,
    }: {
      query: Record<string, string>
      headers: Record<string, string>
    }) => {
      const offset = Math.max(0, Number(query.offset) || 0)
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
      const filtered = filterModels(query)

      return success({
        items: filtered.slice(offset, offset + limit).map((item) => ({
          ...withPublisherFields(item),
          is_favourited: resolveIsFavourited(headers, item.slug),
        })),
        total: filtered.length,
        offset,
        limit,
      })
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
      const examples = resolveOfferingExamplesApi(model.slug)
      return success({
        ...model,
        readme_md: doc.readme_md || null,
        faq: doc.faq.length > 0 ? doc.faq : null,
        input_schema: null,
        examples,
      })
    },
  },
  {
    url: /^\/api\/models\/[^/]+\/[^/?]+\/examples$/,
    method: 'get',
    response: ({ url }: { url: string }) => {
      const slug = extractSlugFromPath(url)
      const model = slug ? findCatalogModelBySlug(slug) : undefined
      if (!model) {
        return { code: 404, message: 'Model not found', data: null }
      }

      return success(resolveOfferingExamplesApi(model.slug))
    },
  },
] as unknown as MockMethod[]
