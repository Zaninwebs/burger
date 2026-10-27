// Integration tests for pickup orders against the file store.
//   npm test
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";

const dir = mkdtempSync(path.join(tmpdir(), "cd-orders-"));
process.env.RESERVATION_STORE = "file";
process.env.RESERVATION_STORE_DIR = dir;
process.env.ADMIN_PASSWORD = "test-password";
delete process.env.RESEND_API_KEY;
delete process.env.STRIPE_SECRET_KEY;

const { handle } = await import("../server/api.ts");
const { ORDERABLE, parsePrice, pickupSlots } = await import("../shared/orders.ts");
const { DEFAULT_SETTINGS } = await import("../shared/reservations.ts");

const call = async (method: string, url: string, body?: unknown, token?: string) => {
  const res = await handle(
    new Request(`http://localhost${url}`, {
      method,
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
  return { status: res.status, body: (await res.json()) as any };
};

const PIZZA = "pizza:pizza-ducale";
let slot = { date: "", time: "" };
let token = "";

const order = (over: object = {}) => ({
  items: [{ id: PIZZA, qty: 2 }],
  ...slot,
  name: "Maria Rossi",
  phone: "+49 170 1234567",
  email: "",
  note: "",
  payment: "cash",
  consent: true,
  ...over,
});

before(async () => {
  token = (await call("POST", "/api/admin/login", { password: "test-password" })).body.token;
  // open every day with a full-day window so the tests do not depend on the clock
  const s = (await call("GET", "/api/admin/settings", undefined, token)).body.settings;
  for (const d of Object.keys(s.weekdays)) s.weekdays[d].open = true;
  await call("PUT", "/api/admin/settings", { ...s, pickupFrom: "00:00", pickupUntil: "23:45", pickupLeadMinutes: 0 }, token);
  const cfg = (await call("GET", "/api/orders")).body;
  const day = cfg.slots.at(-1);
  slot = { date: day.date, time: day.times.at(-1) };
});
after(() => rmSync(dir, { recursive: true, force: true }));

describe("menu pricing", () => {
  test("only fixed prices are orderable", () => {
    assert.equal(parsePrice("9,80"), 980);
    assert.equal(parsePrice("ab 3,50"), null);
    assert.equal(parsePrice("6,30 – 8,10"), null);
    assert.equal(parsePrice(null), null);
    assert.equal(ORDERABLE.get(PIZZA)?.cents, 980);
  });

  test("pickup slots start after the lead time and stay in the window", () => {
    const days = pickupSlots(DEFAULT_SETTINGS, { date: "2026-10-26", minutes: 12 * 60 + 5 }); // Monday 12:05
    assert.equal(days[0].date, "2026-10-26");
    assert.equal(days[0].times[0], "12:45");
    assert.equal(days[0].times.at(-1), "21:30");
    // Sunday is closed by default
    assert.ok(!days.some((d) => d.date === "2026-10-25"));
  });
});

describe("orders", () => {
  test("config lists pickup slots, online payment off without Stripe", async () => {
    const r = await call("GET", "/api/orders");
    assert.equal(r.status, 200);
    assert.equal(r.body.enabled, true);
    assert.equal(r.body.onlinePayment, false);
    assert.ok(r.body.slots.length > 0);
  });

  test("cash order: server recomputes the total", async () => {
    const r = await call("POST", "/api/orders", order({ items: [{ id: PIZZA, qty: 2 }, { id: "nope", qty: 1 }], totalCents: 1 }));
    assert.equal(r.status, 201);
    assert.equal(r.body.totalCents, 1960);
    assert.equal(r.body.lines.length, 1);
    assert.equal(r.body.paymentStatus, "due");
    assert.match(r.body.code, /^[A-Z]\d{2}$/);
  });

  test("validation: empty basket, bad time, missing consent", async () => {
    const r = await call("POST", "/api/orders", order({ items: [], time: "03:07", consent: false }));
    assert.equal(r.status, 422);
    assert.ok(r.body.fields.items);
    assert.ok(r.body.fields.time);
    assert.ok(r.body.fields.consent);
  });

  test("online payment is refused when Stripe is not configured", async () => {
    const r = await call("POST", "/api/orders", order({ payment: "online", email: "maria@example.com" }));
    assert.equal(r.status, 422);
    assert.ok(r.body.fields.payment);
  });

  test("admin lists and updates orders; guest can read status", async () => {
    const created = (await call("POST", "/api/orders", order())).body;
    const list = await call("GET", `/api/admin/orders?from=${slot.date}&to=${slot.date}`, undefined, token);
    assert.equal(list.status, 200);
    assert.ok(list.body.orders.some((o: any) => o.id === created.id));

    const upd = await call("PATCH", `/api/admin/orders/${created.id}`, { status: "ready" }, token);
    assert.equal(upd.body.order.status, "ready");
    const pub = await call("GET", `/api/orders/${created.id}`);
    assert.equal(pub.body.status, "ready");
    assert.equal(pub.body.phone, undefined, "no contact data in the public view");

    assert.equal((await call("GET", "/api/admin/orders", undefined, "bad")).status, 401);
  });

  test("paused orders are refused", async () => {
    const s = (await call("GET", "/api/admin/settings", undefined, token)).body.settings;
    await call("PUT", "/api/admin/settings", { ...s, ordersEnabled: false }, token);
    const r = await call("POST", "/api/orders", order());
    assert.equal(r.status, 409);
    assert.equal((await call("GET", "/api/orders")).body.slots.length, 0);
    await call("PUT", "/api/admin/settings", { ...s, ordersEnabled: true }, token);
  });

  test("webhook rejects unsigned calls", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const r = await call("POST", "/api/orders/stripe-webhook", { type: "checkout.session.completed" });
    assert.equal(r.status, 400);
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });
});
