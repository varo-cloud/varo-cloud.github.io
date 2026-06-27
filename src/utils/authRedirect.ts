import { getCurrentLocale } from '@/i18n'
import { localeToRouteParam } from '@/i18n/locale-path'

let redirecting = false

/** 401 且 refresh 失败后：清 session 并跳转登录页 */
export async function handleUnauthorizedSession(): Promise<void> {
  if (redirecting || typeof window === 'undefined') return

  redirecting = true
  try {
    const [{ default: router }, { clearAuthTokens }, { useUserStore }] = await Promise.all([
      import('@/router'),
      import('@/api/http'),
      import('@/stores/user'),
    ])

    clearAuthTokens()
    useUserStore().clearSession()

    if (router.currentRoute.value.name === 'auth') return

    const redirect = router.currentRoute.value.fullPath
    await router.push({
      name: 'auth',
      params: { locale: localeToRouteParam(getCurrentLocale()) },
      query: { redirect },
    })
  } finally {
    redirecting = false
  }
}
