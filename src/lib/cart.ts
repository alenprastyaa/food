"use client";
import { useCallback, useEffect, useState } from "react";

export type CartLine = { menuId: string; qty: number; notes: string };
type CartState = { outletId: string; lines: Record<string, CartLine> };

const KEY = "nashi_cart_v1";

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

  const setQty = useCallback((menuId: string, qty: number) => {
    setLines((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[menuId];
      else next[menuId] = { menuId, qty, notes: prev[menuId]?.notes ?? "" };
      return next;
    });
  }, []);

  const setNotes = useCallback((menuId: string, notes: string) => {
    setLines((prev) => (prev[menuId] ? { ...prev, [menuId]: { ...prev[menuId], notes } } : prev));
  }, []);

  const clear = useCallback(() => {
    setLines({});
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
  }, []);

  const items = Object.values(lines);
  const count = items.reduce((s, l) => s + l.qty, 0);

  return { lines, items, count, setQty, setNotes, clear, hydrated };
}
