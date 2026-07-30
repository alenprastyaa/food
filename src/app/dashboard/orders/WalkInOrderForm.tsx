"use client";
import { useEffect, useMemo, useState } from "react";
import { Button, MenuImage } from "@/components/ui";
import { rupiah } from "@/lib/format";
import { lineKey } from "@/lib/cart";
import VariantPicker, { OptionGroup, SelectedOption } from "@/components/VariantPicker";

type Menu = { id: string; name: string; category: string; price: number; image: string | null; isAvailable: boolean; optionGroups: OptionGroup[] };
type Outlet = { id: string; name: string };
type Line = { key: string; menuId: string; qty: number; options: SelectedOption[] };

const CATS = ["Katsu", "Donburi", "Snack", "Drink", "Extra"];

export default function WalkInOrderForm({ outlets, onClose, onCreated }: { outlets: Outlet[]; onClose: () => void; onCreated: () => void }) {
  const [outletId, setOutletId] = useState(outlets[0]?.id ?? "");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [lines, setLines] = useState<Record<string, Line>>({});
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [variantMenu, setVariantMenu] = useState<Menu | null>(null);

  useEffect(() => {
    if (!outletId) return;
    fetch(`/api/menu?outletId=${outletId}`)
      .then((r) => r.json())
      .then((d) => setMenus((d.menus ?? []).filter((m: Menu) => m.isAvailable)));
  }, [outletId]);

  const byCat = useMemo(() => {
    const g: Record<string, Menu[]> = {};
    for (const m of menus) (g[m.category] ??= []).push(m);
    return g;
  }, [menus]);

  const menuMap = useMemo(() => new Map(menus.map((m) => [m.id, m])), [menus]);
  const items = Object.values(lines).filter((l) => l.qty > 0);
  const unitPrice = (l: Line) => (menuMap.get(l.menuId)?.price ?? 0) + l.options.reduce((s, o) => s + o.priceDelta, 0);
  const total = items.reduce((s, l) => s + unitPrice(l) * l.qty, 0);

  function setQtyFor(menuId: string, q: number) {
    const key = lineKey(menuId, []);
    setLines((prev) => {
      const cur = prev[key] ?? { key, menuId, qty: 0, options: [] };
      return { ...prev, [key]: { ...cur, qty: Math.max(0, q) } };
    });
  }
  function setLineQty(key: string, q: number) {
    setLines((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], qty: Math.max(0, q) } } : prev));
  }
  function addVariantLine(menuId: string, options: SelectedOption[]) {
    const key = lineKey(menuId, options);
    setLines((prev) => {
      const cur = prev[key];
      return { ...prev, [key]: { key, menuId, qty: (cur?.qty ?? 0) + 1, options } };
    });
  }

  async function submit() {
    setErr("");
    if (!buyerName.trim()) return setErr("Nama pembeli wajib diisi.");
    if (items.length === 0) return setErr("Pilih minimal satu menu.");
    setSaving(true);
    const res = await fetch("/api/orders/walk-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId,
        buyerName,
        buyerPhone,
        paymentMethod,
        items: items.map((l) => ({ menuId: l.menuId, qty: l.qty, optionIds: l.options.map((o) => o.optionId) })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setErr(d.error || "Gagal membuat order.");
    }
    if (paymentMethod === "CASH") {
      const d = await res.json().catch(() => null);
      if (d?.order?.id) window.open(`/print/orders/${d.order.id}/receipt`, "_blank");
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sumi/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="paper-card rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto scroll-thin animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-extrabold mb-4">Order Walk-in <span className="font-round text-shu/60 text-sm">来店注文</span></h2>

        {outlets.length > 1 && (
          <div className="mb-3">
            <span className="text-xs font-semibold text-sumi/60">Outlet</span>
            <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="in">
              {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <label className="block">
            <span className="text-xs font-semibold text-sumi/60">Nama Pembeli</span>
            <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Nama pelanggan" className="in" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-sumi/60">Nomor HP (opsional)</span>
            <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="08xxxxxxxxxx" className="in" />
          </label>
        </div>

        <div className="space-y-4 max-h-[40vh] overflow-y-auto scroll-thin pr-1">
          {CATS.filter((c) => byCat[c]?.length).map((cat) => (
            <div key={cat}>
              <h3 className="font-round font-bold text-sm text-sumi/70 mb-2">{cat}</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {byCat[cat].map((m) => {
                  const hasVariants = m.optionGroups.length > 0;
                  const plainQty = lines[lineKey(m.id, [])]?.qty ?? 0;
                  const totalQty = hasVariants ? items.filter((l) => l.menuId === m.id).reduce((s, l) => s + l.qty, 0) : plainQty;
                  return (
                    <div key={m.id} className="paper-card rounded-xl p-2.5 flex items-center gap-2.5">
                      <MenuImage image={m.image} category={m.category} className="h-11 w-11 rounded-lg shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-round font-bold truncate">{m.name}</p>
                        <p className="text-xs text-shu font-bold">{rupiah(m.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasVariants ? (
                          <button type="button" onClick={() => setVariantMenu(m)} className="rounded-lg bg-shu text-white text-xs font-bold px-3 py-1.5">
                            {totalQty > 0 ? `+ (${totalQty})` : "+ Varian"}
                          </button>
                        ) : (
                          <>
                            <button type="button" onClick={() => setQtyFor(m.id, plainQty - 1)} className="h-7 w-7 rounded-lg bg-sumi/10 text-sumi/60 font-bold">-</button>
                            <span className="w-5 text-center text-sm font-bold">{plainQty}</span>
                            <button type="button" onClick={() => setQtyFor(m.id, plainQty + 1)} className="h-7 w-7 rounded-lg bg-shu/10 text-shu font-bold">+</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {menus.length === 0 && <p className="text-sm text-sumi/40">Belum ada menu tersedia di outlet ini.</p>}
        </div>

        <div className="mt-4 pt-4 border-t border-sumi/10 space-y-3">
          {items.some((l) => l.options.length > 0) && (
            <div className="max-h-24 overflow-y-auto scroll-thin space-y-1">
              {items.map((l) => {
                const m = menuMap.get(l.menuId);
                if (!m || l.options.length === 0) return null;
                return (
                  <div key={l.key} className="flex items-center justify-between gap-2 text-xs text-sumi/60">
                    <span className="truncate">{l.qty}× {m.name} · {l.options.map((o) => o.name).join(", ")}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="font-semibold">{rupiah(unitPrice(l) * l.qty)}</span>
                      <button onClick={() => setLineQty(l.key, l.qty - 1)} className="h-5 w-5 rounded bg-sumi/10 text-sumi font-bold text-[10px]">−</button>
                      <button onClick={() => setLineQty(l.key, l.qty + 1)} className="h-5 w-5 rounded bg-shu/10 text-shu font-bold text-[10px]">+</button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm font-round font-bold text-sumi/60">Total</span>
            <span className="font-display text-xl font-extrabold text-shu">{rupiah(total)}</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-sumi/60">Metode Pembayaran</span>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-round font-bold transition ${paymentMethod === "CASH" ? "bg-shu text-white" : "bg-sumi/5 text-sumi/60"}`}
              >
                💵 Tunai
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("QRIS")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-round font-bold transition ${paymentMethod === "QRIS" ? "bg-shu text-white" : "bg-sumi/5 text-sumi/60"}`}
              >
                🏧 QRIS
              </button>
            </div>
            <p className="text-[11px] text-sumi/40 mt-1">
              {paymentMethod === "CASH" ? "Order langsung lunas & masuk antrian dapur." : "Order menunggu upload bukti QRIS seperti order online."}
            </p>
          </div>
          {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={saving} className="flex-1">{saving ? "Menyimpan…" : "Buat Order"}</Button>
            <Button variant="ghost" onClick={onClose}>Batal</Button>
          </div>
        </div>
      </div>
      <style>{`.in{margin-top:.25rem;width:100%;border-radius:.75rem;border:1px solid rgba(23,40,46,.15);background:rgba(247,241,227,.5);padding:.6rem .9rem;font-size:.875rem;outline:none}.in:focus{border-color:var(--color-shu);box-shadow:0 0 0 2px rgba(214,72,63,.15)}`}</style>

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
