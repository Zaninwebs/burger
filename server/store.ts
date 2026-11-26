// Minimale Key-Value-Schnittstelle. In Produktion: Netlify Blobs
// (server/blobStore.ts). Lokal: JSON-Dateien in .data/ (nur Entwicklung).

export interface KVStore {
  get<T>(key: string): Promise<T | null>
  set(key: string, value: unknown): Promise<void>
  /** Schreibt nur, wenn der Schlüssel noch nicht existiert. true = geschrieben. */
  setIfNew(key: string, value: unknown): Promise<boolean>
  delete(key: string): Promise<void>
  list(prefix: string): Promise<string[]>
}

export async function createFileStore(dir: string): Promise<KVStore> {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const ensureDir = () => fs.mkdir(dir, { recursive: true })
  await ensureDir()
  const file = (key: string) => path.join(dir, encodeURIComponent(key) + '.json')

  return {
    async get(key) {
      try {
        return JSON.parse(await fs.readFile(file(key), 'utf8'))
      } catch {
        return null
      }
    },
    async set(key, value) {
      await ensureDir()
      await fs.writeFile(file(key), JSON.stringify(value))
    },
    async setIfNew(key, value) {
      await ensureDir()
      try {
        await fs.writeFile(file(key), JSON.stringify(value), { flag: 'wx' })
        return true
      } catch {
        return false
      }
    },
    async delete(key) {
      await fs.rm(file(key), { force: true })
    },
    async list(prefix) {
      const names = await fs.readdir(dir).catch(() => [] as string[])
      return names
        .filter((n) => n.endsWith('.json'))
        .map((n) => decodeURIComponent(n.slice(0, -5)))
        .filter((k) => k.startsWith(prefix))
        .sort()
    },
  }
}
