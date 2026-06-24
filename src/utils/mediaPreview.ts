export type MediaPreviewKind = 'image' | 'video' | 'audio'

export function resolveMediaPreviewKind(url: string): MediaPreviewKind {
  const path = url.split('#')[0]?.split('?')[0]?.toLowerCase() ?? ''

  if (/\.(mp4|webm|mov|m4v|ogv)$/.test(path)) return 'video'
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/.test(path)) return 'audio'
  return 'image'
}
