import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// Personenbezogene Daten (Name, Telefon, E-Mail, Nachricht) werden vor dem
// Speichern mit AES-256-GCM verschlüsselt. Der Schlüssel kommt aus der
// Umgebungsvariable DATA_ENCRYPTION_KEY und liegt nie in der Datenbank.

const deriveKey = (secret: string, purpose: string) => createHash('sha256').update(`${purpose}:${secret}`).digest()

export interface Secrets {
  encryptionKey: Buffer
  sessionKey: Buffer
  ipKey: Buffer
  adminPassword: string | null
}

export function loadSecrets(env: Record<string, string | undefined>, dev: boolean): Secrets {
  let secret = env.DATA_ENCRYPTION_KEY
  if (!secret || secret.length < 32) {
    if (!dev) throw new Error('DATA_ENCRYPTION_KEY fehlt oder ist kürzer als 32 Zeichen.')
    secret = 'nur-lokale-entwicklung-nicht-in-produktion-verwenden'
  }
  let password = env.ADMIN_PASSWORD ?? null
  if (!password && dev) password = 'admin'
  if (password && password.length < 10 && !dev) password = null // zu schwach → Login deaktiviert
  return {
    encryptionKey: deriveKey(secret, 'data'),
    sessionKey: deriveKey(secret, 'session'),
    ipKey: deriveKey(secret, 'ip'),
    adminPassword: password,
  }
}

export function encrypt(key: Buffer, value: unknown): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.')
}

export function decrypt<T>(key: Buffer, payload: string): T {
  const [iv, tag, data] = payload.split('.').map((p) => Buffer.from(p, 'base64url'))
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8'))
}

const SESSION_HOURS = 12

export function createSessionToken(key: Buffer, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ exp: now + SESSION_HOURS * 3600_000 })).toString('base64url')
  const sig = createHmac('sha256', key).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifySessionToken(key: Buffer, token: string | null, now = Date.now()): boolean {
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  const expected = createHmac('sha256', key).update(payload).digest()
  const given = Buffer.from(sig, 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return typeof exp === 'number' && exp > now
  } catch {
    return false
  }
}

export function passwordMatches(expected: string, given: string): boolean {
  const a = createHash('sha256').update(expected).digest()
  const b = createHash('sha256').update(given).digest()
  return timingSafeEqual(a, b)
}

/** IP-Adressen werden nur als gesalzener Hash für das Rate-Limit genutzt. */
export const hashIp = (key: Buffer, ip: string) => createHmac('sha256', key).update(ip).digest('hex').slice(0, 24)

export const newId = () => randomBytes(9).toString('base64url')
