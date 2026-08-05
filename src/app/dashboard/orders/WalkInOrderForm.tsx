"use client";
import { useEffect, useMemo, useState } from "react";
import { MenuImage } from "@/components/ui";
import { rupiah } from "@/lib/format";
import { lineKey } from "@/lib/cart";
import VariantPicker, { OptionGroup, SelectedOption } from "@/components/VariantPicker";
import {
  IconSearch, IconX, IconPlus, IconMinus, IconTrash,
  IconCash, IconQrCode, IconUtensils, IconReceipt, IconChevronLeft, IconChevronRight,
} from "@/components/icons";

type Menu = { id: string; name: string; category: string; price: number; image: string | null; isAvailable: boolean; optionGroups: OptionGroup[] };
type Outlet = { id: string; name: string };
type Line = { key: string; menuId: string; qty: number; options: SelectedOption[] };

const ALL = "__all__";
const DEFAULT_CATS = ["Katsu", "Donburi", "Snack", "Drink", "Extra"];

/** Known categories keep their order; owner-created ones follow, alphabetically. */
function orderCategories(found: string[]) {
  const known = DEFAULT_CATS.filter((c) => found.includes(c));
  const extra = found.filter((c) => !DEFAULT_CATS.includes(c)).sort((a, b) => a.localeCompare(b, "id"));
  return [...known, ...extra];
}

const field =
  "mt-1 w-full rounded-lg border border-gray-4 bg-white px-3 py-2 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

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
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>(ALL);
  const [step, setStep] = useState<"menu" | "order">("menu");

  useEffect(() => {
    if (!outletId) return;
    fetch(`/api/menu?outletId=${outletId}`)
      .then((r) => r.json())
      .then((d) => setMenus((d.menus ?? []).filter((m: Menu) => m.isAvailable)));
  }, [outletId]);

  // Derived from real data — a custom category must never hide its menus.
  const cats = useMemo(() => orderCategories(Array.from(new Set(menus.map((m) => m.category)))), [menus]);

  const query = q.trim().toLowerCase();
  const visible = useMemo(
    () =>
      menus.filter((m) => {
        if (cat !== ALL && m.category !== cat) return false;
        if (!query) return true;
        return m.name.toLowerCase().includes(query) || m.category.toLowerCase().includes(query);
      }),
    [menus, cat, query]
  );

  const menuMap = useMemo(() => new Map(menus.map((m) => [m.id, m])), [menus]);
  const items = Object.values(lines).filter((l) => l.qty > 0);
  const unitPrice = (l: Line) => (menuMap.get(l.menuId)?.price ?? 0) + l.options.reduce((s, o) => s + o.priceDelta, 0);
  const total = items.reduce((s, l) => s + unitPrice(l) * l.qty, 0);
  const totalQty = items.reduce((s, l) => s + l.qty, 0);

  function setQtyFor(menuId: string, nextQty: number) {
    const key = lineKey(menuId, []);
    setLines((prev) => {
      const cur = prev[key] ?? { key, menuId, qty: 0, options: [] };
      return { ...prev, [key]: { ...cur, qty: Math.max(0, nextQty) } };
    });
  }
  function setLineQty(key: string, nextQty: number) {
    setLines((prev) => (prev[key] ? { ...prev, [key]: { ...prev[key], qty: Math.max(0, nextQty) } } : prev));
  }
  function removeLine(key: string) {
    setLines((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }
  function addVariantLine(menuId: string, options: SelectedOption[]) {
    const key = lineKey(menuId, options);
    setLines((prev) => ({ ...prev, [key]: { key, menuId, qty: (prev[key]?.qty ?? 0) + 1, options } }));
  }

  async function submit() {
    setErr("");
    if (!buyerName.trim()) { setStep("order"); return setErr("Nama pembeli wajib diisi."); }
    if (items.length === 0) { setStep("menu"); return setErr("Pilih minimal satu menu."); }
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
    <div className="fixed inset-0 z-50 sm:grid sm:place-items-center bg-overlay-2 backdrop-blur-sm sm:p-6" onClick={onClose}>
      {/* Full-bleed sheet on phones. 100dvh, not vh: mobile browsers count the
          collapsing toolbar in vh, which chops the bottom off the action bar. */}
      <div
        className="flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-xl sm:h-[94vh] sm:rounded-2xl sm:animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------- header (fixed) ---------- */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-4 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-white">
              <IconReceipt className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-dark-1">Order Walk-in</h2>
              <p className="truncate text-xs text-gray-5">Buat pesanan langsung di kasir</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {outlets.length > 1 && (
              <select
                value={outletId}
                onChange={(e) => setOutletId(e.target.value)}
                className="hidden sm:block rounded-lg border border-gray-4 bg-white px-3 py-2 text-sm font-medium text-dark-1 outline-none focus:border-primary"
              >
                {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            )}
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-5 hover:bg-gray-3 hover:text-dark-1 transition"
            >
              <IconX className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* ---------- body ---------- */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* menu picker — one of two steps on phones, left column on desktop */}
          <section
            className={`min-h-0 flex-1 flex-col border-gray-4 lg:flex lg:border-r ${
              step === "menu" ? "flex" : "hidden"
            }`}
          >
            <div className="shrink-0 space-y-3 p-4">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-2" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari menu…"
                  className="w-full rounded-lg border border-gray-4 bg-white py-2.5 pl-9 pr-9 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
                    aria-label="Hapus pencarian"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-2 hover:text-dark-1"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {[[ALL, "Semua"] as const, ...cats.map((c) => [c, c] as const)].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setCat(key)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      cat === key ? "bg-primary text-white" : "border border-gray-4 text-gray-8 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-4 pb-4">
              {menus.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-5">Belum ada menu tersedia di outlet ini.</p>
              ) : visible.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gray-3 text-gray-2">
                    <IconUtensils className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-dark-2">Menu tidak ditemukan</p>
                  <p className="mt-1 text-xs text-gray-5">Coba kata kunci atau kategori lain.</p>
                </div>
              ) : (
                // Single column on purpose: the qty control needs a fixed slot,
                // and two columns squeezed it until it clipped off the card.
                <div className="grid gap-2">
                  {visible.map((m) => {
                    const hasVariants = m.optionGroups.length > 0;
                    const plainQty = lines[lineKey(m.id, [])]?.qty ?? 0;
                    const inCart = hasVariants
                      ? items.filter((l) => l.menuId === m.id).reduce((s, l) => s + l.qty, 0)
                      : plainQty;
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center gap-3 rounded-lg border bg-white p-2.5 transition ${
                          inCart > 0 ? "border-primary bg-primary-light/40" : "border-gray-4"
                        }`}
                      >
                        {/* action first — always visible, never pushed off the edge */}
                        <div className="flex w-[104px] shrink-0 items-center justify-start gap-1.5">
                          {hasVariants ? (
                            <button
                              type="button"
                              onClick={() => setVariantMenu(m)}
                              className="w-full rounded-lg border border-primary bg-white px-2 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition"
                            >
                              {inCart > 0 ? `Varian (${inCart})` : "Varian"}
                            </button>
                          ) : plainQty === 0 ? (
                            <button
                              type="button"
                              onClick={() => setQtyFor(m.id, 1)}
                              aria-label={`Tambah ${m.name}`}
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary bg-white py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition"
                            >
                              <IconPlus className="h-4 w-4" /> Tambah
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setQtyFor(m.id, plainQty - 1)}
                                aria-label="Kurangi"
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gray-4 text-gray-8 hover:border-primary hover:text-primary transition"
                              >
                                <IconMinus className="h-4 w-4" />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold text-dark-1 tabular-nums">{plainQty}</span>
                              <button
                                type="button"
                                onClick={() => setQtyFor(m.id, plainQty + 1)}
                                aria-label="Tambah"
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-primary bg-primary text-white hover:bg-primary-hover transition"
                              >
                                <IconPlus className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>

                        <MenuImage image={m.image} category={m.category} className="h-11 w-11 shrink-0 rounded-lg" />

                        {/* Price sits under the name, not in a right-hand column —
                            on a phone that column got pushed off the card. */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-dark-2">{m.name}</p>
                          <p className="text-sm font-semibold text-dark-1 tabular-nums">
                            {rupiah(m.price)}
                            <span className="ml-1.5 text-xs font-normal text-gray-5">{m.category}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* phone-only step bar: shows the running total and advances */}
            <div className="shrink-0 border-t border-gray-4 bg-white p-3 lg:hidden">
              <button
                onClick={() => setStep("order")}
                disabled={items.length === 0}
                className="btn-press flex w-full items-center justify-between gap-3 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:bg-gray-4 disabled:text-gray-2 disabled:shadow-none"
              >
                <span className="tabular-nums">
                  {totalQty > 0 ? `${totalQty} item · ${rupiah(total)}` : "Belum ada item"}
                </span>
                <span className="flex items-center gap-1">
                  Lanjut <IconChevronRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          </section>

          {/* order panel */}
          <aside
            className={`min-h-0 flex-1 flex-col bg-gray-3 lg:flex lg:w-[360px] lg:flex-none ${
              step === "order" ? "flex" : "hidden"
            }`}
          >
            {/* back to the picker — phones only, desktop shows both at once */}
            <button
              onClick={() => setStep("menu")}
              className="flex shrink-0 items-center gap-2 border-b border-gray-4 bg-white px-4 py-3 text-sm font-semibold text-gray-8 hover:text-primary transition lg:hidden"
            >
              <IconChevronLeft className="h-4 w-4" />
              Pilih Menu
            </button>

            {/* One scroll region: customer fields, items and payment share the
                space, so a long order actually gets room to breathe. */}
            <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
              <div className="border-b border-gray-4 bg-white p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-8">Nama Pembeli *</span>
                    <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Nama pelanggan" className={field} />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-8">No. HP</span>
                    <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="08xxxxxxxxxx" inputMode="tel" className={field} />
                  </label>
                </div>
                {outlets.length > 1 && (
                  <label className="mt-3 block sm:hidden">
                    <span className="text-xs font-semibold text-gray-8">Outlet</span>
                    <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className={field}>
                      {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </label>
                )}
              </div>

              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-5">Pesanan</p>
                {totalQty > 0 && <span className="text-xs font-semibold text-gray-8 tabular-nums">{totalQty} item</span>}
              </div>

              <div className="px-4 pb-4">
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-5">Belum ada item dipilih.</p>
              ) : (
                <div className="space-y-2">
                  {items.map((l) => {
                    const m = menuMap.get(l.menuId);
                    if (!m) return null;
                    return (
                      <div key={l.key} className="rounded-lg border border-gray-4 bg-white p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-dark-2">{m.name}</p>
                            {l.options.length > 0 && (
                              <p className="truncate text-[11px] text-gray-5">{l.options.map((o) => o.name).join(", ")}</p>
                            )}
                          </div>
                          <button
                            onClick={() => removeLine(l.key)}
                            aria-label={`Hapus ${m.name}`}
                            className="shrink-0 text-gray-2 hover:text-primary transition"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setLineQty(l.key, l.qty - 1)}
                              aria-label="Kurangi"
                              className="grid h-7 w-7 place-items-center rounded-md border border-gray-4 text-gray-8 hover:border-primary hover:text-primary transition"
                            >
                              <IconMinus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-5 text-center text-sm font-semibold text-dark-1 tabular-nums">{l.qty}</span>
                            <button
                              onClick={() => setLineQty(l.key, l.qty + 1)}
                              aria-label="Tambah"
                              className="grid h-7 w-7 place-items-center rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition"
                            >
                              <IconPlus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-dark-1 tabular-nums">{rupiah(unitPrice(l) * l.qty)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>

              {/* payment lives in the scroll area — it is chosen once, unlike
                  the total and the confirm button which must stay reachable */}
              <div className="border-t border-gray-4 bg-white p-4">
                <span className="text-xs font-semibold text-gray-8">Metode Pembayaran</span>
                <div className="mt-1.5 flex gap-2">
                  {([["CASH", "Tunai", IconCash], ["QRIS", "QRIS", IconQrCode]] as const).map(([key, label, Icon]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaymentMethod(key)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                        paymentMethod === key
                          ? "bg-primary text-white"
                          : "border border-gray-4 bg-white text-gray-8 hover:border-primary hover:text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-gray-5">
                  {paymentMethod === "CASH"
                    ? "Order langsung lunas, masuk antrian dapur, struk tercetak."
                    : "Order menunggu upload bukti QRIS seperti order online."}
                </p>
              </div>
            </div>

            {/* ---------- compact action bar (always visible) ---------- */}
            <div className="shrink-0 border-t border-gray-4 bg-white p-3">
              {err && (
                <p className="mb-2 rounded-lg bg-primary-light px-3 py-2 text-sm font-medium text-primary">{err}</p>
              )}
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-medium text-gray-5">Total</span>
                <span className="text-xl font-semibold tracking-tight text-dark-1 tabular-nums">{rupiah(total)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-gray-4 px-4 py-2.5 text-sm font-semibold text-gray-8 hover:bg-gray-3 transition"
                >
                  Batal
                </button>
                <button
                  onClick={submit}
                  disabled={saving || items.length === 0}
                  className="btn-press flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:bg-gray-4 disabled:text-gray-2 disabled:shadow-none"
                >
                  {saving ? "Menyimpan…" : "Buat Order"}
                </button>
              </div>
            </div>
          </aside>
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
