import type { LocaleType } from '@/i18n'

export const SITE_ORIGIN = 'https://varo.cloud'
export const SITE_NAME = 'Varo.cloud'
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/assets/brand/logo.svg`

export type SeoRouteKey =
  | 'home'
  | 'models'
  | 'model-detail'
  | 'ai-generator'
  | 'pricing'
  | 'docs'
  | 'terms'
  | 'privacy'
  | 'auth'
  | 'api-keys'
  | 'billing'
  | 'generations'

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
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_ORIGIN}${normalized}`
}

export function htmlLang(locale: LocaleType): string {
  return locale === 'zh-CN' ? 'zh-CN' : 'en'
}
