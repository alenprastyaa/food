"use client";
import { useCallback, useEffect, useState } from "react";

export type CartOption = { groupId: string; optionId: string; name: string; priceDelta: number };
export type CartLine = { key: string; menuId: string; qty: number; notes: string; options: CartOption[] };
type CartState = { outletId: string; lines: Record<string, CartLine> };

const KEY = "nashi_cart_v1";

export function lineKey(menuId: string, options: CartOption[]) {
  if (options.length === 0) return menuId;
  const ids = options.map((o) => o.optionId).sort().join(",");
  return `${menuId}::${ids}`;
}

function load(): CartState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartState) : null;
  } catch {
    return null;
  }
}

function save(state: CartState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

/** Cart is scoped to a single outlet at a time (orders belong to one outlet). */
export function useCart(outletId: string) {
  const [lines, setLines] = useState<Record<string, CartLine>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const existing = load();
    if (existing && existing.outletId === outletId) setLines(existing.lines);
    else setLines({});
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  useEffect(() => {
    if (!hydrated) return;
    save({ outletId, lines });
  }, [outletId, lines, hydrated]);

  /** add one unit of a menu item with a given option selection (new line, or +1 to a matching existing line) */
  const addLine = useCallback((menuId: string, options: CartOption[] = []) => {
    const key = lineKey(menuId, options);
    setLines((prev) => {
      const cur = prev[key];
      return { ...prev, [key]: { key, menuId, qty: (cur?.qty ?? 0) + 1, notes: cur?.notes ?? "", options } };
    });
    return key;
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[key];
      } else if (next[key]) {
        next[key] = { ...next[key], qty };
      }
      return next;
    });
  }, []);

  const setNotes = useCallback((key: string, notes: string) => {
    setLines((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], notes } } : prev));
  }, []);

  const clear = useCallback(() => {
    setLines({});
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
  }, []);

  const items = Object.values(lines);
  const count = items.reduce((s, l) => s + l.qty, 0);

  return { lines, items, count, addLine, setQty, setNotes, clear, hydrated };
}
