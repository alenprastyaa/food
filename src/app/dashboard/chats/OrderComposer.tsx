"use client";
import { useEffect, useMemo, useState } from "react";
import { Button, MenuImage } from "@/components/ui";
import { rupiah } from "@/lib/format";

type Menu = { id: string; name: string; category: string; price: number; image: string | null; isAvailable: boolean };
type Line = { menuId: string; qty: number; notes: string };

export default function OrderComposer({
  conversationId,
  outletId,
  buyerName,
  onClose,
  onCreated,
}: {
  conversationId: string;
  outletId: string;
  buyerName: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [cat, setCat] = useState<string>("");
  const [lines, setLines] = useState<Record<string, Line>>({});
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/menu?outletId=${outletId}`)
      .then((r) => r.json())
      .then((d) => {
        const list: Menu[] = d.menus ?? [];
        setMenus(list);
        setCat(Array.from(new Set(list.map((m) => m.category)))[0] ?? "");
      });
  }, [outletId]);

  const categories = useMemo(() => Array.from(new Set(menus.map((m) => m.category))), [menus]);
  const visible = menus.filter((m) => (search ? m.name.toLowerCase().includes(search.toLowerCase()) : m.category === cat));

  const menuMap = useMemo(() => new Map(menus.map((m) => [m.id, m])), [menus]);
  const items = Object.values(lines).filter((l) => l.qty > 0);
  const subtotal = items.reduce((s, l) => s + (menuMap.get(l.menuId)?.price ?? 0) * l.qty, 0);
  const total = Math.max(0, subtotal - discount + tax);

  const setQty = (menuId: string, delta: number) =>
    setLines((prev) => {
      const cur = prev[menuId] ?? { menuId, qty: 0, notes: "" };
      const qty = Math.max(0, cur.qty + delta);
      return { ...prev, [menuId]: { ...cur, qty } };
    });
  const setNotes = (menuId: string, notes: string) =>
    setLines((prev) => ({ ...prev, [menuId]: { ...(prev[menuId] ?? { menuId, qty: 1, notes: "" }), notes } }));

  async function submit() {
    setErr("");
    if (items.length === 0) return setErr("Pilih minimal satu menu.");
    setSaving(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, items: items.map((l) => ({ menuId: l.menuId, qty: l.qty, notes: l.notes })), discount, tax, note }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setErr(d.error || "Gagal membuat order.");
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-sumi/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-washi h-full flex flex-col animate-fade-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="bg-sumi text-washi px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-round text-kin-light text-xs tracking-widest">注文作成</p>
            <h2 className="font-display text-xl font-extrabold">Buat Order · {buyerName}</h2>
          </div>
          <button onClick={onClose} className="text-2xl text-washi/60 hover:text-washi">✕</button>
        </div>

        {/* menu picker */}
        <div className="px-4 pt-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari menu…"
            className="w-full rounded-xl border border-sumi/15 bg-paper px-4 py-2.5 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
          />
          {!search && (
            <div className="flex gap-2 overflow-x-auto scroll-thin py-3">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-round font-bold transition ${cat === c ? "bg-shu text-white" : "bg-paper text-sumi/60 ring-1 ring-sumi/10"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin px-4 space-y-2 pb-4">
          {visible.map((m) => {
            const qty = lines[m.id]?.qty ?? 0;
            return (
              <div key={m.id} className="paper-card rounded-xl p-2.5 flex items-center gap-3">
                <MenuImage image={m.image} category={m.category} className="h-12 w-12 rounded-lg shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-round font-bold text-sm truncate">{m.name}</p>
                  <p className="text-xs text-shu font-bold">{rupiah(m.price)}</p>
                  {qty > 0 && (
                    <input
                      value={lines[m.id]?.notes ?? ""}
                      onChange={(e) => setNotes(m.id, e.target.value)}
                      placeholder="Catatan (opsional)…"
                      className="mt-1 w-full text-xs rounded-md border border-sumi/10 bg-washi/50 px-2 py-1 outline-none focus:border-shu"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {qty > 0 && (
                    <>
                      <button onClick={() => setQty(m.id, -1)} className="h-7 w-7 rounded-lg bg-sumi/10 text-sumi font-bold btn-press">−</button>
                      <span className="w-5 text-center font-display font-bold text-sm">{qty}</span>
                    </>
                  )}
                  <button onClick={() => setQty(m.id, 1)} className="h-7 w-7 rounded-lg bg-shu text-white font-bold btn-press">+</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* summary footer */}
        <div className="border-t border-sumi/10 bg-paper p-4 space-y-3">
          {items.length > 0 && (
            <div className="max-h-24 overflow-y-auto scroll-thin space-y-1">
              {items.map((l) => {
                const m = menuMap.get(l.menuId)!;
                return (
                  <div key={l.menuId} className="flex justify-between text-xs text-sumi/60">
                    <span>{l.qty}× {m.name}{l.notes ? ` · ${l.notes}` : ""}</span>
                    <span className="font-semibold">{rupiah(m.price * l.qty)}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-sumi/50">
              Diskon (Rp)
              <input type="number" value={discount || ""} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} className="mt-0.5 w-full rounded-lg border border-sumi/15 bg-washi/50 px-2 py-1.5 text-sm outline-none focus:border-shu" />
            </label>
            <label className="text-xs text-sumi/50">
              Pajak/Biaya (Rp)
              <input type="number" value={tax || ""} onChange={(e) => setTax(Math.max(0, Number(e.target.value)))} className="mt-0.5 w-full rounded-lg border border-sumi/15 bg-washi/50 px-2 py-1.5 text-sm outline-none focus:border-shu" />
            </label>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Catatan untuk pembeli (opsional)…"
            className="w-full rounded-lg border border-sumi/15 bg-washi/50 px-3 py-2 text-sm outline-none focus:border-shu"
          />
          {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-sumi/50">Total ({items.reduce((s, l) => s + l.qty, 0)} item)</p>
              <p className="font-display text-2xl font-extrabold text-shu">{rupiah(total)}</p>
            </div>
            <Button onClick={submit} disabled={saving || items.length === 0} className="py-3 px-6">
              {saving ? "Membuat…" : "Buat Order →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
