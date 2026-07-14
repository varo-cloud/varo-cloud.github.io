declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function loadGtag(measurementId: string): Promise<void> {
  if (window.gtag) {
    return Promise.resolve()
  }

  window.dataLayer = window.dataLayer ?? []
  const gtag: (...args: unknown[]) => void = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag = gtag

  gtag('js', new Date())
  gtag('config', measurementId, { send_page_view: false })

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Analytics'))
    document.head.appendChild(script)
  })
}
