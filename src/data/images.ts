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

export const brand = {
  badge: { src: "/images/brand/rialto-logo-badge.webp", alt: "Rialto Grill Pizzeria Logo", width: 640, height: 640 },
};
