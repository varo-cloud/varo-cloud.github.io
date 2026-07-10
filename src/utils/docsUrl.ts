/** External Mintlify docs base URL (e.g. staging: varocloudtest.mintlify.site/docs). */
export function docsUrl(): string | null {
  const configured = import.meta.env.VITE_DOCS_URL?.trim()
  return configured || null
}

export function openDocs(fallback?: () => void): void {
  const url = docsUrl()
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  fallback?.()
}
