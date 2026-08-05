"use client";
import { useEffect, useMemo, useState } from "react";
import { Button, MenuImage } from "@/components/ui";
import { rupiah } from "@/lib/format";
import { lineKey } from "@/lib/cart";
import VariantPicker, { OptionGroup, SelectedOption } from "@/components/VariantPicker";

type Menu = { id: string; name: string; category: string; price: number; image: string | null; isAvailable: boolean; optionGroups: OptionGroup[] };
type Line = { key: string; menuId: string; qty: number; notes: string; options: SelectedOption[] };

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
  const [scheduledFor, setScheduledFor] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [variantMenu, setVariantMenu] = useState<Menu | null>(null);

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
  const unitPrice = (l: Line) => (menuMap.get(l.menuId)?.price ?? 0) + l.options.reduce((s, o) => s + o.priceDelta, 0);
  const subtotal = items.reduce((s, l) => s + unitPrice(l) * l.qty, 0);
  const total = Math.max(0, subtotal - discount + tax);

  const setQty = (menuId: string, delta: number) =>
    setLines((prev) => {
      const key = lineKey(menuId, []);
      const cur = prev[key] ?? { key, menuId, qty: 0, notes: "", options: [] };
      const qty = Math.max(0, cur.qty + delta);
      return { ...prev, [key]: { ...cur, qty } };
    });
  const setNotes = (menuId: string, notes: string) =>
    setLines((prev) => {
      const key = lineKey(menuId, []);
      return { ...prev, [key]: { ...(prev[key] ?? { key, menuId, qty: 1, notes: "", options: [] }), notes } };
    });
  const setLineQty = (key: string, qty: number) =>
    setLines((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], qty: Math.max(0, qty) } } : prev));
  const addVariantLine = (menuId: string, options: SelectedOption[]) => {
    const key = lineKey(menuId, options);
    setLines((prev) => {
      const cur = prev[key];
      return { ...prev, [key]: { key, menuId, qty: (cur?.qty ?? 0) + 1, notes: cur?.notes ?? "", options } };
    });
  };

  async function submit() {
    setErr("");
    if (items.length === 0) return setErr("Pilih minimal satu menu.");
    setSaving(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        items: items.map((l) => ({ menuId: l.menuId, qty: l.qty, notes: l.notes, optionIds: l.options.map((o) => o.optionId) })),
        discount,
        tax,
        note,
        scheduledFor: scheduledFor || undefined,
      }),
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
            <p className="font-round text-kin-light text-xs tracking-widest">BUAT PESANAN</p>
            <h2 className="font-display text-xl font-bold">Buat Order · {buyerName}</h2>
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
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-round font-semibold transition ${cat === c ? "bg-shu text-white" : "bg-paper text-sumi/60 ring-1 ring-sumi/10"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin px-4 space-y-2 pb-4">
          {visible.map((m) => {
            const hasVariants = m.optionGroups.length > 0;
            const plainQty = lines[lineKey(m.id, [])]?.qty ?? 0;
            const totalQty = hasVariants ? items.filter((l) => l.menuId === m.id).reduce((s, l) => s + l.qty, 0) : plainQty;
            return (
              <div key={m.id} className="paper-card rounded-xl p-2.5 flex items-center gap-3">
                <MenuImage image={m.image} category={m.category} className="h-12 w-12 rounded-lg shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-round font-semibold text-sm truncate">{m.name}</p>
                  <p className="text-xs text-shu font-semibold">{rupiah(m.price)}</p>
                  {!hasVariants && plainQty > 0 && (
                    <input
                      value={lines[lineKey(m.id, [])]?.notes ?? ""}
                      onChange={(e) => setNotes(m.id, e.target.value)}
                      placeholder="Catatan (opsional)…"
                      className="mt-1 w-full text-xs rounded-md border border-sumi/10 bg-washi/50 px-2 py-1 outline-none focus:border-shu"
                    />
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {hasVariants ? (
                    <button onClick={() => setVariantMenu(m)} className="rounded-lg bg-shu text-white text-xs font-semibold px-3 py-2 btn-press">
                      {totalQty > 0 ? `+ (${totalQty})` : "+ Varian"}
                    </button>
                  ) : (
                    <>
                      {plainQty > 0 && (
                        <>
                          <button onClick={() => setQty(m.id, -1)} className="h-7 w-7 rounded-lg bg-sumi/10 text-sumi font-semibold btn-press">−</button>
                          <span className="w-5 text-center font-display font-semibold text-sm">{plainQty}</span>
                        </>
                      )}
                      <button onClick={() => setQty(m.id, 1)} className="h-7 w-7 rounded-lg bg-shu text-white font-semibold btn-press">+</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* summary footer */}
        <div className="border-t border-sumi/10 bg-paper p-4 space-y-3">
          {items.length > 0 && (
            <div className="max-h-28 overflow-y-auto scroll-thin space-y-1">
              {items.map((l) => {
                const m = menuMap.get(l.menuId)!;
                return (
                  <div key={l.key} className="flex items-center justify-between gap-2 text-xs text-sumi/60">
                    <span className="truncate">
                      {l.qty}× {m.name}
                      {l.options.length > 0 && ` · ${l.options.map((o) => o.name).join(", ")}`}
                      {l.notes ? ` · ${l.notes}` : ""}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="font-semibold">{rupiah(unitPrice(l) * l.qty)}</span>
                      <button onClick={() => setLineQty(l.key, l.qty - 1)} className="h-5 w-5 rounded bg-sumi/10 text-sumi font-semibold text-[10px]">−</button>
                      <button onClick={() => setLineQty(l.key, l.qty + 1)} className="h-5 w-5 rounded bg-shu/10 text-shu font-semibold text-[10px]">+</button>
                    </span>
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
          <label className="block">
            <span className="text-xs text-sumi/50">🕒 Jadwalkan untuk nanti (opsional)</span>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-sumi/15 bg-washi/50 px-3 py-2 text-sm outline-none focus:border-shu"
            />
          </label>
          {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-sumi/50">Total ({items.reduce((s, l) => s + l.qty, 0)} item)</p>
              <p className="font-display text-2xl font-bold text-shu">{rupiah(total)}</p>
            </div>
            <Button onClick={submit} disabled={saving || items.length === 0} className="py-3 px-6">
              {saving ? "Membuat…" : "Buat Order →"}
            </Button>
          </div>
        </div>
      </div>

      {variantMenu && (
        <VariantPicker
          menuName={variantMenu.name}
          basePrice={variantMenu.price}
          groups={variantMenu.optionGroups}
          onCancel={() => setVariantMenu(null)}
          onConfirm={(selected) => {
            addVariantLine(variantMenu.id, selected);
            setVariantMenu(null);
          }}
        />
      )}
    </div>
  );
}
