import { getStore } from '@netlify/blobs'
import type { KVStore } from './store'

export function createBlobStore(): KVStore {
  const store = getStore({ name: 'terminverwaltung', consistency: 'strong' })
  return {
    async get(key) {
      return (await store.get(key, { type: 'json' })) ?? null
    },
    async set(key, value) {
      await store.setJSON(key, value)
    },
    async setIfNew(key, value) {
      const res = await store.setJSON(key, value, { onlyIfNew: true })
      return res.modified
    },
    async delete(key) {
      await store.delete(key)
    },
    async list(prefix) {
      const keys: string[] = []
      for await (const page of store.list({ prefix, paginate: true })) {
        for (const b of page.blobs) keys.push(b.key)
      }
      return keys.sort()
    },
  }
}
