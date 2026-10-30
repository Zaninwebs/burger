/**
 * Central image registry. Swap any `src` for a real Rialto photo later —
 * components only reference these keys.
 *
 * Only the hero pizza is a photo (from Rialto's printed menu, upscaled 4x).
 * Categories use the logo-style illustrations in components/FoodIcon.tsx;
 * the other menu photos were too low quality and were removed. Add new
 * professional shots here when available.
 */

export interface SiteImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const img = (file: string, alt: string, width: number, height: number): SiteImage => ({
  src: `/images/food/${file}.webp`,
  alt,
  width,
  height,
});

export const images = {
  pizzaHero: img("pizza-gemuese-oliven", "Pizza mit Oliven, Zwiebeln, Tomaten und Paprika auf einem Holzbrett", 1400, 1138),
} satisfies Record<string, SiteImage>;

/**
 * Category photos generated with Higgsfield (GPT Image) as serving suggestions.
 * Pizza reuses the hero photo from Rialto's printed menu.
 * A category without an entry falls back to its illustration.
 */
export const categoryPhotos: Partial<Record<string, SiteImage>> = {
  pizza: images.pizzaHero,
  doener: img("kategorie-doener", "Döner im Fladenbrot mit Fleisch, Salat, Tomate, Zwiebeln und heller Soße", 520, 520),
  burger: img("kategorie-burger", "Burger im Brioche-Bun mit Cheddar, Salat, Tomate und Gurken", 520, 520),
  pasta: img("kategorie-pasta", "Spaghetti Bolognese mit Parmesan und Basilikum", 520, 520),
  schnitzel: img("kategorie-schnitzel", "Paniertes Schnitzel mit Zitrone und Pommes", 520, 520),
};

export const brand = {
  badge: { src: "/images/brand/rialto-logo-badge.webp", alt: "Rialto Grill Pizzeria Logo", width: 640, height: 640 },
};
