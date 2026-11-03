import type { ImageId } from './images.generated'

// Alle Geschäftsdaten stammen von der bisherigen Website
// art-of-hair-by-simyan.de bzw. aus den vom Inhaber bereitgestellten Fotos.
// Bitte hier nichts erfinden (Preise, Personen, Auszeichnungen, Bewertungen).

export const business = {
  name: 'Art of Hair by Simyan',
  owner: 'Simyan Chicho',
  street: 'Lützenkirchener Str. 411',
  zip: '51381',
  city: 'Leverkusen',
  district: 'Lützenkirchen',
  phoneDisplay: '02171 83045',
  phoneHref: 'tel:+49217183045',
  email: 'artofhair.bysimyan@gmail.com',
  instagram: 'artofhair_bysimyan',
  instagramUrl: 'https://www.instagram.com/artofhair_bysimyan/',
  /** Öffnet die Routenplanung zum Salon (auf dem Handy direkt in der Google-Maps-App) */
  routeUrl:
    'https://www.google.com/maps/dir/?api=1&destination=Art+of+Hair+by+Simyan%2C+L%C3%BCtzenkirchener+Str.+411%2C+51381+Leverkusen',
  mapsEmbedUrl:
    'https://maps.google.com/maps?q=L%C3%BCtzenkirchener+Str.+411%2C+51381+Leverkusen&z=16&output=embed',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Art+of+Hair+by+Simyan+L%C3%BCtzenkirchener+Str.+411+51381+Leverkusen',
}

export const hours = [
  { day: 'Montag', short: 'Mo', value: 'Geschlossen', weekday: 1 },
  { day: 'Dienstag', short: 'Di', value: '09:00 – 18:00', weekday: 2 },
  { day: 'Mittwoch', short: 'Mi', value: '09:00 – 18:00', weekday: 3 },
  { day: 'Donnerstag', short: 'Do', value: '09:00 – 18:00', weekday: 4 },
  { day: 'Freitag', short: 'Fr', value: '09:00 – 18:00', weekday: 5 },
  { day: 'Samstag', short: 'Sa', value: '09:00 – 14:00', weekday: 6 },
  { day: 'Sonntag', short: 'So', value: 'Geschlossen', weekday: 0 },
]

export const nav = [
  { id: 'salon', label: 'Salon' },
  { id: 'leistungen', label: 'Leistungen' },
  { id: 'preise', label: 'Preise' },
  { id: 'team', label: 'Team' },
  { id: 'galerie', label: 'Galerie' },
  { id: 'termin', label: 'Termin' },
]

export interface Service {
  title: string
  detail: string
  from: string
  /** Ohne Bild wird nur der Text gezeigt */
  image?: ImageId
}

export const services: Service[] = [
  { title: 'Damen', detail: 'Schnitt mit Beratung & Styling, Cut & Go', from: 'ab 36 €', image: 'damen-bob' },
  { title: 'Herren', detail: 'Klassisch, Fade, Taper – präzise Konturen', from: 'ab 27 €', image: 'herren-taper' },
  { title: 'Bart', detail: 'Bartrasur und Bartfärben', from: 'ab 17 €', image: 'herren-mid-fade' },
  { title: 'Coloration', detail: 'Ansatzfärbung, Farbe & Tönung', from: 'ab 43 €', image: 'brunette-babylights' },
  { title: 'Balayage & Strähnen', detail: 'Moderne Farbtechniken, Ombré, Foliensträhnen', from: 'ab 60 €', image: 'balayage-blond' },
  { title: 'Styling & Braut', detail: 'Föhnen, Hochsteckfrisuren, Brautstyling', from: 'ab 25 €', image: 'braut-halfup' },
  { title: 'Kinder', detail: 'Haarschnitt bis 12 Jahre', from: '18 €' },
]

export interface PriceRow {
  name: string
  note?: string
  prices: { label?: string; value: string }[]
}

export interface PriceCategory {
  id: string
  title: string
  intro?: string
  rows: PriceRow[]
}

export const priceCategories: PriceCategory[] = [
  {
    id: 'damen',
    title: 'Damen',
    rows: [
      {
        name: 'Haarschnitt',
        note: 'inkl. Beratung und Styling',
        prices: [
          { label: 'Kurz', value: '43 €' },
          { label: 'Mittel', value: '53 €' },
          { label: 'Lang', value: '63 €' },
        ],
      },
      {
        name: 'Cut & Go',
        prices: [
          { label: 'Kurz', value: '36 €' },
          { label: 'Mittel', value: '38 €' },
          { label: 'Lang', value: '40 €' },
        ],
      },
    ],
  },
  {
    id: 'herren',
    title: 'Herren',
    rows: [
      {
        name: 'Haarschnitt',
        prices: [
          { label: 'Kurz', value: '27 €' },
          { label: 'Mittel / Lang', value: '30 €' },
        ],
      },
      { name: 'Haare färben', prices: [{ value: '30 €' }] },
    ],
  },
  {
    id: 'bart',
    title: 'Bart',
    rows: [
      { name: 'Bartrasur', prices: [{ value: '17 €' }] },
      { name: 'Bart färben', prices: [{ value: '20 €' }] },
    ],
  },
  {
    id: 'farbe',
    title: 'Farbe',
    intro: 'Farbe & Tönung, Strähnen und moderne Farbtechniken.',
    rows: [
      {
        name: 'Ansatzfärbung',
        prices: [
          { label: 'Kurz', value: '43 €' },
          { label: 'Mittel', value: '46 €' },
          { label: 'Lang', value: '48 €' },
        ],
      },
      {
        name: 'Strähnen',
        note: 'pro Folie 4,50 €',
        prices: [
          { label: 'Kurz', value: '60 €' },
          { label: 'Mittel', value: '75 €' },
          { label: 'Lang', value: '100 €' },
        ],
      },
      { name: 'Balayage', prices: [{ value: 'ab 100 €' }] },
      { name: 'Ombré', prices: [{ value: 'ab 80 €' }] },
    ],
  },
  {
    id: 'styling',
    title: 'Styling',
    rows: [
      {
        name: 'Föhnen / Styling',
        prices: [
          { label: 'Kurz', value: '25 €' },
          { label: 'Mittel', value: '30 €' },
          { label: 'Lang', value: '34 €' },
        ],
      },
      {
        name: 'Hochsteckfrisur',
        prices: [
          { label: 'Einfach', value: 'ab 39 €' },
          { label: 'Mittel', value: 'ab 45 €' },
        ],
      },
      { name: 'Brautfrisur', prices: [{ value: 'ab 100 €' }] },
      { name: 'Brautfrisur inkl. Probetermin', prices: [{ value: 'ab 170 €' }] },
    ],
  },
  {
    id: 'kinder',
    title: 'Kinder',
    intro: 'Bis 12 Jahre.',
    rows: [{ name: 'Haarschnitt', note: 'kurz, mittel oder lang', prices: [{ value: '18 €' }] }],
  },
]

export interface TeamMember {
  name: string
  role: string
  image: ImageId
}

export const owner: TeamMember = {
  name: 'Simyan Chicho',
  role: 'Inhaber, Friseurmeister & Top-Stylist',
  image: 'simyan-portrait',
}

export const team: TeamMember[] = [
  { name: 'Graziella', role: 'Top-Stylistin', image: 'graziella' },
  { name: 'Vanessa', role: 'Top-Stylistin', image: 'vanessa' },
  { name: 'Chiara', role: 'Top-Stylistin', image: 'chiara' },
  { name: 'Rosel', role: 'Auszubildende, 3. Lehrjahr', image: 'rosel' },
  { name: 'Sarkar', role: 'Auszubildender, 2. Lehrjahr', image: 'sarkar' },
]

export const colorWorks: { image: ImageId; title: string; caption: string }[] = [
  { image: 'balayage-blond', title: 'Balayage', caption: 'Weicher Ansatz, lichtvolle Längen' },
  { image: 'damen-locken-blond', title: 'Strähnen', caption: 'Goldene Reflexe, fließende Locken' },
  { image: 'brunette-babylights', title: 'Babylights', caption: 'Feine Lichter auf Brünett' },
  { image: 'damen-straehnen-blond', title: 'Highlights', caption: 'Präzise Folientechnik' },
  { image: 'damen-bob', title: 'Coloration', caption: 'Satter, glänzender Farbton' },
]

export const gallery: ImageId[] = [
  'herren-taper',
  'balayage-blond',
  'braut-halfup',
  'herren-mid-fade',
  'damen-locken-blond',
  'damen-bob',
  'herren-low-fade',
  'brunette-babylights',
  'damen-straehnen-blond',
]
