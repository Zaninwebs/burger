// Reservation API — a single fetch-style handler used by the Netlify Function
// (netlify/functions/api.mts) and by the Vite dev server middleware.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  ACTIVE_STATUSES,
  STATUS_LABEL,
  addDays,
  berlinNow,
  checkRequestedTime,
  dayStateFromSlots,
  isIsoDate,
  sanitizeInput,
  slotsForDate,
  validateReservation,
  type Blocks,
  type DayState,
  type Reservation,
  type ReservationInput,
  type ReservationStatus,
  type Settings,
} from "../shared/reservations.ts";
import { fail, json } from "./http.ts";
import { adminOrders, orders } from "./orders.ts";
import { getSettings } from "./settings.ts";
import { store } from "./store.ts";

// ------------------------------------------------------------------ storage

async function getBlocks(): Promise<Blocks> {
  return (await store().get<Blocks>("blocks")) ?? {};
}

const resKey = (r: Pick<Reservation, "date" | "id">) => `r/${r.date}/${r.id}`;

async function reservationsWithPrefix(prefix: string): Promise<Reservation[]> {
  const keys = await store().list(`r/${prefix}`);
  const docs = await Promise.all(keys.map((k) => store().get<Reservation>(k)));
  return docs.filter((d): d is Reservation => d !== null);
}

// --------------------------------------------------------------------- auth

const SESSION_HOURS = 12;

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function issueToken(): string {
  const exp = String(Date.now() + SESSION_HOURS * 3600_000);
  return `${exp}.${sign(exp)}`;
}

function isAuthorized(req: Request): boolean {
  if (!secret()) return false;
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}

// ------------------------------------------------------------ notifications

async function notifyOwner(r: Reservation): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;
  const from = process.env.MAIL_FROM || "Casa Ducale Reservierung <onboarding@resend.dev>";
  const [y, m, d] = r.date.split("-");
  const lines = [
    `Neue Reservierungsanfrage (${STATUS_LABEL[r.status]})`,
    "",
    `Datum:     ${d}.${m}.${y}`,
    `Uhrzeit:   ${r.time} Uhr`,
    `Personen:  ${r.guests}`,
    `Name:      ${r.name}`,
    `Telefon:   ${r.phone}`,
    `E-Mail:    ${r.email}`,
    r.occasion ? `Anlass:    ${r.occasion}` : "",
    r.message ? `\nNachricht:\n${r.message}` : "",
    "",
    "Bitte im Admin-Bereich bestätigen oder ablehnen.",
  ].filter((l) => l !== "");
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: r.email,
        subject: `Reservierung ${d}.${m}. · ${r.time} Uhr · ${r.guests} Pers. · ${r.name}`,
        text: lines.join("\n"),
      }),
    });
  } catch (err) {
    // The request is already stored; a failed mail must not fail the booking.
    console.error("notifyOwner failed", err);
  }
}

/** Tells the guest about a confirmation or decline (only if mail is configured). */
async function notifyGuest(r: Reservation): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from || (r.status !== "confirmed" && r.status !== "declined")) return false;
  const [y, m, d] = r.date.split("-");
  const when = `${d}.${m}.${y} um ${r.time} Uhr für ${r.guests} ${r.guests === 1 ? "Person" : "Personen"}`;
  const phone = process.env.RESTAURANT_PHONE || "0214 43444";
  const text =
    r.status === "confirmed"
      ? `Guten Tag ${r.name},\n\nwir freuen uns: Ihre Reservierung am ${when} ist bestätigt.\n\nFalls Sie verhindert sind, sagen Sie bitte kurz unter ${phone} ab.\n\nA presto!\nCasa Ducale – Cucina Italiana\nWiesdorfer Platz, Leverkusen`
      : `Guten Tag ${r.name},\n\nleider können wir Ihre Anfrage für den ${when} nicht bestätigen. Gerne finden wir telefonisch unter ${phone} eine Alternative.\n\nHerzliche Grüße\nCasa Ducale – Cucina Italiana`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [r.email],
        subject: r.status === "confirmed" ? "Ihre Reservierung bei Casa Ducale ist bestätigt" : "Ihre Reservierungsanfrage bei Casa Ducale",
        text,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("notifyGuest failed", err);
    return false;
  }
}

// ---------------------------------------------------------------- handlers

async function availability(url: URL): Promise<Response> {
  const settings = await getSettings();
  const blocks = await getBlocks();
  const now = berlinNow();
  const meta = {
    maxPartySize: settings.maxPartySize,
    bookingHorizonDays: settings.bookingHorizonDays,
    today: now.date,
  };

  const date = url.searchParams.get("date");
  if (date) {
    if (!isIsoDate(date)) return fail(400, "bad_date", "Ungültiges Datum.");
    const slots = slotsForDate(date, settings, blocks, await reservationsWithPrefix(date), now);
    // Remaining seats are not exposed publicly, only the state.
    return json({ ...meta, date, state: dayStateFromSlots(slots), slots: slots.map(({ time, state }) => ({ time, state })) });
  }

  const month = url.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return fail(400, "bad_month", "Ungültiger Monat.");
  const all = await reservationsWithPrefix(month);
  const byDate = new Map<string, Reservation[]>();
  for (const r of all) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);

  const days: Record<string, DayState> = {};
  for (let d = `${month}-01`; d.startsWith(month); d = addDays(d, 1)) {
    days[d] = dayStateFromSlots(slotsForDate(d, settings, blocks, byDate.get(d) ?? [], now));
  }
  return json({ ...meta, month, days });
}

async function createReservation(req: Request): Promise<Response> {
  let body: ReservationInput;
  try {
    body = (await req.json()) as ReservationInput;
  } catch {
    return fail(400, "bad_json", "Die Anfrage konnte nicht gelesen werden.");
  }
  // Honeypot: bots fill the hidden "website" field. Pretend success.
  if (body.website) return json({ id: "ok", status: "pending" }, 201);

  const input = sanitizeInput(body);
  const settings = await getSettings();
  const errors = validateReservation(input, settings);
  if (Object.keys(errors).length) return fail(422, "invalid", "Bitte prüfen Sie Ihre Angaben.", { fields: errors });

  const existing = await reservationsWithPrefix(input.date);
  const problem = checkRequestedTime(input.date, input.time, input.guests, settings, await getBlocks(), existing);
  if (problem === "closed")
    return fail(409, "slot_unavailable", "An diesem Tag ist leider keine Online-Reservierung möglich. Bitte rufen Sie uns an.");
  if (problem === "outside_hours")
    return fail(409, "slot_unavailable", `Bitte wählen Sie eine Uhrzeit zwischen ${settings.openFrom} und ${settings.openUntil} Uhr.`);
  if (problem === "too_soon")
    return fail(409, "slot_unavailable", "Für so kurzfristige Reservierungen rufen Sie uns bitte direkt an.");
  if (problem === "slot_full")
    return fail(409, "slot_full", "Zu dieser Uhrzeit ist leider kein Tisch mehr frei. Bitte wählen Sie eine andere Uhrzeit.");

  const duplicate = existing.some(
    (r) => ACTIVE_STATUSES.includes(r.status) && r.email === input.email && r.time === input.time,
  );
  if (duplicate)
    return fail(409, "duplicate", "Für diese E-Mail-Adresse liegt zu dieser Uhrzeit bereits eine Anfrage vor.");

  const now = new Date().toISOString();
  const reservation: Reservation = {
    id: `${input.date.replaceAll("-", "")}-${randomBytes(6).toString("hex")}`,
    date: input.date,
    time: input.time,
    guests: input.guests,
    name: input.name,
    phone: input.phone,
    email: input.email,
    message: input.message,
    occasion: input.occasion,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  await store().set(resKey(reservation), reservation);
  await notifyOwner(reservation);
  return json({ id: reservation.id, status: reservation.status }, 201);
}

function dateFromId(id: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})-[a-f0-9]{12}$/.exec(id);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Löschkonzept: remove reservations whose date lies beyond the retention period. */
async function purgeExpired(settings: Settings): Promise<number> {
  const cutoff = addDays(berlinNow().date, -settings.retentionDays);
  const keys = await store().list("r/");
  const expired = keys.filter((k) => k.slice(2, 12) < cutoff);
  await Promise.all(expired.map((k) => store().delete(k)));
  return expired.length;
}

async function admin(req: Request, url: URL, parts: string[]): Promise<Response> {
  const [resource, id] = parts;

  if (resource === "login" && req.method === "POST") {
    const { password } = ((await req.json().catch(() => ({}))) ?? {}) as { password?: string };
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) return fail(503, "not_configured", "Der Admin-Zugang ist noch nicht eingerichtet (ADMIN_PASSWORD).");
    if (!password || !safeEqual(password, expected)) {
      await new Promise((r) => setTimeout(r, 800));
      return fail(401, "unauthorized", "Das Passwort ist nicht korrekt.");
    }
    return json({ token: issueToken(), expiresInHours: SESSION_HOURS });
  }

  if (!isAuthorized(req)) return fail(401, "unauthorized", "Bitte melden Sie sich erneut an.");

  if (resource === "reservations" && req.method === "GET" && !id) {
    const settings = await getSettings();
    const purged = await purgeExpired(settings);
    const from = url.searchParams.get("from") ?? berlinNow().date;
    const to = url.searchParams.get("to") ?? addDays(from, 60);
    if (!isIsoDate(from) || !isIsoDate(to)) return fail(400, "bad_range", "Ungültiger Zeitraum.");
    const all = await reservationsWithPrefix("");
    const list = all
      .filter((r) => r.date >= from && r.date <= to)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return json({ reservations: list, purged });
  }

  if (resource === "reservations" && id) {
    const date = dateFromId(id);
    if (!date) return fail(400, "bad_id", "Ungültige Reservierung.");
    const key = `r/${date}/${id}`;
    const current = await store().get<Reservation>(key);
    if (!current) return fail(404, "not_found", "Reservierung nicht gefunden.");

    if (req.method === "PATCH") {
      const { status } = (await req.json().catch(() => ({}))) as { status?: ReservationStatus };
      if (!status || !(status in STATUS_LABEL)) return fail(400, "bad_status", "Ungültiger Status.");
      const updated = { ...current, status, updatedAt: new Date().toISOString() };
      await store().set(key, updated);
      const guestNotified = status !== current.status ? await notifyGuest(updated) : false;
      return json({ reservation: updated, guestNotified });
    }
    if (req.method === "DELETE") {
      await store().delete(key);
      return json({ deleted: id });
    }
  }

  if (resource === "orders") return adminOrders(req, url, id);

  if (resource === "settings") {
    if (req.method === "GET") return json({ settings: await getSettings() });
    if (req.method === "PUT") {
      const next = (await req.json().catch(() => null)) as Settings | null;
      const problem = checkSettings(next);
      if (problem) return fail(400, "bad_settings", problem);
      await store().set("settings", next);
      return json({ settings: next });
    }
  }

  if (resource === "day" && req.method === "GET") {
    const date = url.searchParams.get("date") ?? "";
    if (!isIsoDate(date)) return fail(400, "bad_date", "Ungültiges Datum.");
    const settings = await getSettings();
    const blocks = await getBlocks();
    const reservations = await reservationsWithPrefix(date);
    const weekday = settings.weekdays[String(new Date(`${date}T12:00:00Z`).getUTCDay())];
    const booked = new Map<string, number>();
    for (const r of reservations)
      if (ACTIVE_STATUSES.includes(r.status)) booked.set(r.time, (booked.get(r.time) ?? 0) + r.guests);
    return json({
      date,
      open: weekday.open,
      dayBlocked: (blocks[date] ?? []).includes("*"),
      capacity: settings.capacityPerSlot,
      slots: weekday.slots.map((time) => ({
        time,
        booked: booked.get(time) ?? 0,
        blocked: (blocks[date] ?? []).includes(time),
      })),
    });
  }

  if (resource === "blocks" && req.method === "PUT") {
    const { date, times } = ((await req.json().catch(() => ({}))) ?? {}) as { date?: string; times?: string[] };
    if (!date || !isIsoDate(date) || !Array.isArray(times) || !times.every((t) => t === "*" || /^\d{2}:\d{2}$/.test(t)))
      return fail(400, "bad_block", "Ungültige Sperre.");
    const blocks = await getBlocks();
    if (times.length) blocks[date] = [...new Set(times)];
    else delete blocks[date];
    // drop blocks in the past
    const today = berlinNow().date;
    for (const d of Object.keys(blocks)) if (d < today) delete blocks[d];
    await store().set("blocks", blocks);
    return json({ date, times: blocks[date] ?? [] });
  }

  return fail(404, "not_found", "Unbekannte Aktion.");
}

function checkSettings(s: Settings | null): string | null {
  if (!s || typeof s !== "object") return "Ungültige Einstellungen.";
  const int = (n: unknown, min: number, max: number) => Number.isInteger(n) && (n as number) >= min && (n as number) <= max;
  if (!int(s.capacityPerSlot, 1, 500)) return "Plätze pro Zeitfenster: 1–500.";
  if (!int(s.maxPartySize, 1, 60)) return "Max. Personen online: 1–60.";
  if (!int(s.bookingHorizonDays, 1, 365)) return "Buchungszeitraum: 1–365 Tage.";
  if (!int(s.leadTimeMinutes, 0, 2880)) return "Vorlaufzeit: 0–2880 Minuten.";
  if (!int(s.retentionDays, 1, 365)) return "Aufbewahrung: 1–365 Tage.";
  const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!hhmm.test(s.openFrom ?? "") || !hhmm.test(s.openUntil ?? "") || s.openFrom >= s.openUntil)
    return "Reservierungszeiten: „von“ muss vor „bis“ liegen.";
  if (typeof s.ordersEnabled !== "boolean") return "Bestellungen: an/aus fehlt.";
  if (!hhmm.test(s.pickupFrom ?? "") || !hhmm.test(s.pickupUntil ?? "") || s.pickupFrom >= s.pickupUntil)
    return "Abholzeiten: „von“ muss vor „bis“ liegen.";
  if (!int(s.pickupLeadMinutes, 0, 240)) return "Zubereitungszeit: 0–240 Minuten.";
  for (let d = 0; d < 7; d++) {
    const day = s.weekdays?.[String(d)];
    if (!day || typeof day.open !== "boolean" || !Array.isArray(day.slots)) return "Wochentage unvollständig.";
    if (!day.slots.every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) return "Ungültige Uhrzeit in den Zeitfenstern.";
  }
  return null;
}

export async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  try {
    if (parts[0] === "availability" && req.method === "GET") return await availability(url);
    if (parts[0] === "reservations" && req.method === "POST" && parts.length === 1) return await createReservation(req);
    if (parts[0] === "orders") return await orders(req, parts.slice(1));
    if (parts[0] === "admin") return await admin(req, url, parts.slice(1));
    return fail(404, "not_found", "Nicht gefunden.");
  } catch (err) {
    console.error(err);
    return fail(500, "server_error", "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut oder rufen Sie uns an.");
  }
}
