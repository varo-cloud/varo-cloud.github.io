const CAPABILITY_TO_MARKER = '-to-'

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
