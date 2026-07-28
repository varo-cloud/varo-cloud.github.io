const DEFAULT_DOCS_URL = 'https://docs.varo.cloud'

/** External Mintlify docs base URL. Defaults to production docs. */
export function docsUrl(): string | null {
  const configured = import.meta.env.VITE_DOCS_URL?.trim()
  return configured || DEFAULT_DOCS_URL
}

export function openDocs(fallback?: () => void): void {
  const url = docsUrl()
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  fallback?.()
}
