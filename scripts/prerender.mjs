/**
 * Post-build prerender for marketing home routes.
 * Order: SPA shell already copied to 404.html; this overwrites index.html / zh-CN/index.html.
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const distDir = resolve(root, 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

const ROUTES = [
  { path: '/', outFile: 'index.html', waitText: 'The Generative AI Cloud for Creators' },
  { path: '/zh-CN', outFile: join('zh-CN', 'index.html'), waitText: '面向创作者的生成式 AI 云' },
]

function contentType(filePath) {
  return MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

function startStaticServer() {
  const spaShell = readFileSync(join(distDir, '404.html'))

  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      let pathname = decodeURIComponent(url.pathname)
      if (pathname.endsWith('/')) pathname += 'index.html'

      const candidate = join(distDir, pathname.replace(/^\//, ''))
      if (existsSync(candidate) && statSync(candidate).isFile()) {
        res.writeHead(200, { 'Content-Type': contentType(candidate) })
        res.end(readFileSync(candidate))
        return
      }

      // SPA fallback for client routes during prerender
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(spaShell)
    } catch (error) {
      res.writeHead(500)
      res.end(String(error))
    }
  })

  return new Promise((resolveServer) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Failed to bind prerender server')
      }
      resolveServer({ server, port: address.port })
    })
  })
}

async function prerenderRoute(browser, baseUrl, route) {
  const page = await browser.newPage()
  const url = `${baseUrl}${route.path}`
  console.log(`[prerender] visiting ${url}`)

  await page.goto(url, { waitUntil: 'load', timeout: 60_000 })
  await page.waitForSelector('[data-home-ready]', { timeout: 30_000 })
  await page.waitForFunction(
    (text) => {
      const h1 = document.querySelector('#home-hero-title')
      return Boolean(h1 && h1.textContent && h1.textContent.includes(text))
    },
    route.waitText,
    { timeout: 30_000 },
  )
  // Allow unhead to flush meta tags
  await new Promise((r) => setTimeout(r, 500))

  const html = await page.content()
  const outPath = join(distDir, route.outFile)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, html, 'utf8')
  console.log(`[prerender] wrote ${outPath}`)
  await page.close()
}

async function main() {
  if (!existsSync(join(distDir, '404.html'))) {
    throw new Error('dist/404.html missing — copy SPA shell before prerender')
  }

  const { server, port } = await startStaticServer()
  const baseUrl = `http://127.0.0.1:${port}`
  const browser = await chromium.launch({ headless: true })

  try {
    for (const route of ROUTES) {
      await prerenderRoute(browser, baseUrl, route)
    }
  } finally {
    await browser.close()
    server.close()
  }
}

main().catch((error) => {
  console.error('[prerender] failed:', error)
  process.exit(1)
})
