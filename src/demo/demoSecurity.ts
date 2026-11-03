// Browser-Ersatz für server/security.ts – nur für die Demo-Version.
// Wird im Vorschau-Build per Vite-Alias statt der Node-Krypto eingesetzt.
// Daten bleiben ausschließlich im Browser des Betrachters (localStorage).

export const DEMO_PASSWORD = 'demo'

export interface Secrets {
  encryptionKey: unknown
  sessionKey: unknown
  ipKey: unknown
  adminPassword: string | null
}

export const loadSecrets = (): Secrets => ({ encryptionKey: 0, sessionKey: 0, ipKey: 0, adminPassword: DEMO_PASSWORD })
export const encrypt = (_key: unknown, value: unknown) => JSON.stringify(value)
export const decrypt = <T,>(_key: unknown, payload: string): T => JSON.parse(payload)
export const createSessionToken = (_key: unknown, now = Date.now()) => `demo.${now + 12 * 3600_000}`
export const verifySessionToken = (_key: unknown, token: string | null, now = Date.now()) =>
  !!token && token.startsWith('demo.') && Number(token.slice(5)) > now
export const passwordMatches = (expected: string, given: string) => expected === given.trim().toLowerCase()
export const hashIp = (_key: unknown, ip: string) => ip
export const newId = () => Math.random().toString(36).slice(2, 14)
