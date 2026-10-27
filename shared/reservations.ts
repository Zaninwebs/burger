// Reservation domain logic shared by the browser and the serverless API.
// Everything here is pure: no storage, no network, no DOM.

export type ReservationStatus = "pending" | "confirmed" | "declined" | "completed";
export type DayState = "available" | "limited" | "full" | "closed";
export type SlotState = "available" | "limited" | "full" | "blocked";

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Offen",
  confirmed: "Bestätigt",
  declined: "Abgelehnt",
  completed: "Abgeschlossen",
};

/** Statuses that occupy seats. */
export const ACTIVE_STATUSES: ReservationStatus[] = ["pending", "confirmed"];

export type Reservation = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  guests: number;
  name: string;
  phone: string;
  email: string;
  message: string;
  occasion: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReservationInput = Pick<
  Reservation,
  "date" | "time" | "guests" | "name" | "phone" | "email" | "message" | "occasion"
> & { consent: boolean; website?: string };

/**
 * Operator-editable settings (stored server-side, changed in /admin).
 * weekdays: 0 = Sunday … 6 = Saturday.
 */
export type Settings = {
  weekdays: Record<string, { open: boolean; slots: string[] }>;
  /** max. guests that can be booked per time slot */
  capacityPerSlot: number;
  /** largest party that can request online; bigger groups are asked to call */
  maxPartySize: number;
  /** how far ahead guests can book */
  bookingHorizonDays: number;
  /** minimum lead time before a slot, in minutes */
  leadTimeMinutes: number;
  /** reservations are deleted this many days after the reserved date */
  retentionDays: number;
  /** guests may request any time in this window; the owner confirms */
  openFrom: string;
  openUntil: string;
  /** pickup orders ("Bestellen & Abholen") can be paused by the owner */
  ordersEnabled: boolean;
  /** pickup window and the minimum preparation time for new orders */
  pickupFrom: string;
  pickupUntil: string;
  pickupLeadMinutes: number;
};

export type Blocks = {
  /** date → blocked slot times, or ["*"] for the whole day */
  [date: string]: string[];
};

export function makeSlots(from: string, to: string, stepMinutes = 30): string[] {
  const out: string[] = [];
  for (let m = toMinutes(from); m <= toMinutes(to); m += stepMinutes) out.push(fromMinutes(m));
  return out;
}

const DEFAULT_SLOTS = makeSlots("12:00", "21:00");

// Defaults only. The operator adjusts days, slots and capacity in /admin.
export const DEFAULT_SETTINGS: Settings = {
  weekdays: {
    "0": { open: false, slots: DEFAULT_SLOTS },
    "1": { open: true, slots: DEFAULT_SLOTS },
    "2": { open: true, slots: DEFAULT_SLOTS },
    "3": { open: true, slots: DEFAULT_SLOTS },
    "4": { open: true, slots: DEFAULT_SLOTS },
    "5": { open: true, slots: DEFAULT_SLOTS },
    "6": { open: true, slots: DEFAULT_SLOTS },
  },
  capacityPerSlot: 24,
  maxPartySize: 10,
  bookingHorizonDays: 90,
  leadTimeMinutes: 120,
  retentionDays: 30,
  openFrom: "08:30",
  openUntil: "21:30",
  ordersEnabled: true,
  pickupFrom: "11:30",
  pickupUntil: "21:30",
  pickupLeadMinutes: 30,
};

export function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function isIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** "now" in Europe/Berlin as { date, minutes } — the restaurant's clock. */
export function berlinNow(now = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime()) / 86_400_000,
  );
}

/** Seats taken per slot for one date. */
export function bookedBySlot(reservations: Reservation[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of reservations) {
    if (!ACTIVE_STATUSES.includes(r.status)) continue;
    map.set(r.time, (map.get(r.time) ?? 0) + r.guests);
  }
  return map;
}

export type SlotInfo = { time: string; state: SlotState; remaining: number };

/** Slot availability for one date, relative to the restaurant's current time. */
export function slotsForDate(
  date: string,
  settings: Settings,
  blocks: Blocks,
  reservations: Reservation[],
  now = berlinNow(),
): SlotInfo[] {
  const day = settings.weekdays[String(weekdayOf(date))];
  if (!day?.open) return [];
  const offset = daysBetween(now.date, date);
  if (offset < 0 || offset > settings.bookingHorizonDays) return [];
  const blocked = blocks[date] ?? [];
  if (blocked.includes("*")) return [];

  const booked = bookedBySlot(reservations);
  return day.slots.map((time) => {
    const tooSoon = offset === 0 && toMinutes(time) - now.minutes < settings.leadTimeMinutes;
    if (tooSoon || blocked.includes(time)) return { time, state: "blocked", remaining: 0 };
    const remaining = Math.max(0, settings.capacityPerSlot - (booked.get(time) ?? 0));
    const state: SlotState =
      remaining === 0 ? "full" : remaining < settings.capacityPerSlot * 0.35 ? "limited" : "available";
    return { time, state, remaining };
  });
}

export function dayStateFromSlots(slots: SlotInfo[]): DayState {
  const open = slots.filter((s) => s.state !== "blocked");
  if (open.length === 0) return "closed";
  const bookable = open.filter((s) => s.state !== "full");
  if (bookable.length === 0) return "full";
  const free = open.filter((s) => s.state === "available").length;
  return free / open.length >= 0.5 ? "available" : "limited";
}

// ---------------------------------------------------------------- validation

export type FieldErrors = Partial<Record<keyof ReservationInput | "form", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()/.-]{6,24}$/;

export function validateReservation(input: Partial<ReservationInput>, settings: Settings): FieldErrors {
  const e: FieldErrors = {};
  if (!input.date || !isIsoDate(input.date)) e.date = "Bitte wählen Sie ein Datum.";
  if (!input.time || !/^\d{2}:\d{2}$/.test(input.time)) e.time = "Bitte wählen Sie eine Uhrzeit.";
  const guests = Number(input.guests);
  if (!Number.isInteger(guests) || guests < 1) e.guests = "Bitte geben Sie die Anzahl der Personen an.";
  else if (guests > settings.maxPartySize)
    e.guests = `Online sind bis zu ${settings.maxPartySize} Personen möglich. Für größere Gruppen rufen Sie uns bitte an.`;
  const name = (input.name ?? "").trim();
  if (name.length < 2) e.name = "Bitte geben Sie Ihren Namen an.";
  else if (name.length > 80) e.name = "Der Name ist zu lang.";
  const phone = (input.phone ?? "").trim();
  if (!phone) e.phone = "Bitte geben Sie eine Telefonnummer für Rückfragen an.";
  else if (!PHONE_RE.test(phone) || phone.replace(/\D/g, "").length < 6)
    e.phone = "Bitte prüfen Sie die Telefonnummer.";
  const email = (input.email ?? "").trim();
  if (!email) e.email = "Bitte geben Sie Ihre E-Mail-Adresse an.";
  else if (!EMAIL_RE.test(email) || email.length > 120) e.email = "Bitte prüfen Sie die E-Mail-Adresse.";
  if ((input.message ?? "").length > 600) e.message = "Die Nachricht ist zu lang (max. 600 Zeichen).";
  if (!input.consent) e.consent = "Bitte bestätigen Sie die Datenschutzhinweise.";
  return e;
}

export function sanitizeInput(input: ReservationInput): ReservationInput {
  const clean = (s: unknown, max: number) =>
    String(s ?? "")
      // strip control characters (header / log injection)
      // oxlint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .trim()
      .slice(0, max);
  return {
    date: clean(input.date, 10),
    time: clean(input.time, 5),
    guests: Number(input.guests),
    name: clean(input.name, 80),
    phone: clean(input.phone, 24),
    email: clean(input.email, 120).toLowerCase(),
    message: String(input.message ?? "").trim().slice(0, 600),
    occasion: clean(input.occasion, 40),
    consent: Boolean(input.consent),
  };
}

/**
 * Checks a freely chosen time. Returns an error code or null.
 * Configured slots keep their capacity/blocking rules; other times inside
 * the opening window are accepted and confirmed by the owner.
 */
export function checkRequestedTime(
  date: string,
  time: string,
  guests: number,
  settings: Settings,
  blocks: Blocks,
  reservations: Reservation[],
  now = berlinNow(),
): "closed" | "too_soon" | "outside_hours" | "slot_full" | null {
  const day = settings.weekdays[String(weekdayOf(date))];
  const offset = daysBetween(now.date, date);
  const blocked = blocks[date] ?? [];
  if (!day?.open || offset < 0 || offset > settings.bookingHorizonDays || blocked.includes("*")) return "closed";
  const m = toMinutes(time);
  if (Number.isNaN(m) || m < toMinutes(settings.openFrom) || m > toMinutes(settings.openUntil)) return "outside_hours";
  if (offset === 0 && m - now.minutes < settings.leadTimeMinutes) return "too_soon";
  if (blocked.includes(time)) return "slot_full";
  if (day.slots.includes(time)) {
    const taken = bookedBySlot(reservations).get(time) ?? 0;
    if (taken + guests > settings.capacityPerSlot) return "slot_full";
  }
  return null;
}
