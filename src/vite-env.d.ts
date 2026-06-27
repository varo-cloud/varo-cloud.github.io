/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module '*.md?raw' {
  const content: string
  export default content
}

interface ImportMetaEnv {
  readonly VITE_USE_MOCK: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_BASE?: string
  readonly VITE_TURNSTILE_SITE_KEY?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  /** 本地 dev server 将 /api 代理到此 origin，如 https://staging.api.varo.cloud */
  readonly VITE_DEV_API_PROXY_TARGET?: string
  /** 本地开发 JWT（access token 有效期 15 分钟，过期需更新） */
  readonly VITE_DEV_BEARER_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
