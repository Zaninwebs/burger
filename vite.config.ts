import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { Readable } from 'node:stream'
import { defineConfig, type Plugin } from 'vite'

/**
 * Lokale Entwicklung: bedient /api/* mit demselben Handler wie die
 * Netlify Function, speichert aber in .data/ statt in Netlify Blobs.
 */
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      let handlerPromise: Promise<(req: Request, ip: string) => Promise<Response>> | null = null
      const getHandler = () =>
        (handlerPromise ??= (async () => {
          const { createHandler } = await server.ssrLoadModule('/server/handler.ts')
          const { createFileStore } = await server.ssrLoadModule('/server/store.ts')
          const { loadSecrets } = await server.ssrLoadModule('/server/security.ts')
          const store = await createFileStore(resolve(import.meta.dirname, '.data'))
          return createHandler({ store, secrets: loadSecrets(process.env, true) }).handle
        })())

      server.middlewares.use('/api', async (req, res) => {
        const handle = await getHandler()
        const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : (Readable.toWeb(req) as ReadableStream)
        const request = new Request(`http://localhost/api${req.url}`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body,
          duplex: 'half',
        } as RequestInit)
        const response = await handle(request, req.socket.remoteAddress ?? 'local')
        res.statusCode = response.status
        response.headers.forEach((v: string, k: string) => res.setHeader(k, v))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }
}

// Vorschau-Build (npm run build:preview): relative Pfade, Demo-Termin-API, ohne Admin
const demo = process.env.VITE_DEMO === '1'

export default defineConfig({
  plugins: [react(), devApi()],
  base: demo ? './' : '/',
  // Demo: Node-Krypto durch Browser-Ersatz tauschen, damit der echte
  // Server-Code (server/handler.ts) im Browser laufen kann
  resolve: demo
    ? { alias: [{ find: /^\.\/security$/, replacement: resolve(import.meta.dirname, 'src/demo/demoSecurity.ts') }] }
    : undefined,
  build: {
    outDir: demo ? 'dist-preview' : 'dist',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin/index.html'),
        impressum: resolve(import.meta.dirname, 'impressum/index.html'),
        datenschutz: resolve(import.meta.dirname, 'datenschutz/index.html'),
      },
    },
  },
})
