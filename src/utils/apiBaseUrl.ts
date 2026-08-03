/**
 * Resolve API base path for subpath deployments (e.g. GitHub Pages).
 *
 * VITE_API_BASE_URL=/api is relative to the app base, not the domain root.
 * Local / GitHub Pages root site: /api
 */
export function apiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL || 'api').trim()

  if (/^https?:\/\//i.test(configured)) {
    return configured.replace(/\/$/, '')
  }

  const apiPath = configured.replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${apiPath}`.replace(/\/$/, '')
}

/**
 * Admin API base (generations / model-offerings, etc.).
 * Staging: https://staging.admin.varo.cloud/api
 * Production: https://admin.varo.cloud/api
 * Local unset → same as apiBaseUrl() (`/api`), with vite proxy for `/api/admin`.
 */
export function adminApiBaseUrl(): string {
  const configured = import.meta.env.VITE_ADMIN_API_BASE_URL?.trim()
  if (configured) {
    if (/^https?:\/\//i.test(configured)) {
      return configured.replace(/\/$/, '')
    }
    const apiPath = configured.replace(/^\//, '')
    return `${import.meta.env.BASE_URL}${apiPath}`.replace(/\/$/, '')
  }
  return apiBaseUrl()
}

/** Map mock route like `/api/models/:id` to the deployed API prefix. */
export function toProdMockUrl(mockUrl: string): string {
  const base = apiBaseUrl()

  if (mockUrl.startsWith('/api')) {
    return mockUrl.replace(/^\/api/, base)
  }

  const normalized = mockUrl.startsWith('/') ? mockUrl : `/${mockUrl}`
  return `${base}${normalized}`
}
