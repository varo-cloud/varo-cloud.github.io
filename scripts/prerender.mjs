/**
 * Post-build prerender for public (no-auth) marketing routes.
 * Order: SPA shell already copied to 404.html; this writes route HTML under dist/.
 *
 * Dynamic pages wait for `data-seo-content-ready` (first API-backed block settled)
 * so model cards / pricing rows land in the static HTML when the API is reachable.
 * API calls are proxied via Playwright `route.fetch()` to avoid browser CORS from 127.0.0.1.
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const distDir = resolve(root, 'dist')

const CONTENT_TIMEOUT_MS = 45_000

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

/** Public marketing routes (no login). Model detail is dynamic — runtime Head only.
 * Use `path.html` (not `path/index.html`) so GitHub Pages serves `/path` as 200
 * without a trailing-slash 301.
 */
const ROUTES = [
  {
    path: '/',
    outFile: 'index.html',
    ready: '[data-seo-ready="home"]',
    waitSelector: '#home-hero-title',
    waitText: 'The Generative AI Cloud for Creators',
    contentReady: '[data-seo-content-ready="home"]',
    contentItem: '.home-featured-card',
  },
  {
    path: '/zh-CN',
    outFile: 'zh-CN.html',
    ready: '[data-seo-ready="home"]',
    waitSelector: '#home-hero-title',
    waitText: '面向创作者的生成式 AI 云',
    contentReady: '[data-seo-content-ready="home"]',
    contentItem: '.home-featured-card',
  },
  {
    path: '/models',
    outFile: 'models.html',
    ready: '[data-seo-ready="models"]',
    waitSelector: '#models-hero-title',
    waitText: 'All Your AI Models, in One Place',
    contentReady: '[data-seo-content-ready="models"]',
    contentItem: '.model-card',
  },
  {
    path: '/zh-CN/models',
    outFile: join('zh-CN', 'models.html'),
    ready: '[data-seo-ready="models"]',
    waitSelector: '#models-hero-title',
    waitText: '所有 AI 模型，集于一处',
    contentReady: '[data-seo-content-ready="models"]',
    contentItem: '.model-card',
  },
  {
    path: '/pricing',
    outFile: 'pricing.html',
    ready: '[data-seo-ready="pricing"]',
    waitSelector: '#pricing-hero-title',
    waitText: 'Simple, Transparent AI Model Pricing',
    contentReady: '[data-seo-content-ready="pricing"]',
    contentItem: '.pricing-row',
  },
  {
    path: '/zh-CN/pricing',
    outFile: join('zh-CN', 'pricing.html'),
    ready: '[data-seo-ready="pricing"]',
    waitSelector: '#pricing-hero-title',
    waitText: '简单、透明的 AI 模型定价',
    contentReady: '[data-seo-content-ready="pricing"]',
    contentItem: '.pricing-row',
  },
  {
    path: '/developers',
    outFile: 'developers.html',
    ready: '[data-seo-ready="developers"]',
    waitSelector: '#developers-hero-title',
    waitText: "One API for the world's top models",
  },
  {
    path: '/zh-CN/developers',
    outFile: join('zh-CN', 'developers.html'),
    ready: '[data-seo-ready="developers"]',
    waitSelector: '#developers-hero-title',
    waitText: '一个 API，接入全球顶尖模型',
  },
  {
    path: '/ai-generator',
    outFile: 'ai-generator.html',
    ready: '[data-seo-ready="ai-generator"]',
    titleIncludes: 'AI Generator',
    contentReady: '[data-seo-content-ready="ai-generator"]',
  },
  {
    path: '/zh-CN/ai-generator',
    outFile: join('zh-CN', 'ai-generator.html'),
    ready: '[data-seo-ready="ai-generator"]',
    titleIncludes: 'AI 生成器',
    contentReady: '[data-seo-content-ready="ai-generator"]',
  },
  {
    path: '/docs',
    outFile: 'docs.html',
    ready: '[data-seo-ready="docs"]',
    titleIncludes: 'Documentation',
  },
  {
    path: '/zh-CN/docs',
    outFile: join('zh-CN', 'docs.html'),
    ready: '[data-seo-ready="docs"]',
    titleIncludes: '文档',
  },
  {
    path: '/terms',
    outFile: 'terms.html',
    ready: '[data-seo-ready="terms"]',
    titleIncludes: 'Terms of Service',
  },
  {
    path: '/zh-CN/terms',
    outFile: join('zh-CN', 'terms.html'),
    ready: '[data-seo-ready="terms"]',
    titleIncludes: '服务条款',
  },
  {
    path: '/privacy',
    outFile: 'privacy.html',
    ready: '[data-seo-ready="privacy"]',
    titleIncludes: 'Privacy Policy',
  },
  {
    path: '/zh-CN/privacy',
    outFile: join('zh-CN', 'privacy.html'),
    ready: '[data-seo-ready="privacy"]',
    titleIncludes: '隐私政策',
  },
]

function contentType(filePath) {
  return MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

/** Resolve like GitHub Pages: `/models` → `models.html` (no trailing-slash redirect). */
function resolveDistFile(pathname) {
  let path = decodeURIComponent(pathname)
  if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1)
  if (path === '' || path === '/') {
    const index = join(distDir, 'index.html')
    return existsSync(index) ? index : null
  }

  const relative = path.replace(/^\//, '')
  const candidates = [
    join(distDir, relative),
    join(distDir, `${relative}.html`),
    join(distDir, relative, 'index.html'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

function startStaticServer() {
  const spaShell = readFileSync(join(distDir, '404.html'))

  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      const file = resolveDistFile(url.pathname)
      if (file) {
        res.writeHead(200, { 'Content-Type': contentType(file) })
        res.end(readFileSync(file))
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

/** Proxy backend API through Node so prerender is not blocked by browser CORS. */
async function installApiProxy(page) {
  await page.route(
    (url) => {
      const href = url.href
      return (
        href.includes('/api/') ||
        href.includes('api.varo.cloud') ||
        href.includes('staging.api.varo.cloud')
      )
    },
    async (route) => {
      try {
        const response = await route.fetch()
        await route.fulfill({ response })
      } catch (error) {
        console.warn(`[prerender] API proxy failed: ${route.request().url()}`, error)
        await route.abort()
      }
    },
  )
}

async function waitForDynamicContent(page, route) {
  if (!route.contentReady) return

  try {
    await page.waitForSelector(route.contentReady, { timeout: CONTENT_TIMEOUT_MS })
    if (route.contentItem) {
      const count = await page.locator(route.contentItem).count()
      if (count === 0) {
        console.warn(
          `[prerender] ${route.path}: content settled but found 0 items (${route.contentItem}) — API empty or failed`,
        )
      } else {
        console.log(`[prerender] ${route.path}: captured ${count} × ${route.contentItem}`)
      }
    } else {
      console.log(`[prerender] ${route.path}: dynamic content ready`)
    }
  } catch {
    console.warn(
      `[prerender] ${route.path}: timed out waiting for ${route.contentReady}; writing HTML without dynamic block`,
    )
  }
}

async function prerenderRoute(browser, baseUrl, route) {
  const page = await browser.newPage()
  await installApiProxy(page)

  const url = `${baseUrl}${route.path}`
  console.log(`[prerender] visiting ${url}`)

  await page.goto(url, { waitUntil: 'load', timeout: 60_000 })
  await page.waitForSelector(route.ready, { timeout: 30_000 })

  if (route.waitSelector && route.waitText) {
    await page.waitForFunction(
      ({ selector, text }) => {
        const el = document.querySelector(selector)
        return Boolean(el && el.textContent && el.textContent.includes(text))
      },
      { selector: route.waitSelector, text: route.waitText },
      { timeout: 30_000 },
    )
  }

  if (route.titleIncludes) {
    await page.waitForFunction(
      (fragment) => typeof document.title === 'string' && document.title.includes(fragment),
      route.titleIncludes,
      { timeout: 30_000 },
    )
  }

  await waitForDynamicContent(page, route)

  // Allow unhead to flush meta tags; images may still be loading (opacity fade).
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
