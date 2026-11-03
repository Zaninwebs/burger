# Art of Hair by Simyan — Website

Premium-Website mit Terminanfrage-System für den Friseurmeister-Salon
**Art of Hair by Simyan**, Lützenkirchener Str. 411, 51381 Leverkusen.

## Stack

- React 19 + TypeScript, Vite (Multi-Page: `/`, `/impressum/`, `/datenschutz/`, `/admin/`)
- GSAP + ScrollTrigger (Motion-System), Lenis (Smooth Scroll, nur Desktop)
- Schriften selbst gehostet (Cormorant Garamond, Manrope) – keine Google-Verbindung
- Backend: Netlify Functions + Netlify Blobs (persistente Datenbank)

## Entwicklung

```bash
npm install
npm run dev       # http://localhost:5173 – inkl. lokaler Termin-API (Daten in .data/)
npm run build     # Typprüfung + Produktions-Build
npm run images    # Bilder aus images-src/ neu verarbeiten (AVIF/WebP)
```

Lokal lautet das Admin-Passwort `admin` (nur Entwicklung).

## Deployment (Netlify)

Umgebungsvariablen im Netlify-Dashboard setzen:

| Variable | Pflicht | Zweck |
|---|---|---|
| `ADMIN_PASSWORD` | ja | Passwort für `/admin/` (mind. 10 Zeichen) |
| `DATA_ENCRYPTION_KEY` | ja | Zufälliger Schlüssel (≥ 32 Zeichen), verschlüsselt Kundendaten. **Nie ändern oder verlieren** – sonst sind gespeicherte Anfragen unlesbar. |
| `RESEND_API_KEY` | nein | E-Mail-Benachrichtigung bei neuen Anfragen (resend.com) |
| `NOTIFY_EMAIL_TO` / `NOTIFY_EMAIL_FROM` | nein | Empfänger / verifizierter Absender |
| `NOTIFY_INCLUDE_CONTACT` | nein | `true` = Kontaktdaten in der Mail (Standard: nein, Datenminimierung) |
| `RETENTION_DAYS` | nein | Löschfrist nach Termin (Standard 30) |

Schlüssel erzeugen: `openssl rand -base64 48`

## Terminsystem

- Kunden stellen eine **unverbindliche Anfrage** (Leistung → Tag → optional Uhrzeit → Kontakt).
- Kalender zeigt pro Tag: verfügbar / teilweise / ausgebucht / geschlossen.
  Mo + So, NRW-Feiertage und vergangene Tage sind automatisch geschlossen.
- Zeitfenster: Di–Fr 09–17 Uhr, Sa 09–13 Uhr (stündlich, `shared/booking.ts`).
- Doppelbuchungen werden atomar verhindert (`onlyIfNew`-Sperre pro Zeitfenster).
- `/admin/`: Anfragen bestätigen/ablehnen/erledigen, Notizen, löschen;
  Tage manuell setzen, einzelne Zeitfenster blockieren, öffentliche Hinweise.
- DSGVO: Kontaktdaten AES-256-GCM verschlüsselt, IP nur als Hash (24 h),
  tägliche automatische Löschung (`netlify/functions/cleanup.mts`), keine Cookies/Tracking.

## Inhalte & Bilder

- Alle Geschäftsdaten: `src/data/content.ts` (Preise, Team, Leistungen). Nichts erfinden.
- Neue Bilder: Datei nach `images-src/` legen, in `scripts/images.mjs` eintragen
  (inkl. `focus` für den Bildausschnitt), `npm run images`, dann per `<Img id="…" />` nutzen.
- Das AH-Monogramm ist aus dem Original-Logo vektorisiert (`src/data/monogram.ts`).

## Offene Punkte

- Impressum/Datenschutz: gelb markierte Platzhalter mit den bisherigen Texten abgleichen.
