import { apiBaseUrl } from './apiBaseUrl'

export function authApiBaseUrl(): string {
  // Local dev always routes auth through vite-plugin-mock (/api/auth/*).
  if (import.meta.env.DEV) {
    return apiBaseUrl().replace(/\/$/, '')
  }

  const configured = import.meta.env.VITE_AUTH_API_BASE_URL?.trim()
  if (!configured) return apiBaseUrl().replace(/\/$/, '')

  return configured.replace(/\/$/, '')
}

export function useRealAuthApi(): boolean {
  if (import.meta.env.DEV) return false
  return Boolean(import.meta.env.VITE_AUTH_API_BASE_URL?.trim())
}
