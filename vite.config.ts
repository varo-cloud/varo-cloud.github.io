import path from 'node:path'
import type { ClientRequest } from 'node:http'
import type { ProxyOptions } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { viteMockServe } from 'vite-plugin-mock'

function resolveDevApiProxyTarget(env: Record<string, string>, key = 'VITE_DEV_API_PROXY_TARGET'): string | null {
  const configured = env[key]?.trim()
  if (!configured || !/^https?:\/\//i.test(configured)) return null

  try {
    return new URL(configured).origin
  } catch {
    return null
  }
}

function createDevProxyEntry(target: string, devBearerToken?: string): ProxyOptions {
  return {
    target,
    changeOrigin: true,
    secure: true,
    ...(devBearerToken
      ? {
          configure: (proxyServer: {
            on: (event: 'proxyReq', listener: (req: ClientRequest) => void) => void
          }) => {
            proxyServer.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('authorization')
              proxyReq.setHeader('Authorization', `Bearer ${devBearerToken}`)
            })
          },
        }
      : {}),
  }
}

function buildDevProxy(env: Record<string, string>): Record<string, ProxyOptions> | undefined {
  const userTarget = resolveDevApiProxyTarget(env, 'VITE_DEV_API_PROXY_TARGET')
  const adminTarget = resolveDevApiProxyTarget(env, 'VITE_DEV_ADMIN_API_PROXY_TARGET')
  const devBearerToken = (env.VITE_DEV_AUTH_TOKEN ?? env.VITE_DEV_BEARER_TOKEN)?.trim()

  if (!userTarget && !adminTarget) return undefined

  if (userTarget && adminTarget) {
    return {
      // More specific `/api/admin` must be registered before `/api`.
      '/api/admin': createDevProxyEntry(adminTarget, devBearerToken),
      '/api': createDevProxyEntry(userTarget, devBearerToken),
    }
  }

  const fallback = adminTarget ?? userTarget
  return fallback ? { '/api': createDevProxyEntry(fallback, devBearerToken) } : undefined
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDevServe = command === 'serve'
  const siteOrigin = (
    env.VITE_SITE_ORIGIN?.trim() ||
    (mode === 'staging' ? 'https://varo-staging.github.io' : 'https://varo.cloud')
  ).replace(/\/$/, '')
  const proxy = isDevServe ? buildDevProxy(env) : undefined

  return {
    // 正式 / 测试均为根路径: /（测试部署在 varo-staging.github.io）
    base: env.VITE_BASE || '/',
    plugins: [
      vue(),
      UnoCSS(),
      {
        name: 'html-site-origin',
        transformIndexHtml(html) {
          return html.replaceAll('%VITE_SITE_ORIGIN%', siteOrigin)
        },
      },
      viteMockServe({
        mockPath: 'mock',
        enable: command === 'serve' && env.VITE_USE_MOCK === 'true',
        ignore: (fileName) => fileName.includes('_util'),
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: proxy ? { proxy } : undefined,
  }
})
