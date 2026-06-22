import { http, unwrap } from './http'
import type { UploadKind, UploadResult } from '@/types'

export function uploadFile(file: File, kind?: UploadKind) {
  const formData = new FormData()
  formData.append('file', file)

  const url = kind ? `/upload?kind=${kind}` : '/upload'

  return unwrap<UploadResult>(
    http.post(url, formData, {
      timeout: 120_000,
    }),
  )
}
