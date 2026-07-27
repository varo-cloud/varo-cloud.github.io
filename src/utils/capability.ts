const CAPABILITY_TO_MARKER = '-to-'

export interface CapabilityTagTone {
  color: string
  background: string
}

/** Figma pricing table capability tag colors (dot + text share `color`). */
const CAPABILITY_TAG_TONES: CapabilityTagTone[] = [
  { color: '#4f6ef5', background: 'rgba(79, 110, 245, 0.06)' },
  { color: '#20a463', background: 'rgba(32, 164, 99, 0.06)' },
  { color: '#b44ad0', background: 'rgba(180, 74, 208, 0.06)' },
  { color: '#06b6d4', background: 'rgba(6, 182, 212, 0.06)' },
  { color: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)' },
  { color: '#ef4444', background: 'rgba(239, 68, 68, 0.06)' },
]

const CAPABILITY_TAG_TONE_BY_SLUG: Record<string, CapabilityTagTone> = {
  'text-to-video': CAPABILITY_TAG_TONES[0],
  'image-to-video': CAPABILITY_TAG_TONES[1],
  'reference-to-video': CAPABILITY_TAG_TONES[2],
  'text-to-image': CAPABILITY_TAG_TONES[3],
  'image-to-image': CAPABILITY_TAG_TONES[4],
  'edit-video': CAPABILITY_TAG_TONES[5],
}

function titleCaseSegment(segment: string): string {
  if (!segment) return ''
  return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
}

/** Format capability slug like `text-to-image` as `Text to Image`. */
export function formatCapabilityLabel(capability?: string | null): string {
  if (!capability) return ''

  const markerIndex = capability.indexOf(CAPABILITY_TO_MARKER)
  if (markerIndex === -1) {
    return capability
      .split('-')
      .filter(Boolean)
      .map(titleCaseSegment)
      .join(' ')
  }

  const from = capability.slice(0, markerIndex)
  const to = capability.slice(markerIndex + CAPABILITY_TO_MARKER.length)
  return `${titleCaseSegment(from)} to ${titleCaseSegment(to)}`
}

function hashCapabilitySlug(slug: string): number {
  let hash = 0
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/** Resolve pricing-table capability tag colors from Figma tones. */
export function resolveCapabilityTagTone(capability?: string | null): CapabilityTagTone {
  const slug = capability?.trim().toLowerCase() ?? ''
  if (!slug) return CAPABILITY_TAG_TONES[0]

  const mapped = CAPABILITY_TAG_TONE_BY_SLUG[slug]
  if (mapped) return mapped

  return CAPABILITY_TAG_TONES[hashCapabilitySlug(slug) % CAPABILITY_TAG_TONES.length]
}
