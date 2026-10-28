# Rialto Grill & Pizzeria — Website

Website für **Rialto Grill & Pizzeria**, Hauptstraße 19, 42799 Leichlingen-Witzhelden.
Designrichtung „Laguna“: Farben und Motive stammen aus dem Logo — Verlauf von warmem
Taupe zu Schiefer, Himmel-Creme, Terrakotta, Lagunenblau, Lorbeer und animierte Wellen.

## Stack

- React 19 + TypeScript, Vite (Multi-Page: `/`, `/speisekarte/`, `/impressum/`, `/datenschutz/`)
- **Prerendering:** `npm run build` rendert Startseite und Speisekarte serverseitig vor
  (`src/entry-server.tsx` + `scripts/prerender.mjs`). Speisekarte, Preise und Adresse stehen
  damit ohne JavaScript im HTML, gut für SEO und schnell beim ersten Laden.
- Animationen ausschließlich mit CSS + einem gemeinsamen IntersectionObserver (`src/hooks/useReveal.ts`).
  Keine Animationsbibliothek nötig, `prefers-reduced-motion` wird überall respektiert.
- Schriften (Fraunces, Hanken Grotesk) liegen **selbst gehostet** via `@fontsource-variable`.
  Es gibt keine Verbindung zu Google Fonts (DSGVO).
- Keine Cookies, kein Tracking. Google Maps lädt erst nach Klick (2-Klick-Lösung).

```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Typecheck + Build + Prerender
npm run lint     # oxlint
npm run preview  # Produktions-Build lokal ansehen
```

## Wo was gepflegt wird

| Inhalt | Datei |
| --- | --- |
| Name, Telefon, Adresse, Links, Online-Bestellung, Öffnungszeiten | `src/data/site.ts` |
| Speisekarte (1:1 aus der gedruckten Karte) | `src/data/menu.ts` |
| Hero-Foto + Logo | `src/data/images.ts` + `public/images/` |
| Kategorie-Illustrationen (Logo-Stil) | `src/components/FoodIcon.tsx` |
| Startseite / Speisekarte | `src/App.tsx` / `src/MenuApp.tsx` (`/speisekarte/`) |
| Bewertungen + Google-Rating | `src/data/reviews.ts` |
| SEO-Meta, JSON-LD | `index.html` |
| Impressum / Datenschutz | `impressum/index.html`, `datenschutz/index.html` |

Wenn sich Öffnungszeiten, Telefonnummer oder Adresse ändern, bitte auch das JSON-LD in `index.html`
anpassen. Name, Adresse und Telefon (NAP) müssen überall identisch sein, auch im Google-Unternehmensprofil.

## Vor dem Launch bestätigen

Diese Punkte konnten nicht sicher verifiziert werden und müssen vom Betreiber bestätigt werden:

1. **Öffnungszeiten.** Übernommen aus dem bisherigen Impressum („Täglich 11.00–22.00 Uhr“).
   Einige Verzeichnisse nennen Dienstag als Ruhetag. → `src/data/site.ts` + JSON-LD in `index.html`.
2. **Online-Bestellung.** Der Lieferando-Link (`site.onlineOrder`) muss aktiv sein.
   Falls nicht, auf `null` setzen. Dann verschwinden alle „Online bestellen“-Buttons automatisch.
3. **Impressum.** Inhaber laut bisherigem Impressum: Sakine Polat. Lieferando nennt Kazim Celik
   als vertretungsberechtigt. Bitte klären und ggf. USt-IdNr. ergänzen.
4. **Datenschutzerklärung.** Beschreibt das tatsächliche Verhalten der Seite.
   Hosting-Anbieter ergänzen und rechtlich prüfen lassen.
5. **Bewertungen.** `src/data/reviews.ts` ist bewusst leer. Nur echte Bewertungen wortgetreu
   (Name, Sterne, Datum, Quelle) eintragen, optional das aktuelle Google-Rating.
   Für einen direkten „Bewertung schreiben“-Link wird die Google Place-ID benötigt.
6. **Allergene/Zusatzstoffe.** Die Kennzeichnungen der gedruckten Karte (A, C, G, 1, 4 …) wurden nicht
   übernommen, weil die Legende fehlte. Mit Legende können sie in `menu.ts` ergänzt werden.
7. **Fotos.** Nur das Hero-Pizzafoto stammt aus der gedruckten Speisekarte (4x hochskaliert);
   die übrigen Fotos waren zu schlecht und wurden durch Illustrationen ersetzt. Nutzungsrechte
   des Pizzafotos bitte bestätigen. Für echte Food-Fotos: professionelles Shooting.
8. **Social Media.** Nur echte Profile in `site.social` eintragen.

## Google-Unternehmensprofil (Empfehlungen)

- Öffnungszeiten, Website-URL und Telefonnummer identisch zur Website pflegen.
- Speisekarten-Link auf `https://www.rialto-pizzeria.com/speisekarte/` setzen.
- Aktuelle Fotos hochladen und auf Bewertungen antworten.
