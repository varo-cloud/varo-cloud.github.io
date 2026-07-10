const PRODUCTION_INFERENCE_API_BASE_URL = 'https://inference.varo.cloud/v1'
const STAGING_INFERENCE_API_BASE_URL = 'https://staging.inference.varo.cloud/v1'

/** Base URL for external inference API examples (model detail API docs, playground snippets). */
export function inferenceApiBaseUrl(): string {
  const configured = import.meta.env.VITE_INFERENCE_API_BASE_URL?.trim()
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  return import.meta.env.MODE === 'production'
    ? PRODUCTION_INFERENCE_API_BASE_URL
    : STAGING_INFERENCE_API_BASE_URL
}
