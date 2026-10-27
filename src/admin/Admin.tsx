import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ORDER_STATUS_LABEL, PAYMENT_LABEL, formatEuro, type Order, type OrderStatus } from "../../shared/orders";
import {
  STATUS_LABEL,
  addDays,
  berlinNow,
  makeSlots,
  type Reservation,
  type ReservationStatus,
  type Settings,
} from "../../shared/reservations";
import Emblem from "../components/Emblem";
import { formatDateLong } from "../lib/api";
import { site } from "../lib/paths";

const TOKEN_KEY = "cd-admin-token";

class AuthError extends Error {}

async function call<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(site(`api/admin/${path}`), {
      ...init,
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    });
  } catch {
    throw new Error("Keine Verbindung zum Server.");
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "login") throw new AuthError(body.message ?? "Bitte erneut anmelden.");
  if (!res.ok) throw new Error(body.message ?? "Aktion fehlgeschlagen.");
  return body as T;
}

type Tab = "orders" | "list" | "slots" | "settings";
const STATUSES: ReservationStatus[] = ["pending", "confirmed", "declined", "completed"];
const WEEKDAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export default function Admin() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [tab, setTab] = useState<Tab>("orders");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const api = useCallback(
    async <T,>(path: string, init?: RequestInit) => {
      try {
        return await call<T>(path, token, init);
      } catch (e) {
        if (e instanceof AuthError) logout();
        throw e;
      }
    },
    [token, logout],
  );

  if (!token)
    return (
      <Login
        onLogin={(t) => {
          sessionStorage.setItem(TOKEN_KEY, t);
          setToken(t);
        }}
      />
    );

  return (
    <div className="adm">
      <header className="adm__bar">
        <div className="adm__brand">
          <Emblem className="adm__lily" title="" />
          <span>
            <strong>Casa Ducale</strong> · Admin
          </span>
        </div>
        <nav className="adm__tabs" aria-label="Bereiche">
          {(["orders", "list", "slots", "settings"] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)} aria-current={tab === t}>
              {{ orders: "Abholung", list: "Reservierungen", slots: "Zeitfenster", settings: "Einstellungen" }[t]}
            </button>
          ))}
        </nav>
        <button className="adm__logout" onClick={logout}>
          Abmelden
        </button>
      </header>
      {notice && (
        <p className="adm__notice" role="status" onClick={() => setNotice("")}>
          {notice}
        </p>
      )}
      <main className="adm__main">
        {tab === "orders" && <Orders api={api} notify={setNotice} />}
        {tab === "list" && <List api={api} notify={setNotice} />}
        {tab === "slots" && <Slots api={api} notify={setNotice} />}
        {tab === "settings" && <SettingsForm api={api} notify={setNotice} />}
      </main>
    </div>
  );
}

type Api = <T>(path: string, init?: RequestInit) => Promise<T>;

// ------------------------------------------------------------------ login

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="adm-login">
      <form
        className="adm-login__card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const { token } = await call<{ token: string }>("login", null, { method: "POST", body: JSON.stringify({ password }) });
            onLogin(token);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Emblem className="adm-login__lily" title="" />
        <h1>Casa Ducale</h1>
        <p className="label">Reservierungen · Admin</p>
        <label htmlFor="pw">Passwort</label>
        <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
        {error && <p className="adm-error" role="alert">{error}</p>}
        <button className="btn btn--gold" disabled={busy}>
          {busy ? "Anmelden …" : "Anmelden"}
        </button>
      </form>
    </main>
  );
}

// ------------------------------------------------------------------ list

function List({ api, notify }: { api: Api; notify: (s: string) => void }) {
  const today = berlinNow().date;
  const [range, setRange] = useState<"today" | "week" | "month" | "past">("week");
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [from, to] = useMemo(() => {
    if (range === "today") return [today, today];
    if (range === "week") return [today, addDays(today, 7)];
    if (range === "month") return [today, addDays(today, 60)];
    return [addDays(today, -30), addDays(today, -1)];
  }, [range, today]);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await api<{ reservations: Reservation[] }>(`reservations?from=${from}&to=${to}`);
      setItems(res.reservations);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [api, from, to]);

  useEffect(() => {
    setLoading(true);
    void load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const update = async (r: Reservation, status: ReservationStatus) => {
    try {
      const res = await api<{ reservation: Reservation; guestNotified: boolean }>(`reservations/${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setItems((xs) => xs.map((x) => (x.id === r.id ? res.reservation : x)));
      notify(`${r.name}: ${STATUS_LABEL[status]}${res.guestNotified ? " · Gast per E-Mail informiert" : ""}`);
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const remove = async (r: Reservation) => {
    if (!confirm(`Reservierung von ${r.name} endgültig löschen?`)) return;
    try {
      await api(`reservations/${r.id}`, { method: "DELETE" });
      setItems((xs) => xs.filter((x) => x.id !== r.id));
      notify("Reservierung gelöscht.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const shown = items.filter((r) => filter === "all" || r.status === filter);
  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: items.filter((r) => r.status === s).length }), {} as Record<ReservationStatus, number>);
  const guests = items.filter((r) => r.status === "pending" || r.status === "confirmed").reduce((n, r) => n + r.guests, 0);

  const byDate = shown.reduce<Record<string, Reservation[]>>((acc, r) => {
    (acc[r.date] ??= []).push(r);
    return acc;
  }, {});

  return (
    <section>
      <div className="adm-toolbar">
        <div className="adm-seg" role="group" aria-label="Zeitraum">
          {(
            [
              ["today", "Heute"],
              ["week", "7 Tage"],
              ["month", "60 Tage"],
              ["past", "Vergangen"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} className={range === k ? "is-active" : ""} onClick={() => setRange(k)}>
              {l}
            </button>
          ))}
        </div>
        <div className="adm-seg" role="group" aria-label="Status">
          <button className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>
            Alle ({items.length})
          </button>
          {STATUSES.map((s) => (
            <button key={s} className={filter === s ? "is-active" : ""} onClick={() => setFilter(s)}>
              {STATUS_LABEL[s]} ({counts[s]})
            </button>
          ))}
        </div>
        <button className="adm-refresh" onClick={() => void load()}>
          Aktualisieren
        </button>
      </div>

      <p className="adm-kpi">
        <strong>{counts.pending}</strong> offen · <strong>{guests}</strong> Gäste erwartet im Zeitraum
      </p>

      {error && <p className="adm-error">{error}</p>}
      {loading && <p className="adm-empty">Lade …</p>}
      {!loading && shown.length === 0 && <p className="adm-empty">Keine Reservierungen in diesem Zeitraum.</p>}

      {Object.entries(byDate).map(([date, list]) => (
        <div key={date} className="adm-day">
          <h2>
            {formatDateLong(date)}
            <span>{list.filter((r) => r.status !== "declined").reduce((n, r) => n + r.guests, 0)} Gäste</span>
          </h2>
          <ul>
            {list.map((r) => (
              <li key={r.id} className={`adm-res is-${r.status}`}>
                <div className="adm-res__time">{r.time}</div>
                <div className="adm-res__main">
                  <p className="adm-res__name">
                    {r.name} <span className="adm-res__guests">{r.guests} Pers.</span>
                    <span className={`adm-badge is-${r.status}`}>{STATUS_LABEL[r.status]}</span>
                  </p>
                  <p className="adm-res__contact">
                    <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}>{r.phone}</a> · <a href={`mailto:${r.email}`}>{r.email}</a>
                  </p>
                  {r.occasion && <p className="adm-res__meta">Anlass: {r.occasion}</p>}
                  {r.message && <p className="adm-res__msg">„{r.message}“</p>}
                  <p className="adm-res__meta">Eingegangen: {new Date(r.createdAt).toLocaleString("de-DE")}</p>
                </div>
                <div className="adm-res__actions">
                  {r.status !== "confirmed" && (
                    <button className="is-ok" onClick={() => update(r, "confirmed")}>
                      Bestätigen
                    </button>
                  )}
                  {r.status !== "declined" && (
                    <button className="is-no" onClick={() => update(r, "declined")}>
                      Ablehnen
                    </button>
                  )}
                  {r.status === "confirmed" && <button onClick={() => update(r, "completed")}>Abgeschlossen</button>}
                  {r.status !== "pending" && <button onClick={() => update(r, "pending")}>Zurück auf offen</button>}
                  <button className="is-del" onClick={() => remove(r)}>
                    Löschen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

// ------------------------------------------------------------------ orders

/** Next step for each status, shown as the main button. */
const NEXT: Partial<Record<OrderStatus, [OrderStatus, string]>> = {
  new: ["accepted", "Annehmen"],
  accepted: ["ready", "Abholbereit"],
  ready: ["picked_up", "Abgeholt"],
};

function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.18].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.16);
    });
  } catch {
    /* audio blocked until the first click */
  }
}

function Orders({ api, notify }: { api: Api; notify: (s: string) => void }) {
  const today = berlinNow().date;
  const [range, setRange] = useState<"open" | "today" | "week" | "past">("open");
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const known = useRef<Set<string> | null>(null);

  const [from, to] = useMemo(() => {
    if (range === "past") return [addDays(today, -14), addDays(today, -1)];
    if (range === "week") return [today, addDays(today, 7)];
    if (range === "today") return [today, today];
    return [today, addDays(today, 3)];
  }, [range, today]);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await api<{ orders: Order[] }>(`orders?from=${from}&to=${to}`);
      // new paid/cash orders since the last poll → sound
      const ready = res.orders.filter((o) => o.status === "new" && o.paymentStatus !== "open");
      if (known.current && ready.some((o) => !known.current!.has(o.id))) beep();
      known.current = new Set(ready.map((o) => o.id));
      setItems(res.orders);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [api, from, to]);

  useEffect(() => {
    setLoading(true);
    known.current = null;
    void load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [load]);

  const fresh = items.filter((o) => o.status === "new" && o.paymentStatus !== "open").length;
  useEffect(() => {
    document.title = fresh ? `(${fresh}) Neue Abholung · Casa Ducale` : "Casa Ducale · Admin";
  }, [fresh]);

  const update = async (o: Order, status: OrderStatus) => {
    if (status === "cancelled" && !confirm(`Abholung ${o.code} von ${o.name} stornieren?`)) return;
    try {
      const res = await api<{ order: Order; guestNotified: boolean }>(`orders/${o.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setItems((xs) => xs.map((x) => (x.id === o.id ? res.order : x)));
      notify(`${o.code} · ${ORDER_STATUS_LABEL[status]}${res.guestNotified ? " · Gast per E-Mail informiert" : ""}`);
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const remove = async (o: Order) => {
    if (!confirm(`Abholung ${o.code} endgültig löschen?`)) return;
    try {
      await api(`orders/${o.id}`, { method: "DELETE" });
      setItems((xs) => xs.filter((x) => x.id !== o.id));
      notify("Abholung gelöscht.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const shown = items.filter((o) => (range === "open" ? !["picked_up", "cancelled"].includes(o.status) : true));
  const byDate = shown.reduce<Record<string, Order[]>>((acc, o) => {
    (acc[o.date] ??= []).push(o);
    return acc;
  }, {});
  const revenue = items.filter((o) => o.status !== "cancelled" && o.paymentStatus !== "open").reduce((n, o) => n + o.totalCents, 0);

  return (
    <section>
      <div className="adm-toolbar">
        <div className="adm-seg" role="group" aria-label="Ansicht">
          {(
            [
              ["open", "Offen"],
              ["today", "Heute"],
              ["week", "7 Tage"],
              ["past", "Vergangen"],
            ] as const
          ).map(([k, l]) => (
            <button key={k} className={range === k ? "is-active" : ""} onClick={() => setRange(k)}>
              {l}
            </button>
          ))}
        </div>
        <button className="adm-refresh" onClick={() => void load()}>
          Aktualisieren
        </button>
      </div>

      <p className="adm-kpi">
        <strong>{fresh}</strong> neu · <strong>{formatEuro(revenue)}</strong> Umsatz im Zeitraum · aktualisiert sich automatisch
      </p>

      {error && <p className="adm-error">{error}</p>}
      {loading && <p className="adm-empty">Lade …</p>}
      {!loading && shown.length === 0 && <p className="adm-empty">Keine Abholungen in diesem Zeitraum.</p>}

      {Object.entries(byDate).map(([date, list]) => (
        <div key={date} className="adm-day">
          <h2>
            {formatDateLong(date)}
            <span>{list.length} Abholungen</span>
          </h2>
          <ul>
            {list.map((o) => {
              const unpaid = o.paymentStatus === "open";
              const next = NEXT[o.status];
              return (
                <li key={o.id} className={`adm-res adm-order is-${o.status} ${unpaid ? "is-unpaid" : ""}`}>
                  <div className="adm-res__time">
                    {o.time}
                    <span className="adm-order__code">{o.code}</span>
                  </div>
                  <div className="adm-res__main">
                    <p className="adm-res__name">
                      {o.name}
                      <span className={`adm-badge is-o-${o.status}`}>{ORDER_STATUS_LABEL[o.status]}</span>
                      <span className={`adm-pay is-${o.paymentStatus}`}>{PAYMENT_LABEL[o.paymentStatus]}</span>
                    </p>
                    <p className="adm-res__contact">
                      <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`}>{o.phone}</a>
                      {o.email && (
                        <>
                          {" "}
                          · <a href={`mailto:${o.email}`}>{o.email}</a>
                        </>
                      )}
                    </p>
                    <ul className="adm-order__lines">
                      {o.lines.map((l) => (
                        <li key={l.id}>
                          <strong>{l.qty} ×</strong> {l.name}
                          <span>{formatEuro(l.qty * l.cents)}</span>
                        </li>
                      ))}
                      <li className="adm-order__sum">
                        Summe <span>{formatEuro(o.totalCents)}</span>
                      </li>
                    </ul>
                    {o.note && <p className="adm-res__msg">„{o.note}“</p>}
                    {unpaid && <p className="adm-res__meta adm-warn">Online-Zahlung noch nicht abgeschlossen – bitte noch nicht zubereiten.</p>}
                    <p className="adm-res__meta">Eingegangen: {new Date(o.createdAt).toLocaleString("de-DE")}</p>
                  </div>
                  <div className="adm-res__actions">
                    {next && !unpaid && (
                      <button className="is-ok" onClick={() => update(o, next[0])}>
                        {next[1]}
                      </button>
                    )}
                    {o.status !== "cancelled" && o.status !== "picked_up" && (
                      <button className="is-no" onClick={() => update(o, "cancelled")}>
                        Stornieren
                      </button>
                    )}
                    {(o.status === "picked_up" || o.status === "cancelled") && <button onClick={() => update(o, "new")}>Zurück auf neu</button>}
                    <button className="is-del" onClick={() => remove(o)}>
                      Löschen
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

// ------------------------------------------------------------------ slots

type DayInfo = { date: string; open: boolean; dayBlocked: boolean; capacity: number; slots: { time: string; booked: number; blocked: boolean }[] };

function Slots({ api, notify }: { api: Api; notify: (s: string) => void }) {
  const [date, setDate] = useState(berlinNow().date);
  const [day, setDay] = useState<DayInfo | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setDay(await api<DayInfo>(`day?date=${date}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api, date]);
  useEffect(() => {
    void load();
  }, [load]);

  const save = async (times: string[]) => {
    try {
      await api("blocks", { method: "PUT", body: JSON.stringify({ date, times }) });
      await load();
      notify("Zeitfenster gespeichert.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const blockedTimes = day?.slots.filter((s) => s.blocked).map((s) => s.time) ?? [];
  const toggle = (t: string) => save(blockedTimes.includes(t) ? blockedTimes.filter((x) => x !== t) : [...blockedTimes, t]);

  return (
    <section>
      <div className="adm-toolbar">
        <button onClick={() => setDate(addDays(date, -1))} aria-label="Vorheriger Tag">
          ←
        </button>
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <button onClick={() => setDate(addDays(date, 1))} aria-label="Nächster Tag">
          →
        </button>
        <strong>{formatDateLong(date)}</strong>
      </div>
      {error && <p className="adm-error">{error}</p>}
      {day && !day.open && <p className="adm-empty">An diesem Wochentag ist die Online-Reservierung geschlossen (siehe Einstellungen).</p>}
      {day && day.open && (
        <>
          <div className="adm-dayctl">
            {day.dayBlocked ? (
              <button className="is-ok" onClick={() => save([])}>
                Ganzen Tag wieder freigeben
              </button>
            ) : (
              <button className="is-no" onClick={() => save(["*"])}>
                Ganzen Tag sperren (z. B. Ruhetag, geschlossene Gesellschaft)
              </button>
            )}
          </div>
          <ul className={`adm-slots ${day.dayBlocked ? "is-off" : ""}`}>
            {day.slots.map((s) => {
              const full = s.booked >= day.capacity;
              const state = s.blocked || day.dayBlocked ? "gesperrt" : full ? "ausgebucht" : s.booked > 0 ? "teilweise belegt" : "verfügbar";
              return (
                <li key={s.time} className={`adm-slot ${s.blocked ? "is-blocked" : full ? "is-full" : s.booked ? "is-partial" : ""}`}>
                  <span className="adm-slot__time">{s.time}</span>
                  <span className="adm-slot__bar">
                    <span style={{ width: `${Math.min(100, (s.booked / day.capacity) * 100)}%` }} />
                  </span>
                  <span className="adm-slot__num">
                    {s.booked}/{day.capacity}
                  </span>
                  <span className="adm-slot__state">{state}</span>
                  <button disabled={day.dayBlocked} onClick={() => toggle(s.time)}>
                    {s.blocked ? "Freigeben" : "Sperren"}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ settings

function SettingsForm({ api, notify }: { api: Api; notify: (s: string) => void }) {
  const [s, setS] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [gen, setGen] = useState({ from: "12:00", to: "21:00", step: "30" });

  useEffect(() => {
    api<{ settings: Settings }>("settings")
      .then((r) => setS(r.settings))
      .catch((e) => setError(e.message));
  }, [api]);

  if (!s) return <p className="adm-empty">{error || "Lade …"}</p>;

  const setDay = (d: number, patch: Partial<Settings["weekdays"][string]>) =>
    setS({ ...s, weekdays: { ...s.weekdays, [d]: { ...s.weekdays[d], ...patch } } });
  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: Number(e.target.value) });

  const save = async () => {
    try {
      const r = await api<{ settings: Settings }>("settings", { method: "PUT", body: JSON.stringify(s) });
      setS(r.settings);
      notify("Einstellungen gespeichert.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  return (
    <section className="adm-settings">
      <h2>Kapazität &amp; Regeln</h2>
      <div className="adm-grid">
        <label>
          Plätze pro Zeitfenster
          <input type="number" min={1} max={500} value={s.capacityPerSlot} onChange={num("capacityPerSlot")} />
        </label>
        <label>
          Max. Personen online
          <input type="number" min={1} max={60} value={s.maxPartySize} onChange={num("maxPartySize")} />
        </label>
        <label>
          Buchbar im Voraus (Tage)
          <input type="number" min={1} max={365} value={s.bookingHorizonDays} onChange={num("bookingHorizonDays")} />
        </label>
        <label>
          Vorlaufzeit (Minuten)
          <input type="number" min={0} max={2880} value={s.leadTimeMinutes} onChange={num("leadTimeMinutes")} />
        </label>
        <label>
          Reservierbar ab (Uhrzeit)
          <input type="time" value={s.openFrom} onChange={(e) => setS({ ...s, openFrom: e.target.value })} />
        </label>
        <label>
          Reservierbar bis (Uhrzeit)
          <input type="time" value={s.openUntil} onChange={(e) => setS({ ...s, openUntil: e.target.value })} />
        </label>
        <label>
          Löschen nach (Tagen)
          <input type="number" min={1} max={365} value={s.retentionDays} onChange={num("retentionDays")} />
        </label>
      </div>

      <h2>Abholung</h2>
      <div className="adm-grid">
        <label className="adm-check">
          <input type="checkbox" checked={s.ordersEnabled} onChange={(e) => setS({ ...s, ordersEnabled: e.target.checked })} />
          Online-Abholung annehmen
        </label>
        <label>
          Abholung ab (Uhrzeit)
          <input type="time" value={s.pickupFrom} onChange={(e) => setS({ ...s, pickupFrom: e.target.value })} />
        </label>
        <label>
          Abholung bis (Uhrzeit)
          <input type="time" value={s.pickupUntil} onChange={(e) => setS({ ...s, pickupUntil: e.target.value })} />
        </label>
        <label>
          Zubereitungszeit (Minuten)
          <input type="number" min={0} max={240} value={s.pickupLeadMinutes} onChange={num("pickupLeadMinutes")} />
        </label>
      </div>
      <p className="adm-res__meta">Abholung ist an den Wochentagen möglich, die unten geöffnet sind. Bei viel Betrieb einfach „annehmen“ ausschalten.</p>

      <h2>Wochentage &amp; Zeitfenster</h2>
      <div className="adm-gen">
        <span>Zeitfenster erzeugen:</span>
        <input type="time" value={gen.from} onChange={(e) => setGen({ ...gen, from: e.target.value })} aria-label="Von" />
        <span>bis</span>
        <input type="time" value={gen.to} onChange={(e) => setGen({ ...gen, to: e.target.value })} aria-label="Bis" />
        <span>alle</span>
        <select value={gen.step} onChange={(e) => setGen({ ...gen, step: e.target.value })} aria-label="Intervall">
          <option value="15">15 Min.</option>
          <option value="30">30 Min.</option>
          <option value="60">60 Min.</option>
        </select>
      </div>
      <ul className="adm-weekdays">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => {
          const day = s.weekdays[d];
          return (
            <li key={d}>
              <label className="adm-check">
                <input type="checkbox" checked={day.open} onChange={(e) => setDay(d, { open: e.target.checked })} />
                {WEEKDAY_NAMES[d]}
              </label>
              <span className="adm-weekdays__slots">{day.open ? day.slots.join(" · ") || "keine Zeitfenster" : "geschlossen"}</span>
              <button onClick={() => setDay(d, { slots: makeSlots(gen.from, gen.to, Number(gen.step)) })} disabled={!day.open}>
                Zeiten übernehmen
              </button>
            </li>
          );
        })}
      </ul>
      <button className="btn btn--gold" onClick={save}>
        Einstellungen speichern
      </button>
    </section>
  );
}
