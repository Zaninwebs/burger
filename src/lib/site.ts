/**
 * Vorschau-Modus (VITE_DEMO=1): relative Pfade, damit die Seite auch in einem
 * Unterordner läuft, und eine lokale Demo-Termin-API ohne Server.
 */
export const IS_DEMO = import.meta.env.VITE_DEMO === '1'

const prefix = () => (typeof document !== 'undefined' && document.body.dataset.page ? '../' : './')

/** Link innerhalb der Website, z. B. siteUrl('/impressum/') oder siteUrl('/#termin'). */
export function siteUrl(path: string): string {
  if (!IS_DEMO) return path
  const [p, hash] = path.replace(/^\//, '').split('#')
  const file = p === '' ? 'index.html' : p.endsWith('/') ? `${p}index.html` : p
  return `${prefix()}${file}${hash ? `#${hash}` : ''}`
}

/** Datei aus public/, z. B. asset('img/x.webp'). */
export const asset = (path: string) => (IS_DEMO ? `${prefix()}${path}` : `/${path}`)
