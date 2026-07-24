/**
 * Post-build prerender for public (no-auth) marketing routes.
 * Order: SPA shell already copied to 404.html; this writes route HTML under dist/.
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

/** Public marketing routes (no login). Model detail is dynamic — runtime Head only. */
const ROUTES = [
  {
    path: '/',
    outFile: 'index.html',
    ready: '[data-seo-ready="home"]',
    waitSelector: '#home-hero-title',
    waitText: 'The Generative AI Cloud for Creators',
  },
  {
    path: '/zh-CN',
    outFile: join('zh-CN', 'index.html'),
    ready: '[data-seo-ready="home"]',
    waitSelector: '#home-hero-title',
    waitText: '面向创作者的生成式 AI 云',
  },
  {
    path: '/models',
    outFile: join('models', 'index.html'),
    ready: '[data-seo-ready="models"]',
    waitSelector: '#models-hero-title',
    waitText: 'All Your AI Models, in One Place',
  },
  {
    path: '/zh-CN/models',
    outFile: join('zh-CN', 'models', 'index.html'),
    ready: '[data-seo-ready="models"]',
    waitSelector: '#models-hero-title',
    waitText: '所有 AI 模型，集于一处',
  },
  {
    path: '/pricing',
    outFile: join('pricing', 'index.html'),
    ready: '[data-seo-ready="pricing"]',
    waitSelector: '#pricing-hero-title',
    waitText: 'Simple, Transparent AI Model Pricing',
  },
  {
    path: '/zh-CN/pricing',
    outFile: join('zh-CN', 'pricing', 'index.html'),
    ready: '[data-seo-ready="pricing"]',
    waitSelector: '#pricing-hero-title',
    waitText: '简单、透明的 AI 模型定价',
  },
  {
    path: '/ai-generator',
    outFile: join('ai-generator', 'index.html'),
    ready: '[data-seo-ready="ai-generator"]',
    titleIncludes: 'AI Generator',
  },
  {
    path: '/zh-CN/ai-generator',
    outFile: join('zh-CN', 'ai-generator', 'index.html'),
    ready: '[data-seo-ready="ai-generator"]',
    titleIncludes: 'AI 生成器',
  },
  {
    path: '/docs',
    outFile: join('docs', 'index.html'),
    ready: '[data-seo-ready="docs"]',
    titleIncludes: 'Documentation',
  },
  {
    path: '/zh-CN/docs',
    outFile: join('zh-CN', 'docs', 'index.html'),
    ready: '[data-seo-ready="docs"]',
    titleIncludes: '文档',
  },
  {
    path: '/terms',
    outFile: join('terms', 'index.html'),
    ready: '[data-seo-ready="terms"]',
    titleIncludes: 'Terms of Service',
  },
  {
    path: '/zh-CN/terms',
    outFile: join('zh-CN', 'terms', 'index.html'),
    ready: '[data-seo-ready="terms"]',
    titleIncludes: '服务条款',
  },
  {
    path: '/privacy',
    outFile: join('privacy', 'index.html'),
    ready: '[data-seo-ready="privacy"]',
    titleIncludes: 'Privacy Policy',
  },
  {
    path: '/zh-CN/privacy',
    outFile: join('zh-CN', 'privacy', 'index.html'),
    ready: '[data-seo-ready="privacy"]',
    titleIncludes: '隐私政策',
  },
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
