import { pickupSlots, priceLines, type Order, type OrderErrors, type OrderInput } from "../../shared/orders";
import { DEFAULT_SETTINGS, type DayState, type FieldErrors, type ReservationInput, type SlotState } from "../../shared/reservations";
import { site } from "./paths";

export type Meta = { maxPartySize: number; bookingHorizonDays: number; today: string };
export type MonthResponse = Meta & { month: string; days: Record<string, DayState> };
export type DayResponse = Meta & { date: string; state: DayState; slots: { time: string; state: SlotState }[] };

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: FieldErrors & OrderErrors;
  constructor(status: number, code: string, message: string, fields?: FieldErrors & OrderErrors) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const FRIENDLY_OFFLINE =
  "Keine Verbindung. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.";
const FRIENDLY_SERVER =
  "Die Reservierung ist gerade nicht erreichbar. Bitte versuchen Sie es später erneut oder rufen Sie uns an.";

async function request<T>(url: string, init?: RequestInit, timeoutMs = 12000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: ctrl.signal, headers: { "content-type": "application/json", ...init?.headers } });
  } catch {
    throw new ApiError(0, "network", FRIENDLY_OFFLINE);
  } finally {
    clearTimeout(timer);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    // never surface raw server errors in the UI
    const message = res.status >= 500 || !body?.message ? FRIENDLY_SERVER : body.message;
    throw new ApiError(res.status, body?.error ?? "unknown", message, body?.fields);
  }
  return body as T;
}

/** Preview builds (VITE_DEMO=1) have no server: requests are simulated. */
export const IS_DEMO = import.meta.env.VITE_DEMO === "1";

export type OrderConfig = { enabled: boolean; onlinePayment: boolean; leadMinutes: number; slots: { date: string; times: string[] }[] };
export type PublicOrder = Pick<
  Order,
  "id" | "code" | "date" | "time" | "name" | "lines" | "totalCents" | "payment" | "paymentStatus" | "status"
> & { checkoutUrl?: string };

const wait = <T,>(value: T, ms = 900) => new Promise<T>((r) => setTimeout(() => r(value), ms));

/** Demo: the whole order flow runs in the browser, online payment included. */
function demoOrder(input: OrderInput): PublicOrder {
  const { lines, totalCents } = priceLines(input.items);
  return {
    id: "demo",
    code: `D${10 + Math.floor(Math.random() * 90)}`,
    date: input.date,
    time: input.time,
    name: input.name,
    lines,
    totalCents,
    payment: input.payment,
    paymentStatus: input.payment === "online" ? "paid" : "due",
    status: "new",
  };
}

export const api = {
  orderConfig: () =>
    IS_DEMO
      ? Promise.resolve<OrderConfig>({ enabled: true, onlinePayment: true, leadMinutes: DEFAULT_SETTINGS.pickupLeadMinutes, slots: pickupSlots(DEFAULT_SETTINGS) })
      : request<OrderConfig>(site("api/orders")),
  order: (input: OrderInput) =>
    IS_DEMO ? wait(demoOrder(input), input.payment === "online" ? 1600 : 900) : request<PublicOrder>(site("api/orders"), { method: "POST", body: JSON.stringify(input) }),
  orderStatus: (id: string) => request<PublicOrder>(site(`api/orders/${encodeURIComponent(id)}`)),
  payCash: (id: string) => request<PublicOrder>(site(`api/orders/${encodeURIComponent(id)}/cash`), { method: "POST" }),
  month: (month: string) => request<MonthResponse>(site(`api/availability?month=${month}`)),
  day: (date: string) => request<DayResponse>(site(`api/availability?date=${date}`)),
  reserve: (input: ReservationInput) =>
    IS_DEMO
      ? new Promise<{ id: string; status: string }>((r) => setTimeout(() => r({ id: "demo", status: "pending" }), 900))
      : request<{ id: string; status: string }>(site("api/reservations"), { method: "POST", body: JSON.stringify(input) }),
};

// ------------------------------------------------------------------ dates

export const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
export const WEEKDAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const WEEKDAYS_LONG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${WEEKDAYS_LONG[d.getUTCDay()]}, ${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}
