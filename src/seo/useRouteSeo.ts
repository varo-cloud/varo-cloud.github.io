import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useHead } from '@unhead/vue'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { withLocalePrefix, stripLocalePrefix } from '@/i18n/locale-path'
import type { LocaleType } from '@/i18n'
import {
  DEFAULT_OG_IMAGE,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_TYPE,
  OG_IMAGE_WIDTH,
  SEO_BY_ROUTE,
  SITE_LOGO,
  SITE_NAME,
  absoluteUrl,
  htmlLang,
  type SeoRouteKey,
} from './config'
import { SOCIAL_SAME_AS, TWITTER_SITE } from './social'

function asSeoRouteKey(name: unknown): SeoRouteKey | null {
  if (typeof name !== 'string') return null
  if (name in SEO_BY_ROUTE) return name as SeoRouteKey
  return null
}

export function useRouteSeo() {
  const route = useRoute()
  const { t, locale } = useI18n()
  const { currentLocale, localePath } = useLocaleRouter()

  const seo = computed(() => {
    const key = asSeoRouteKey(route.name)
    if (!key) {
      return {
        title: SITE_NAME,
        description: t('pages.home.seo.description'),
        noindex: false,
        path: localePath('/'),
      }
    }

    const def = SEO_BY_ROUTE[key]
    let title = t(def.titleKey)
    if (key === 'model-detail') {
      const slug = typeof route.params.slug === 'string' ? route.params.slug : ''
      title = t(def.titleKey, { name: slug || 'Model' })
    }

    return {
      title,
      description: t(def.descriptionKey),
      noindex: Boolean(def.noindex),
      path: route.path,
    }
  })

  const canonical = computed(() => absoluteUrl(seo.value.path))
  const enHref = computed(() =>
    absoluteUrl(withLocalePrefix(stripLocalePrefix(route.path), 'en-US')),
  )
  const zhHref = computed(() =>
    absoluteUrl(withLocalePrefix(stripLocalePrefix(route.path), 'zh-CN')),
  )

  useHead(
    computed(() => ({
      title: seo.value.title,
      htmlAttrs: {
        lang: htmlLang(currentLocale.value),
      },
      meta: [
        { name: 'description', content: seo.value.description },
        {
          name: 'robots',
          content: seo.value.noindex ? 'noindex, nofollow' : 'index, follow',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:title', content: seo.value.title },
        { property: 'og:description', content: seo.value.description },
        { property: 'og:url', content: canonical.value },
        { property: 'og:image', content: DEFAULT_OG_IMAGE },
        { property: 'og:image:secure_url', content: DEFAULT_OG_IMAGE },
        { property: 'og:image:type', content: OG_IMAGE_TYPE },
        { property: 'og:image:width', content: String(OG_IMAGE_WIDTH) },
        { property: 'og:image:height', content: String(OG_IMAGE_HEIGHT) },
        { property: 'og:image:alt', content: OG_IMAGE_ALT },
        { property: 'og:locale', content: currentLocale.value === 'zh-CN' ? 'zh_CN' : 'en_US' },
        {
          property: 'og:locale:alternate',
          content: currentLocale.value === 'zh-CN' ? 'en_US' : 'zh_CN',
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: TWITTER_SITE },
        { name: 'twitter:title', content: seo.value.title },
        { name: 'twitter:description', content: seo.value.description },
        { name: 'twitter:image', content: DEFAULT_OG_IMAGE },
        { name: 'twitter:image:alt', content: OG_IMAGE_ALT },
      ],
      link: [
        { rel: 'canonical', href: canonical.value },
        { rel: 'alternate', hreflang: 'en', href: enHref.value },
        { rel: 'alternate', hreflang: 'zh-CN', href: zhHref.value },
        { rel: 'alternate', hreflang: 'x-default', href: enHref.value },
      ],
      script:
        route.name === 'home'
          ? [
              {
                type: 'application/ld+json',
                innerHTML: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@graph': [
                    {
                      '@type': 'Organization',
                      name: SITE_NAME,
                      url: absoluteUrl('/'),
                      logo: SITE_LOGO,
                      sameAs: SOCIAL_SAME_AS,
                      contactPoint: {
                        '@type': 'ContactPoint',
                        email: 'support@varo.cloud',
                        contactType: 'customer support',
                      },
                    },
                    {
                      '@type': 'WebSite',
                      name: SITE_NAME,
                      url: absoluteUrl('/'),
                      description: seo.value.description,
                      inLanguage: htmlLang(locale.value as LocaleType),
                    },
                  ],
                }),
              },
            ]
          : [],
    })),
  )

  watch(
    () => currentLocale.value,
    (next) => {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = htmlLang(next)
      }
    },
    { immediate: true },
  )
}
