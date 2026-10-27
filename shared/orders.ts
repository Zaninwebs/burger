// Pickup orders ("Bestellen & Abholen") shared by the browser and the API.
// Everything here is pure: no storage, no network, no DOM.
//
// The server never trusts prices from the browser: totals are always
// recomputed from the menu in src/data/menu.ts.
import { menu } from "../src/data/menu.ts";
import { addDays, berlinNow, fromMinutes, toMinutes, weekdayOf, type Settings } from "./reservations.ts";

export type OrderStatus = "new" | "accepted" | "ready" | "picked_up" | "cancelled";
export type PaymentMethod = "cash" | "online";
export type PaymentStatus = "due" | "paid" | "open"; // due = cash at pickup, open = online not yet paid

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Neu",
  accepted: "In Zubereitung",
  ready: "Abholbereit",
  picked_up: "Abgeholt",
  cancelled: "Storniert",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  due: "Bar bei Abholung",
  paid: "Online bezahlt",
  open: "Online – Zahlung offen",
};

export const MAX_QTY = 20;
export const MAX_LINES = 30;
/** how many days ahead a pickup can be ordered (0 = today only) */
export const PICKUP_DAYS_AHEAD = 2;

export type OrderableDish = { id: string; category: string; name: string; description?: string; cents: number };

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const dishId = (categoryId: string, name: string) => `${categoryId}:${slug(name)}`;

/** "9,80" → 980. Ranges ("6,30 – 8,10"), "ab …" and missing prices are not orderable. */
export function parsePrice(price: string | null): number | null {
  const m = price ? /^(\d{1,3}),(\d{2})$/.exec(price.trim()) : null;
  return m ? Number(m[1]) * 100 + Number(m[2]) : null;
}

export const ORDERABLE: Map<string, OrderableDish> = new Map(
  menu.flatMap((c) =>
    c.dishes.flatMap((d) => {
      const cents = parsePrice(d.price);
      if (cents === null) return [];
      const id = dishId(c.id, d.name);
      return [[id, { id, category: c.label, name: d.name, description: d.description, cents }] as const];
    }),
  ),
);

export function formatEuro(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export type OrderLine = { id: string; name: string; qty: number; cents: number };

export type Order = {
  id: string;
  code: string; // short number shown at the counter, e.g. "A27"
  date: string; // pickup date YYYY-MM-DD
  time: string; // pickup time HH:MM
  name: string;
  phone: string;
  email: string;
  note: string;
  lines: OrderLine[];
  totalCents: number;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  checkoutId?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type OrderInput = {
  items: { id: string; qty: number }[];
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  note: string;
  payment: PaymentMethod;
  consent: boolean;
  website?: string;
};

export type OrderErrors = Partial<Record<"items" | "date" | "time" | "name" | "phone" | "email" | "note" | "payment" | "consent", string>>;

/** Resolves the basket against the menu. Unknown dishes are dropped. */
export function priceLines(items: OrderInput["items"]): { lines: OrderLine[]; totalCents: number } {
  const merged = new Map<string, number>();
  for (const it of Array.isArray(items) ? items : []) {
    if (!it || typeof it.id !== "string" || !ORDERABLE.has(it.id)) continue;
    const qty = Math.floor(Number(it.qty));
    if (!Number.isFinite(qty) || qty < 1) continue;
    merged.set(it.id, Math.min(MAX_QTY, (merged.get(it.id) ?? 0) + qty));
  }
  const lines = [...merged].slice(0, MAX_LINES).map(([id, qty]) => {
    const d = ORDERABLE.get(id)!;
    return { id, name: d.name, qty, cents: d.cents };
  });
  return { lines, totalCents: lines.reduce((s, l) => s + l.qty * l.cents, 0) };
}

/**
 * Pickup times guests can choose, in 15-minute steps: from now + lead time
 * (rounded up) until the end of the pickup window, today and the next days.
 */
export function pickupSlots(settings: Settings, now = berlinNow()): { date: string; times: string[] }[] {
  const out: { date: string; times: string[] }[] = [];
  for (let offset = 0; offset <= PICKUP_DAYS_AHEAD; offset++) {
    const date = addDays(now.date, offset);
    if (!settings.weekdays[String(weekdayOf(date))]?.open) continue;
    let start = toMinutes(settings.pickupFrom);
    if (offset === 0) start = Math.max(start, Math.ceil((now.minutes + settings.pickupLeadMinutes) / 15) * 15);
    const times: string[] = [];
    for (let m = start; m <= toMinutes(settings.pickupUntil); m += 15) times.push(fromMinutes(m));
    if (times.length) out.push({ date, times });
  }
  return out;
}

export function validateOrder(input: Partial<OrderInput>, settings: Settings, now = berlinNow()): OrderErrors {
  const e: OrderErrors = {};
  const { lines } = priceLines(input.items ?? []);
  if (!lines.length) e.items = "Bitte wählen Sie mindestens ein Gericht.";
  const name = (input.name ?? "").trim();
  if (name.length < 2) e.name = "Bitte geben Sie Ihren Namen an.";
  else if (name.length > 80) e.name = "Der Name ist zu lang.";
  const phone = (input.phone ?? "").trim();
  if (!/^[+0-9 ()/-]{6,24}$/.test(phone) || (phone.match(/\d/g) ?? []).length < 6)
    e.phone = "Bitte geben Sie eine gültige Telefonnummer an.";
  const email = (input.email ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = "Bitte prüfen Sie die E-Mail-Adresse.";
  if (input.payment === "online" && !email) e.email = "Für die Online-Zahlung benötigen wir Ihre E-Mail-Adresse.";
  if ((input.note ?? "").length > 400) e.note = "Bitte maximal 400 Zeichen.";
  if (input.payment !== "cash" && input.payment !== "online") e.payment = "Bitte wählen Sie eine Zahlungsart.";
  if (!input.consent) e.consent = "Bitte stimmen Sie der Verarbeitung Ihrer Angaben zu.";
  const day = pickupSlots(settings, now).find((d) => d.date === input.date);
  if (!input.date || !input.time) e.time = "Bitte wählen Sie eine Abholzeit.";
  else if (!day || !day.times.includes(input.time)) e.time = "Diese Abholzeit ist nicht mehr verfügbar. Bitte wählen Sie eine andere.";
  return e;
}

export function sanitizeOrderInput(input: OrderInput): OrderInput {
  const clean = (s: unknown, max: number) =>
    String(s ?? "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .trim()
      .slice(0, max);
  return {
    items: Array.isArray(input.items) ? input.items.slice(0, 60) : [],
    date: clean(input.date, 10),
    time: clean(input.time, 5),
    name: clean(input.name, 80),
    phone: clean(input.phone, 24),
    email: clean(input.email, 120).toLowerCase(),
    note: clean(input.note, 400),
    payment: input.payment === "online" ? "online" : "cash",
    consent: input.consent === true,
    website: clean(input.website, 200),
  };
}
