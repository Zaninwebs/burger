// Basket for pickup orders. Lives in memory, mirrored to localStorage so a
// reload (or the return from online payment) keeps it.
import { useSyncExternalStore } from "react";
import { MAX_QTY, ORDERABLE } from "../../shared/orders";

export type Cart = Record<string, number>; // dish id → quantity

const KEY = "cd-cart";
const OPEN_EVENT = "cd:open-cart";

function load(): Cart {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Cart;
    // drop dishes that are no longer on the menu
    return Object.fromEntries(Object.entries(raw).filter(([id, q]) => ORDERABLE.has(id) && q > 0));
  } catch {
    return {};
  }
}

let cart: Cart = typeof window === "undefined" ? {} : load();
const listeners = new Set<() => void>();

function set(next: Cart) {
  cart = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    /* private mode */
  }
  listeners.forEach((l) => l());
}

export const cartStore = {
  add(id: string) {
    set({ ...cart, [id]: Math.min(MAX_QTY, (cart[id] ?? 0) + 1) });
  },
  setQty(id: string, qty: number) {
    const next = { ...cart };
    if (qty <= 0) delete next[id];
    else next[id] = Math.min(MAX_QTY, qty);
    set(next);
  },
  clear() {
    set({});
  },
  open() {
    window.dispatchEvent(new Event(OPEN_EVENT));
  },
  onOpen(fn: () => void) {
    window.addEventListener(OPEN_EVENT, fn);
    return () => window.removeEventListener(OPEN_EVENT, fn);
  },
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useCart() {
  const c = useSyncExternalStore(subscribe, () => cart, () => cart);
  const lines = Object.entries(c).map(([id, qty]) => ({ ...ORDERABLE.get(id)!, qty }));
  return {
    cart: c,
    lines,
    count: lines.reduce((s, l) => s + l.qty, 0),
    totalCents: lines.reduce((s, l) => s + l.qty * l.cents, 0),
  };
}
