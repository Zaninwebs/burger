// Bild-Pipeline: liest Originale aus images-src/, schneidet zu, schärft leicht
// und schreibt AVIF + WebP in mehreren Breiten nach public/img/.
// Zusätzlich entsteht src/data/images.generated.ts mit Maßen und
// Mini-Platzhaltern (LQIP) für jedes Bild.
//
//   npm run images
//
// Neue Bilder: Datei nach images-src/ legen, unten in IMAGES eintragen, Skript
// ausführen. Die Komponenten referenzieren Bilder nur über ihre id.
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'images-src')
const OUT = path.join(ROOT, 'public/img')
const MANIFEST = path.join(ROOT, 'src/data/images.generated.ts')

const WIDTHS = [480, 800, 1200, 1600]

/**
 * id      – Name im Code
 * file    – Datei in images-src/
 * crop    – optionaler Ausschnitt (Pixel im Original), z. B. für Screenshots
 * focus   – CSS object-position, damit Gesichter nie angeschnitten werden
 * alt     – Alternativtext
 */
const IMAGES = [
  { id: 'simyan-portrait', file: 'simyan-portrait.jpg', focus: '50% 30%', alt: 'Simyan Chicho, Inhaber und Friseurmeister, vor dem beleuchteten AH-Logo im Salon' },
  { id: 'simyan-foehnen', file: 'simyan-foehnen.jpg', focus: '60% 35%', alt: 'Simyan Chicho föhnt und stylt einen Kunden im Salon' },
  { id: 'simyan-bart', file: 'simyan-bart.jpg', focus: '55% 25%', alt: 'Simyan Chicho bei einer präzisen Bartrasur' },
  { id: 'graziella', file: 'graziella.jpg', focus: '50% 30%', alt: 'Graziella, Top-Stylistin bei Art of Hair by Simyan' },
  { id: 'vanessa', file: 'vanessa.jpg', focus: '50% 35%', alt: 'Vanessa, Top-Stylistin, vor dem AH-Logo' },
  { id: 'chiara', file: 'team-screenshot-3.jpg', crop: { left: 153, top: 1001, width: 474, height: 648 }, focus: '50% 35%', alt: 'Chiara, Top-Stylistin, am Empfang des Salons' },
  { id: 'rosel', file: 'team-screenshot-2.jpg', crop: { left: 153, top: 93, width: 474, height: 672 }, focus: '55% 40%', alt: 'Rosel, Auszubildende im 3. Lehrjahr' },
  { id: 'sarkar', file: 'team-screenshot-2.jpg', crop: { left: 153, top: 972, width: 474, height: 648 }, focus: '50% 30%', alt: 'Sarkar, Auszubildender im 2. Lehrjahr' },
  { id: 'team-salon', file: 'team-salon.jpg', focus: '50% 40%', alt: 'Das Team von Art of Hair by Simyan im Salon vor dem Meisterbrief und dem AH-Logo' },
  { id: 'team-aussen', file: 'team-aussen.jpg', focus: '50% 55%', alt: 'Das Team vor dem Salon in der Lützenkirchener Straße' },
  { id: 'salon-aussen', file: 'salon-eroeffnung.jpg', focus: '50% 40%', alt: 'Außenansicht des Salons Art of Hair by Simyan in Leverkusen-Lützenkirchen' },
  { id: 'ah-wand', file: 'ah-wand.jpg', focus: '50% 30%', alt: 'Beleuchtetes AH-Logo auf der Natursteinwand, darunter Kevin.Murphy Stylingprodukte' },
  { id: 'logo-gold', file: 'hero-4-logo.jpg', focus: '50% 50%', alt: 'Art of Hair by Simyan – goldenes Logo' },
  { id: 'km-acryl', file: 'km-acryl.jpg', focus: '50% 40%', alt: 'Kevin.Murphy Pflegeprodukte im Salon-Display' },
  { id: 'km-regal', file: 'km-regal-screenshot.jpg', crop: { left: 4, top: 168, width: 982, height: 1382 }, focus: '40% 50%', alt: 'Kevin.Murphy Produktwand im Salon' },
  { id: 'balayage-blond', file: 'balayage-blond.jpg', focus: '50% 40%', alt: 'Blondes Balayage mit weichem Ansatz und Wellen' },
  { id: 'damen-locken-blond', file: 'damen-locken-blond.jpg', focus: '50% 40%', alt: 'Lange Locken mit goldblonden Strähnen' },
  { id: 'damen-straehnen-blond', file: 'damen-straehnen-blond.jpg', focus: '50% 40%', alt: 'Glattes langes Haar mit feinen blonden Strähnen' },
  { id: 'brunette-babylights', file: 'brunette-babylights.jpg', focus: '50% 40%', alt: 'Brünettes Haar mit feinen Babylights und Wellen' },
  { id: 'damen-bob', file: 'damen-bob.jpg', focus: '50% 40%', alt: 'Präzise geschnittener Bob in warmem Braun' },
  { id: 'braut-halfup', file: 'braut-halfup.jpg', focus: '50% 30%', alt: 'Brautfrisur: Half-up mit Locken und Perlen-Haarschmuck' },
  { id: 'herren-low-fade', file: 'herren-low-fade.jpg', focus: '45% 35%', alt: 'Herrenschnitt mit Low Fade und texturiertem Deckhaar' },
  { id: 'herren-mid-fade', file: 'herren-mid-fade.jpg', focus: '45% 35%', alt: 'Herrenschnitt mit Mid Fade und gepflegtem Bart' },
  { id: 'herren-taper', file: 'herren-taper.jpg', focus: '50% 35%', alt: 'Herrenschnitt mit Taper Fade, Volumen und Bartkontur' },
]

async function processOne(img) {
  let base = sharp(path.join(SRC, img.file)).rotate()
  if (img.crop) base = base.extract(img.crop)
  const buf = await base.toBuffer()
  const meta = await sharp(buf).metadata()
  const w0 = meta.width
  const h0 = meta.height
  // Kleine Quellen dürfen maximal 2x hochskaliert werden (Lanczos), damit
  // Porträts auf Retina-Displays nicht matschig wirken.
  const maxW = Math.min(1600, Math.round(w0 * (w0 < 700 ? 2 : 1.5)))
  const widths = [...new Set(WIDTHS.filter((w) => w < maxW).concat(maxW))].sort((a, b) => a - b)

  for (const w of widths) {
    const pipeline = () =>
      sharp(buf)
        .resize({ width: w, kernel: 'lanczos3' })
        .sharpen({ sigma: w > w0 ? 0.9 : 0.5, m1: 0.6, m2: 2 })
        .modulate({ saturation: 1.02 })
    await pipeline().avif({ quality: 58, effort: 5 }).toFile(path.join(OUT, `${img.id}-${w}.avif`))
    await pipeline().webp({ quality: 80, effort: 5 }).toFile(path.join(OUT, `${img.id}-${w}.webp`))
  }

  const lqip = await sharp(buf).resize({ width: 20 }).blur(1.2).webp({ quality: 40 }).toBuffer()
  return {
    id: img.id,
    alt: img.alt,
    focus: img.focus,
    width: w0,
    height: h0,
    widths,
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
  }
}

// ONLY=id1,id2 verarbeitet nur diese Bilder und übernimmt den Rest aus dem
// bestehenden Manifest (schneller, AVIF-Kodierung dauert lange).
const only = process.env.ONLY?.split(',').filter(Boolean)
const previous = new Map()
if (only) {
  const old = await fs.readFile(MANIFEST, 'utf8').catch(() => '')
  for (const m of old.matchAll(/^  '([\w-]+)': (\{.*\}),$/gm)) previous.set(m[1], JSON.parse(m[2]))
} else {
  await fs.rm(OUT, { recursive: true, force: true })
}
await fs.mkdir(OUT, { recursive: true })
const results = []
for (const img of IMAGES) {
  if (only && !only.includes(img.id) && previous.has(img.id)) {
    results.push({ ...previous.get(img.id), alt: img.alt, focus: img.focus })
    continue
  }
  results.push(await processOne(img))
  process.stdout.write('.')
}

const body = `// Automatisch erzeugt von scripts/images.mjs – nicht von Hand bearbeiten.
export interface ImageAsset {
  id: string
  alt: string
  focus: string
  width: number
  height: number
  widths: number[]
  lqip: string
}

export const images = {
${results.map((r) => `  '${r.id}': ${JSON.stringify(r)},`).join('\n')}
} satisfies Record<string, ImageAsset>

export type ImageId = keyof typeof images
`
await fs.writeFile(MANIFEST, body)
console.log(`\n${results.length} Bilder verarbeitet.`)
