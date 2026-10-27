// Single source of truth for every business fact shown on the site.
//
// RULE: nothing in here may be invented. Every value is taken from a public
// listing of Casa Ducale (see SOURCES) or marked as TODO/unconfirmed. Before
// launch the owner must confirm every entry marked `// ⚠︎ BESTÄTIGEN`.

export const SOURCES = [
  "https://casa-ducale-leverkusen.eatbu.com/?lang=de (offizielle Website — in der Build-Umgebung nicht abrufbar)",
  "Google Maps: https://maps.app.goo.gl/WxpsURLGyBKVngBw6",
  "Das Örtliche / Gelbe Seiten / gastroguide.de / tripadvisor / quandoo / ubereats (Einträge Casa Ducale, Wiesdorfer Platz 30)",
];

export const business = {
  name: "Casa Ducale",
  tagline: "Cucina Italiana",
  street: "Wiesdorfer Platz 30a", // ⚠︎ BESTÄTIGEN — Quellen nennen „30“ und „30a“
  postalCode: "51373",
  city: "Leverkusen",
  district: "Wiesdorf",
  venue: "in den Luminaden",
  phoneDisplay: "0214 43444",
  phoneHref: "tel:+4921443444",
  email: null as string | null, // ⚠︎ E-Mail-Adresse vom Inhaber eintragen, z. B. "info@casa-ducale-leverkusen.de"
  /** WhatsApp number in international format without "+" or spaces, e.g. "4917012345678" */
  whatsapp: null as string | null, // ⚠︎ WhatsApp-Nummer vom Inhaber eintragen
  instagram: null as { handle: string; url: string } | null, // ⚠︎ offizieller Account? Dann hier eintragen
  mapsUrl: "https://maps.app.goo.gl/WxpsURLGyBKVngBw6",
  siteUrl: "https://casa-ducale-leverkusen.de", // ⚠︎ BESTÄTIGEN — finale Domain
};

export const fullAddress = `${business.street}, ${business.postalCode} ${business.city}`;

/**
 * Opening hours. ⚠︎ KONFLIKT in den Quellen:
 *  - Mehrheit (Das Örtliche, gastroguide, tripadvisor): Mo–Sa 08:30–22:00, So geschlossen
 *  - Ein Eintrag: So 09:30–22:00
 * Sunday is therefore shown as "on request" until the owner confirms it.
 */
export const hours: { days: string; short: string; time: string | null; note?: string; weekdays: number[] }[] = [
  { days: "Montag – Samstag", short: "Mo – Sa", time: "08:30 – 22:00", weekdays: [1, 2, 3, 4, 5, 6] },
  { days: "Sonntag", short: "So", time: null, note: "Bitte telefonisch erfragen", weekdays: [0] },
];

/** Facts about the house, phrased from the public listings. */
export const story = {
  lead: "Italienisches Lebensgefühl und herzliche Gastfreundschaft — mitten in Leverkusen-Wiesdorf.",
  body: [
    "Casa Ducale ist Café und Ristorante zugleich: vom Frühstück am Morgen über den Mittagstisch bis zum Abendessen.",
    "Pizza und Pasta entstehen nach original italienischen Rezepten. Dazu maritime Spezialitäten, Fleisch, Salate und Desserts.",
  ],
  facts: [
    { value: "08:30", label: "Frühstück ab", sub: "Montag bis Samstag" },
    { value: "60", label: "Gäste", sub: "für private Feiern" },
    { value: "Wiesdorf", label: "Leverkusen", sub: "mitten in der City" },
  ],
};

export const events = {
  title: "Feiern bei Casa Ducale",
  lead: "Private Feiern mit bis zu 60 Gästen — und Catering, individuell und flexibel nach Ihren Wünschen.",
  occasions: ["Geburtstage", "Firmenfeiern", "Hochzeiten", "Kommunionen", "Besondere Anlässe"],
};

export const nav = [
  { href: "#restaurant", label: "Restaurant" },
  { href: "#kueche", label: "Küche" },
  { href: "#speisekarte", label: "Speisekarte" },
  { href: "#abholen", label: "Abholen" },
  { href: "#feiern", label: "Feiern" },
  { href: "#galerie", label: "Galerie" },
  { href: "#besuch", label: "Kontakt" },
];
