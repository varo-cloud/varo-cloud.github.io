import { apiBaseUrl } from '@/utils/apiBaseUrl'
import { resolveRequestBearerToken } from '@/utils/devAuthToken'
import { resolveMediaPreviewKind } from '@/utils/mediaPreview'

export function guessDownloadFilename(url: string, index = 0): string {
  const path = url.split('#')[0]?.split('?')[0] ?? ''
  const basename = path.split('/').pop()
  if (basename && /\.\w{2,5}$/i.test(basename)) return basename

  const kind = resolveMediaPreviewKind(url)
  if (kind === 'video') return `generation-${index + 1}.mp4`
  if (kind === 'audio') return `generation-${index + 1}.mp3`
  return `generation-${index + 1}.png`
}

function triggerBlobDownload(blobUrl: string, filename: string): void {
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function buildAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {}
  const token = resolveRequestBearerToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function fetchMediaBlob(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url, { mode: 'cors' })
    if (response.ok) {
      return await response.blob()
    }
  } catch {
    // Direct fetch can fail for cross-origin resources without CORS.
  }

  try {
    const proxyUrl = `${apiBaseUrl()}/media/download?url=${encodeURIComponent(url)}`
    const response = await fetch(proxyUrl, {
      credentials: 'same-origin',
      headers: buildAuthHeaders(),
    })
    if (response.ok) {
      return await response.blob()
    }
  } catch {
    // Proxy endpoint may be unavailable in some environments.
  }

  return null
}

export async function downloadMediaFile(url: string, filename: string): Promise<void> {
  const blob = await fetchMediaBlob(url)
  if (!blob) {
    throw new Error('download failed')
  }

  const objectUrl = URL.createObjectURL(blob)
  try {
    triggerBlobDownload(objectUrl, filename)
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }
}
