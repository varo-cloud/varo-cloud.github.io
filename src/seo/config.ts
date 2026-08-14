import type { LocaleType } from '@/i18n'

/**
 * Public site origin for canonical / OG / JSON-LD absolute URLs.
 * Staging must use its own host — X/LinkedIn fetch og:image as written;
 * pointing at production while the file only exists on staging yields a blank card.
 */
function resolveSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_ORIGIN?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (import.meta.env.MODE === 'staging') return 'https://varo-staging.github.io'
  return 'https://varo.cloud'
}

export const SITE_ORIGIN = resolveSiteOrigin()
export const SITE_NAME = 'Varo.cloud'
/** Brand mark for favicon / JSON-LD logo (SVG is fine for schema.org). */
export const SITE_LOGO = `${SITE_ORIGIN}/assets/brand/logo.svg`
/**
 * Open Graph / Twitter Card image. Platforms (X, LinkedIn, Discord, Slack…)
 * expect a raster ~1200×630 JPEG/PNG — SVG logos are often ignored.
 */
export const DEFAULT_OG_IMAGE = `https://assets.varo.cloud/uploads/4ee206177c6a4d589cb781d72ccebe91.jpg`
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630
export const OG_IMAGE_TYPE = 'image/jpeg'
export const OG_IMAGE_ALT = 'Varo.cloud — The Generative AI Cloud for Creators'

export type SeoRouteKey =
  | 'home'
  | 'models'
  | 'seedance'
  | 'minimax-h3'
  | 'model-detail'
  | 'ai-generator'
  | 'pricing'
  | 'developers'
  | 'docs'
  | 'terms'
  | 'privacy'
  | 'auth'
  | 'auth-callback'
  | 'api-keys'
  | 'billing'
  | 'generations'
  | 'seed-creator'
  | 'invite'

export interface SeoDefinition {
  titleKey: string
  descriptionKey: string
  /** When true, emit robots noindex,nofollow */
  noindex?: boolean
}

export const SEO_BY_ROUTE: Record<SeoRouteKey, SeoDefinition> = {
  home: {
    titleKey: 'pages.home.seo.title',
    descriptionKey: 'pages.home.seo.description',
  },
  models: {
    titleKey: 'pages.models.seo.title',
    descriptionKey: 'pages.models.seo.description',
  },
  seedance: {
    titleKey: 'pages.seedance.seo.title',
    descriptionKey: 'pages.seedance.seo.description',
  },
  'minimax-h3': {
    titleKey: 'pages.minimaxH3.seo.title',
    descriptionKey: 'pages.minimaxH3.seo.description',
  },
  'model-detail': {
    titleKey: 'pages.models.seo.detailTitle',
    descriptionKey: 'pages.models.seo.description',
  },
  'ai-generator': {
    titleKey: 'pages.aiGenerator.seo.title',
    descriptionKey: 'pages.aiGenerator.seo.description',
  },
  pricing: {
    titleKey: 'pages.pricing.seo.title',
    descriptionKey: 'pages.pricing.seo.description',
  },
  developers: {
    titleKey: 'pages.developers.seo.title',
    descriptionKey: 'pages.developers.seo.description',
  },
  docs: {
    titleKey: 'pages.docs.seo.title',
    descriptionKey: 'pages.docs.seo.description',
  },
  terms: {
    titleKey: 'pages.terms.seo.title',
    descriptionKey: 'pages.terms.seo.description',
  },
  privacy: {
    titleKey: 'pages.privacy.seo.title',
    descriptionKey: 'pages.privacy.seo.description',
  },
  auth: {
    titleKey: 'pages.auth.seo.title',
    descriptionKey: 'pages.auth.seo.description',
    noindex: true,
  },
  'auth-callback': {
    titleKey: 'pages.auth.seo.title',
    descriptionKey: 'pages.auth.seo.description',
    noindex: true,
  },
  'api-keys': {
    titleKey: 'pages.apiKeys.seo.title',
    descriptionKey: 'pages.apiKeys.seo.description',
    noindex: true,
  },
  billing: {
    titleKey: 'pages.billing.seo.title',
    descriptionKey: 'pages.billing.seo.description',
    noindex: true,
  },
  generations: {
    titleKey: 'pages.generations.seo.title',
    descriptionKey: 'pages.generations.seo.description',
    noindex: true,
  },
  'seed-creator': {
    titleKey: 'pages.seedCreator.seo.title',
    descriptionKey: 'pages.seedCreator.seo.description',
  },
  invite: {
    titleKey: 'pages.invite.seo.title',
    descriptionKey: 'pages.invite.seo.description',
    noindex: true,
  },
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_ORIGIN}${normalized}`
}

export function htmlLang(locale: LocaleType): string {
  return locale === 'zh-CN' ? 'zh-CN' : 'en'
}
