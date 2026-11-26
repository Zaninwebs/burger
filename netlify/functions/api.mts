import type { Config, Context } from '@netlify/functions'
import { createBlobStore } from '../../server/blobStore'
import { createHandler, createNotifier } from '../../server/handler'
import { loadSecrets } from '../../server/security'

const env = process.env

export default async (req: Request, context: Context) => {
  const { handle } = createHandler({
    store: createBlobStore(),
    secrets: loadSecrets(env, false),
    notify: createNotifier(env),
  })
  return handle(req, context.ip)
}

export const config: Config = {
  path: '/api/*',
}
