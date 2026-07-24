/** Normalize catalog slug from API, e.g. strip leading slash from `/text-to-image`. */
export function normalizeModelSlug(slug: string): string {
  return slug.trim().replace(/^\/+|\/+$/g, '')
}

/** Valid slugs must be `family/capability` with both segments non-empty. */
export function isValidModelSlug(slug: string): boolean {
  const parts = normalizeModelSlug(slug).split('/').filter(Boolean)
  return parts.length >= 2
}

/** Base model slug from a catalog slug, e.g. `seedance-2.0/text-to-video` → `seedance-2.0`. */
export function extractBaseModelSlug(slug: string): string {
  return normalizeModelSlug(slug).split('/').filter(Boolean)[0] ?? ''
}
