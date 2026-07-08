/** Normalize catalog slug from API, e.g. strip leading slash from `/text-to-image`. */
export function normalizeModelSlug(slug: string): string {
  return slug.trim().replace(/^\/+|\/+$/g, '')
}

/** Valid slugs must be `family/capability` with both segments non-empty. */
export function isValidModelSlug(slug: string): boolean {
  const parts = normalizeModelSlug(slug).split('/').filter(Boolean)
  return parts.length >= 2
}
