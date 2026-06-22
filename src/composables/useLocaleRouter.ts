import { computed } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  localeFromRouteParam,
  localeToRouteParam,
  switchPathLocale,
  withLocalePrefix,
} from '@/i18n/locale-path'
import { setStoredLocale, type LocaleType } from '@/i18n'

export function useLocaleRouter() {
  const route = useRoute()
  const router = useRouter()
  const { locale } = useI18n()

  const currentLocale = computed(() => localeFromRouteParam(route.params.locale))

  function localePath(path: string, targetLocale?: LocaleType): string {
    return withLocalePrefix(path, targetLocale ?? currentLocale.value)
  }

  function localeRoute(to: RouteLocationRaw, targetLocale?: LocaleType): RouteLocationRaw {
    const resolvedLocale = targetLocale ?? currentLocale.value
    const localeParam = localeToRouteParam(resolvedLocale)

    if (typeof to === 'string') {
      return withLocalePrefix(to, resolvedLocale)
    }

    if ('path' in to && to.path) {
      return {
        ...to,
        path: withLocalePrefix(to.path, resolvedLocale),
      }
    }

    if ('name' in to && to.name) {
      return {
        ...to,
        params: {
          ...(typeof to.params === 'object' ? to.params : {}),
          locale: localeParam,
        },
      }
    }

    return to
  }

  function push(to: RouteLocationRaw, targetLocale?: LocaleType) {
    return router.push(localeRoute(to, targetLocale))
  }

  function replace(to: RouteLocationRaw, targetLocale?: LocaleType) {
    return router.replace(localeRoute(to, targetLocale))
  }

  function switchLocale(nextLocale: LocaleType) {
    locale.value = nextLocale
    setStoredLocale(nextLocale)

    const nextPath = switchPathLocale(route.path, nextLocale)
    const destination = `${nextPath}${route.fullPath.slice(route.path.length)}`

    return router.push(destination)
  }

  return {
    currentLocale,
    localePath,
    localeRoute,
    push,
    replace,
    switchLocale,
  }
}
