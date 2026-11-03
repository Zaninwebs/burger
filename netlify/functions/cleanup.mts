import type { Config } from '@netlify/functions'
import { createBlobStore } from '../../server/blobStore'
import { createHandler } from '../../server/handler'
import { loadSecrets } from '../../server/security'

// Löschkonzept: Terminanfragen werden RETENTION_DAYS Tage nach dem
// Termindatum automatisch gelöscht (Standard: 30 Tage), abgelehnte Anfragen
// 30 Tage nach der Ablehnung.
export default async () => {
  const { cleanup } = createHandler({ store: createBlobStore(), secrets: loadSecrets(process.env, false) })
  const removed = await cleanup(Number(process.env.RETENTION_DAYS ?? 30))
  console.log(`Aufräumen: ${removed} Anfragen gelöscht.`)
}

export const config: Config = {
  schedule: '@daily',
}
