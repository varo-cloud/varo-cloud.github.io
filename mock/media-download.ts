import type { MockMethod } from 'vite-plugin-mock'
import type { IncomingMessage, ServerResponse } from 'node:http'

export default [
  {
    url: '/api/media/download',
    method: 'get',
    rawResponse: async (req: IncomingMessage, res: ServerResponse) => {
      const remoteUrl = new URL(req.url ?? '', 'http://localhost').searchParams.get('url')

      if (!remoteUrl) {
        res.statusCode = 400
        res.end('Missing url parameter')
        return
      }

      try {
        const response = await fetch(remoteUrl)
        if (!response.ok) {
          res.statusCode = response.status
          res.end('Failed to fetch remote resource')
          return
        }

        const contentType = response.headers.get('content-type')
        if (contentType) {
          res.setHeader('Content-Type', contentType)
        }
        res.setHeader('Content-Disposition', 'attachment')

        const buffer = Buffer.from(await response.arrayBuffer())
        res.statusCode = 200
        res.end(buffer)
      } catch {
        res.statusCode = 502
        res.end('Failed to proxy download')
      }
    },
  },
] as MockMethod[]
