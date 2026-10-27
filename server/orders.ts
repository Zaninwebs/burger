// Pickup orders ("Bestellen & Abholen"): no delivery, the guest collects the
// order and pays cash at the counter or online in advance.
//
// Online payment uses Stripe Checkout (card, PayPal, Apple Pay, Google Pay …
// as enabled in the Stripe dashboard) and is only offered when
// STRIPE_SECRET_KEY is set. Payment is confirmed by the webhook
// (STRIPE_WEBHOOK_SECRET) and, as a fallback, by asking Stripe directly when
// the guest returns or the owner opens the order list.
import { createHmac, randomBytes, randomInt } from "node:crypto";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_LABEL,
  formatEuro,
  pickupSlots,
  priceLines,
  sanitizeOrderInput,
  validateOrder,
  type Order,
  type OrderInput,
  type OrderStatus,
} from "../shared/orders.ts";
import { addDays, berlinNow, isIsoDate, type Settings } from "../shared/reservations.ts";
import { fail, json } from "./http.ts";
import { getSettings } from "./settings.ts";
import { store } from "./store.ts";

const orderKey = (o: Pick<Order, "date" | "id">) => `o/${o.date}/${o.id}`;

function dateFromOrderId(id: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})-[a-f0-9]{12}$/.exec(id);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

async function loadOrder(id: string): Promise<Order | null> {
  const date = dateFromOrderId(id);
  return date ? store().get<Order>(`o/${date}/${id}`) : null;
}

async function saveOrder(o: Order): Promise<void> {
  await store().set(orderKey(o), o);
}

async function ordersWithPrefix(prefix: string): Promise<Order[]> {
  const keys = await store().list(`o/${prefix}`);
  const docs = await Promise.all(keys.map((k) => store().get<Order>(k)));
  return docs.filter((d): d is Order => d !== null);
}

const onlineEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);

/** Public view of an order: what the guest needs on the confirmation screen. */
const publicOrder = (o: Order) => ({
  id: o.id,
  code: o.code,
  date: o.date,
  time: o.time,
  name: o.name,
  lines: o.lines,
  totalCents: o.totalCents,
  payment: o.payment,
  paymentStatus: o.paymentStatus,
  status: o.status,
});

// ------------------------------------------------------------------- mail

async function sendMail(to: string, subject: string, text: string, replyTo?: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  const from = process.env.MAIL_FROM || "Casa Ducale Bestellung <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    return res.ok;
  } catch (err) {
    console.error("order mail failed", err);
    return false;
  }
}

const when = (o: Order) => {
  const [y, m, d] = o.date.split("-");
  return `${d}.${m}.${y} um ${o.time} Uhr`;
};

async function notifyOwner(o: Order): Promise<void> {
  const lines = [
    `Neue Abhol-Bestellung ${o.code}`,
    "",
    `Abholung:  ${when(o)}`,
    `Name:      ${o.name}`,
    `Telefon:   ${o.phone}`,
    o.email ? `E-Mail:    ${o.email}` : "",
    `Zahlung:   ${PAYMENT_LABEL[o.paymentStatus]}`,
    "",
    ...o.lines.map((l) => `${l.qty} × ${l.name}  ${formatEuro(l.qty * l.cents)}`),
    `Summe:     ${formatEuro(o.totalCents)}`,
    o.note ? `\nHinweis:\n${o.note}` : "",
    "",
    "Bitte im Admin-Bereich annehmen.",
  ].filter((l) => l !== "");
  await sendMail(
    process.env.NOTIFY_EMAIL ?? "",
    `Bestellung ${o.code} · Abholung ${o.time} Uhr · ${formatEuro(o.totalCents)} · ${o.name}`,
    lines.join("\n"),
    o.email || undefined,
  );
}

async function notifyGuest(o: Order): Promise<boolean> {
  if (!o.email || !process.env.MAIL_FROM) return false;
  const phone = process.env.RESTAURANT_PHONE || "0214 43444";
  const texts: Partial<Record<OrderStatus, [string, string]>> = {
    accepted: [
      `Ihre Bestellung ${o.code} bei Casa Ducale ist angenommen`,
      `Guten Tag ${o.name},\n\nwir haben Ihre Bestellung ${o.code} angenommen und bereiten sie für die Abholung am ${when(o)} vor.\n\nSumme: ${formatEuro(o.totalCents)} (${PAYMENT_LABEL[o.paymentStatus]})\n\nA presto!\nCasa Ducale – Cucina Italiana\nWiesdorfer Platz, Leverkusen`,
    ],
    ready: [
      `Ihre Bestellung ${o.code} ist abholbereit`,
      `Guten Tag ${o.name},\n\nIhre Bestellung ${o.code} ist fertig und wartet auf Sie.\n\nBuon appetito!\nCasa Ducale – Cucina Italiana`,
    ],
    cancelled: [
      `Ihre Bestellung ${o.code} bei Casa Ducale`,
      `Guten Tag ${o.name},\n\nleider können wir Ihre Bestellung ${o.code} nicht annehmen. Bei Fragen erreichen Sie uns unter ${phone}.${o.paymentStatus === "paid" ? "\n\nIhre Online-Zahlung wird erstattet." : ""}\n\nHerzliche Grüße\nCasa Ducale – Cucina Italiana`,
    ],
  };
  const t = texts[o.status];
  return t ? sendMail(o.email, t[0], t[1]) : false;
}

// ----------------------------------------------------------------- stripe

async function stripe<T>(method: "GET" | "POST", path: string, form?: URLSearchParams): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(form ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form,
  });
  const body = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`stripe ${path}: ${res.status} ${body.error?.message ?? ""}`);
  return body;
}

function siteOrigin(req: Request): string {
  return (process.env.SITE_URL || process.env.URL || new URL(req.url).origin).replace(/\/$/, "");
}

async function createCheckout(o: Order, req: Request): Promise<string> {
  const back = `${siteOrigin(req)}/?bestellung=${o.id}`;
  const f = new URLSearchParams({
    mode: "payment",
    locale: "de",
    success_url: `${back}#abholen`,
    cancel_url: `${back}&abgebrochen=1#abholen`,
    client_reference_id: o.id,
    "metadata[order_id]": o.id,
    "payment_intent_data[description]": `Casa Ducale Abholung ${o.code}`,
    // the session must not outlive the pickup slot by much
    expires_at: String(Math.floor(Date.now() / 1000) + 40 * 60),
  });
  if (o.email) f.set("customer_email", o.email);
  o.lines.forEach((l, i) => {
    f.set(`line_items[${i}][quantity]`, String(l.qty));
    f.set(`line_items[${i}][price_data][currency]`, "eur");
    f.set(`line_items[${i}][price_data][unit_amount]`, String(l.cents));
    f.set(`line_items[${i}][price_data][product_data][name]`, l.name);
  });
  const session = await stripe<{ id: string; url: string }>("POST", "checkout/sessions", f);
  o.checkoutId = session.id;
  await saveOrder(o);
  return session.url;
}

/** Asks Stripe whether an open online order has been paid; notifies the owner once it is. */
async function refreshPayment(o: Order): Promise<Order> {
  if (o.payment !== "online" || o.paymentStatus !== "open" || !o.checkoutId || !onlineEnabled()) return o;
  try {
    const s = await stripe<{ payment_status: string }>("GET", `checkout/sessions/${encodeURIComponent(o.checkoutId)}`);
    if (s.payment_status === "paid") return markPaid(o);
  } catch (err) {
    console.error(err);
  }
  return o;
}

async function markPaid(o: Order): Promise<Order> {
  const fresh = (await loadOrder(o.id)) ?? o;
  if (fresh.paymentStatus === "paid") return fresh;
  const updated: Order = { ...fresh, paymentStatus: "paid", updatedAt: new Date().toISOString() };
  await saveOrder(updated);
  await notifyOwner(updated);
  return updated;
}

/** Stripe webhook: verifies the signature, then marks the order paid. */
async function webhook(req: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return fail(503, "not_configured", "Webhook nicht eingerichtet.");
  const raw = await req.text();
  const header = req.headers.get("stripe-signature") ?? "";
  const t = /(?:^|,)t=(\d+)/.exec(header)?.[1];
  const sigs = [...header.matchAll(/(?:^|,)v1=([a-f0-9]+)/g)].map((m) => m[1]);
  const expected = t ? createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex") : "";
  if (!t || !sigs.includes(expected) || Math.abs(Date.now() / 1000 - Number(t)) > 600)
    return fail(400, "bad_signature", "Ungültige Signatur.");
  const event = JSON.parse(raw) as { type: string; data: { object: { metadata?: { order_id?: string }; payment_status?: string } } };
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const id = event.data.object.metadata?.order_id;
    const o = id ? await loadOrder(id) : null;
    if (o && event.data.object.payment_status === "paid") await markPaid(o);
  }
  return json({ received: true });
}

// --------------------------------------------------------------- handlers

function config(settings: Settings): Response {
  return json({
    enabled: settings.ordersEnabled,
    onlinePayment: onlineEnabled(),
    leadMinutes: settings.pickupLeadMinutes,
    slots: settings.ordersEnabled ? pickupSlots(settings) : [],
  });
}

async function createOrder(req: Request): Promise<Response> {
  let body: OrderInput;
  try {
    body = (await req.json()) as OrderInput;
  } catch {
    return fail(400, "bad_json", "Die Anfrage konnte nicht gelesen werden.");
  }
  if (body.website) return json({ id: "ok", code: "—" }, 201); // honeypot

  const settings = await getSettings();
  if (!settings.ordersEnabled)
    return fail(409, "orders_paused", "Online-Abholung ist gerade pausiert. Bitte rufen Sie uns an.");
  const input = sanitizeOrderInput(body);
  if (input.payment === "online" && !onlineEnabled())
    return fail(422, "invalid", "Online-Zahlung ist gerade nicht verfügbar.", { fields: { payment: "Bitte wählen Sie Barzahlung bei Abholung." } });
  const errors = validateOrder(input, settings);
  if (Object.keys(errors).length) return fail(422, "invalid", "Bitte prüfen Sie Ihre Angaben.", { fields: errors });

  const { lines, totalCents } = priceLines(input.items);
  const now = new Date().toISOString();
  const order: Order = {
    id: `${input.date.replaceAll("-", "")}-${randomBytes(6).toString("hex")}`,
    code: `${"ABCDEFGHJKLMNPRSTUVWXYZ"[randomInt(23)]}${randomInt(10, 100)}`,
    date: input.date,
    time: input.time,
    name: input.name,
    phone: input.phone,
    email: input.email,
    note: input.note,
    lines,
    totalCents,
    payment: input.payment,
    paymentStatus: input.payment === "online" ? "open" : "due",
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
  await saveOrder(order);

  if (order.payment === "online") {
    try {
      const checkoutUrl = await createCheckout(order, req);
      return json({ ...publicOrder(order), checkoutUrl }, 201);
    } catch (err) {
      console.error(err);
      await store().delete(orderKey(order));
      return fail(502, "payment_unavailable", "Die Online-Zahlung ist gerade nicht erreichbar. Bitte wählen Sie Barzahlung bei Abholung.");
    }
  }
  await notifyOwner(order);
  return json(publicOrder(order), 201);
}

/** Public routes under /api/orders */
export async function orders(req: Request, parts: string[]): Promise<Response> {
  const [id, action] = parts;
  if (!id && req.method === "GET") return config(await getSettings());
  if (!id && req.method === "POST") return createOrder(req);
  if (id === "stripe-webhook" && req.method === "POST") return webhook(req);

  const found = id ? await loadOrder(id) : null;
  if (!found) return fail(404, "not_found", "Bestellung nicht gefunden.");

  // guest came back from Stripe
  if (req.method === "GET" && !action) return json(publicOrder(await refreshPayment(found)));

  // guest cancelled the online payment and pays cash instead
  if (req.method === "POST" && action === "cash") {
    const o = await refreshPayment(found);
    if (o.paymentStatus !== "open" || o.status !== "new") return json(publicOrder(o));
    const updated: Order = { ...o, payment: "cash", paymentStatus: "due", updatedAt: new Date().toISOString() };
    await saveOrder(updated);
    await notifyOwner(updated);
    return json(publicOrder(updated));
  }
  return fail(404, "not_found", "Unbekannte Aktion.");
}

/** Löschkonzept: orders are removed after the retention period, like reservations. */
export async function purgeExpiredOrders(settings: Settings): Promise<number> {
  const cutoff = addDays(berlinNow().date, -settings.retentionDays);
  const keys = (await store().list("o/")).filter((k) => k.slice(2, 12) < cutoff);
  await Promise.all(keys.map((k) => store().delete(k)));
  return keys.length;
}

/** Admin routes under /api/admin/orders (auth checked by the caller). */
export async function adminOrders(req: Request, url: URL, id?: string): Promise<Response> {
  if (!id && req.method === "GET") {
    await purgeExpiredOrders(await getSettings());
    const from = url.searchParams.get("from") ?? berlinNow().date;
    const to = url.searchParams.get("to") ?? addDays(from, 7);
    if (!isIsoDate(from) || !isIsoDate(to)) return fail(400, "bad_range", "Ungültiger Zeitraum.");
    const all = (await ordersWithPrefix("")).filter((o) => o.date >= from && o.date <= to);
    const list = await Promise.all(all.map(refreshPayment));
    list.sort((a, b) => (a.date + a.time + a.createdAt).localeCompare(b.date + b.time + b.createdAt));
    return json({ orders: list });
  }

  const current = id ? await loadOrder(id) : null;
  if (!current) return fail(404, "not_found", "Bestellung nicht gefunden.");

  if (req.method === "PATCH") {
    const { status } = (await req.json().catch(() => ({}))) as { status?: OrderStatus };
    if (!status || !(status in ORDER_STATUS_LABEL)) return fail(400, "bad_status", "Ungültiger Status.");
    const updated: Order = { ...current, status, updatedAt: new Date().toISOString() };
    await saveOrder(updated);
    const guestNotified = status !== current.status ? await notifyGuest(updated) : false;
    return json({ order: updated, guestNotified });
  }
  if (req.method === "DELETE") {
    await store().delete(orderKey(current));
    return json({ deleted: current.id });
  }
  return fail(404, "not_found", "Unbekannte Aktion.");
}
