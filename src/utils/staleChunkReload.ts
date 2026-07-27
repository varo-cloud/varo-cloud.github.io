/**
 * After a GitHub Pages redeploy, hashed Vite chunks disappear.
 * Long-lived tabs then fail on lazy route/component imports — reload once to pick up the new index.
 */
const RELOAD_FLAG = 'varo:stale-chunk-reload'
const RELOAD_COOLDOWN_MS = 10_000

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Unable to preload CSS/i.test(message)
  )
}

export function reloadForStaleChunk(): void {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0)
    const now = Date.now()
    if (now - last < RELOAD_COOLDOWN_MS) return
    sessionStorage.setItem(RELOAD_FLAG, String(now))
  } catch {
    // sessionStorage unavailable — still attempt a single reload
  }
  window.location.reload()
}
