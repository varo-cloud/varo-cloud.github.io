import type { LocaleType } from './index'

export const DEFAULT_LOCALE: LocaleType = 'en-US'
export const LOCALE_PATH_PREFIX = 'zh-CN'

export function isLocaleType(value: string): value is LocaleType {
  return value === 'en-US' || value === 'zh-CN'
}

export function localeFromRouteParam(param: unknown): LocaleType {
  return param === LOCALE_PATH_PREFIX ? 'zh-CN' : DEFAULT_LOCALE
}

export function localeToRouteParam(locale: LocaleType): string | undefined {
  return locale === 'zh-CN' ? LOCALE_PATH_PREFIX : undefined
}

export function stripLocalePrefix(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized === `/${LOCALE_PATH_PREFIX}`) return '/'
  if (normalized.startsWith(`/${LOCALE_PATH_PREFIX}/`)) {
    return normalized.slice(`/${LOCALE_PATH_PREFIX}`.length) || '/'
  }
  return normalized
}

export function withLocalePrefix(path: string, locale: LocaleType): string {
  const bare = stripLocalePrefix(path)
  if (locale === DEFAULT_LOCALE) return bare
  if (bare === '/') return `/${LOCALE_PATH_PREFIX}`
  return `/${LOCALE_PATH_PREFIX}${bare}`
}

export function switchPathLocale(path: string, locale: LocaleType): string {
  return withLocalePrefix(stripLocalePrefix(path), locale)
}
