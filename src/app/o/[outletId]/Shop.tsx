"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, MenuImage, Logo } from "@/components/ui";
import { rupiah } from "@/lib/format";
import { useCart } from "@/lib/cart";
import VariantPicker, { OptionGroup } from "@/components/VariantPicker";

type Menu = { id: string; name: string; category: string; description: string | null; price: number; image: string | null; optionGroups: OptionGroup[] };

const ALL = "__all__";

const CATEGORY_ICON: Record<string, string> = {
  Katsu: "🍤",
  Donburi: "🍱",
  Snack: "🍟",
  Drink: "🥤",
  Extra: "🧂",
};

export default function Shop({
  outlet,
  menus,
  categories,
  rating,
}: {
  outlet: { id: string; name: string; address: string; phone: string };
  menus: Menu[];
  categories: string[];
  rating?: { avg: number; count: number } | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cart = useCart(outlet.id);
  const [cat, setCat] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [variantMenu, setVariantMenu] = useState<Menu | null>(null);

  const menuMap = useMemo(() => new Map(menus.map((m) => [m.id, m])), [menus]);
  const subtotal = cart.items.reduce((s, l) => s + ((menuMap.get(l.menuId)?.price ?? 0) + l.options.reduce((a, o) => a + o.priceDelta, 0)) * l.qty, 0);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      menus.filter((m) => {
        if (cat !== ALL && m.category !== cat) return false;
        if (!q) return true;
        return m.name.toLowerCase().includes(q) || (m.description ?? "").toLowerCase().includes(q);
      }),
    [menus, cat, q]
  );

  // Group into sections so "Semua Menu" reads as one list per category.
  const sections = useMemo(
    () => categories.map((c) => ({ category: c, items: visible.filter((m) => m.category === c) })).filter((s) => s.items.length > 0),
    [categories, visible]
  );

  function addToCart(m: Menu) {
    if (m.optionGroups.length > 0) setVariantMenu(m);
    else cart.addLine(m.id, []);
  }

  useEffect(() => {
    const add = searchParams.get("add");
    if (!add || !cart.hydrated) return;
    const menu = menuMap.get(add);
    if (!menu) return;
    addToCart(menu);
    setCat(menu.category);
    if (menu.optionGroups.length === 0) setCartOpen(true);
    router.replace(`/o/${outlet.id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, cart.hydrated, menuMap]);

  return (
    <div className="space-y-4 pb-28">
      {/* outlet header */}
      <div className="rounded-xl bg-white border border-gray-6 p-5">
        <h1 className="text-2xl font-semibold text-dark-1 tracking-tight">{outlet.name}</h1>
        <p className="text-dark-2 text-sm mt-1.5">{outlet.address}</p>
        <div className="flex items-center gap-3 mt-1 text-sm">
          {rating && (
            <span className="text-gray-8 font-medium">
              <span className="text-warning-light">★</span> {rating.avg.toFixed(1)}
              <span className="text-gray-8 font-normal"> ({rating.count} ulasan)</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setReserveOpen(true)}
            className="text-xs font-semibold text-primary bg-white border border-primary rounded-lg px-3 py-2 hover:bg-primary hover:text-white transition"
          >
            Reservasi Meja
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            className="text-xs font-semibold text-gray-8 bg-white border border-gray-6 rounded-lg px-3 py-2 hover:bg-gray-3 transition"
          >
            Tanya Kasir
          </button>
        </div>
      </div>

      {/* search + category rail */}
      <div className="sticky top-14 z-20 -mx-4 px-4 py-3 bg-gray-3/95 backdrop-blur space-y-3">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-2 text-sm">🔎</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari makanan atau minuman…"
            className="w-full h-11 rounded-lg border border-gray-6 bg-white pl-10 pr-4 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
          />
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar whitespace-nowrap">
          <CategoryChip
            active={cat === ALL}
            icon="🍽️"
            label="Semua Menu"
            count={`${menus.length} Menu`}
            onClick={() => setCat(ALL)}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c}
              active={cat === c}
              icon={CATEGORY_ICON[c] ?? "🍽️"}
              label={c}
              count={`${menus.filter((m) => m.category === c).length} Menu`}
              onClick={() => setCat(c)}
            />
          ))}
        </div>
      </div>

      {/* menu sections */}
      {sections.length === 0 ? (
        <div className="section-card text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-dark-2">Menu tidak ditemukan</p>
          <p className="text-sm text-gray-5 mt-1">Coba kata kunci atau kategori lain.</p>
        </div>
      ) : (
        sections.map((s) => (
          <div key={s.category} className="section-card">
            <h3 className="section-heading text-lg font-semibold text-dark-2">{s.category}</h3>
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 pt-6 md:grid-cols-3">
              {s.items.map((m) => {
                const hasVariants = m.optionGroups.length > 0;
                const qty = hasVariants
                  ? cart.items.filter((l) => l.menuId === m.id).reduce((sum, l) => sum + l.qty, 0)
                  : cart.lines[m.id]?.qty ?? 0;
                return (
                  <div key={m.id} className="flex h-full flex-col min-w-0">
                    <div className="relative flex h-40 justify-center overflow-hidden rounded-md bg-gray-3 md:h-48">
                      <MenuImage image={m.image} category={m.category} big className="h-full w-full" />
                    </div>

                    <div className="flex flex-1 flex-col justify-between pt-2">
                      <div>
                        <h4 className="line-clamp-1 pb-1 text-sm font-semibold text-dark-2">{m.name}</h4>
                        {m.description && <p className="mb-1 line-clamp-2 text-xs text-dark-2">{m.description}</p>}
                        <div className="text-xs text-dark-1">
                          <span className="font-semibold">{rupiah(m.price)}</span>
                          {hasVariants && <span className="text-gray-8 font-normal"> • ada varian</span>}
                        </div>
                      </div>

                      <div className="mt-4">
                        {hasVariants ? (
                          <button
                            onClick={() => setVariantMenu(m)}
                            className="btn-press h-9 w-full rounded-lg border border-primary bg-white text-xs font-semibold text-primary shadow-sm hover:bg-primary hover:text-white transition"
                          >
                            {qty > 0 ? `${qty} Item` : "Pilih Varian"}
                          </button>
                        ) : qty === 0 ? (
                          <button
                            onClick={() => cart.addLine(m.id, [])}
                            className="btn-press h-9 w-full rounded-lg border border-primary bg-white text-xs font-semibold text-primary shadow-sm hover:bg-primary hover:text-white transition"
                          >
                            Tambah
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => cart.setQty(m.id, qty - 1)}
                              aria-label="Kurangi"
                              className="h-7 w-7 rounded-full border border-primary text-lg font-semibold leading-none text-primary hover:bg-primary hover:text-white transition"
                            >
                              −
                            </button>
                            <span className="w-7 text-center text-sm font-semibold text-dark-1">{qty}</span>
                            <button
                              onClick={() => cart.setQty(m.id, qty + 1)}
                              aria-label="Tambah"
                              className="h-7 w-7 rounded-full border border-primary text-lg font-semibold leading-none text-primary hover:bg-primary hover:text-white transition"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {variantMenu && (
        <VariantPicker
          menuName={variantMenu.name}
          description={variantMenu.description}
          basePrice={variantMenu.price}
          groups={variantMenu.optionGroups}
          confirmLabel="Tambah ke Keranjang"
          onCancel={() => setVariantMenu(null)}
          onConfirm={(selected) => {
            cart.addLine(variantMenu.id, selected);
            setVariantMenu(null);
            setCartOpen(true);
          }}
        />
      )}

      {/* floating cart bar */}
      {cart.count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-5xl p-4">
          <button
            onClick={() => setCartOpen(true)}
            className="shadow-float btn-press flex w-full items-center justify-between overflow-hidden rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white hover:bg-primary-hover transition"
          >
            <span className="font-medium">
              {cart.count} Item <span className="opacity-60">•</span> {rupiah(subtotal)}
            </span>
            <span>Checkout</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <CartSheet
          outlet={outlet}
          cart={cart}
          menuMap={menuMap}
          subtotal={subtotal}
          onClose={() => setCartOpen(false)}
          onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
        />
      )}

      {checkoutOpen && (
        <CheckoutSheet
          outlet={outlet}
          cart={cart}
          subtotal={subtotal}
          onClose={() => setCheckoutOpen(false)}
          onDone={(orderId) => { cart.clear(); router.push(`/order/${orderId}`); }}
        />
      )}

      {helpOpen && <HelpChatSheet outlet={outlet} onClose={() => setHelpOpen(false)} />}
      {reserveOpen && <ReservationSheet outlet={outlet} onClose={() => setReserveOpen(false)} />}
    </div>
  );
}

function CategoryChip({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  count: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`btn-press shrink-0 rounded-lg border p-2 text-left transition ${
        active ? "bg-gradient-category border-transparent" : "bg-white border-gray-4 hover:bg-gray-3"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-gray-4 bg-gray-3 text-base">
          {icon}
        </span>
        <span className="flex flex-col items-start justify-between">
          <span className={`text-xs font-normal ${active ? "text-white/80" : "text-gray-5"}`}>{label}</span>
          <span className={`text-sm font-semibold ${active ? "text-white" : "text-dark-1"}`}>{count}</span>
        </span>
      </div>
    </button>
  );
}

function CartSheet({
  outlet,
  cart,
  menuMap,
  subtotal,
  onClose,
  onCheckout,
}: {
  outlet: { id: string; name: string };
  cart: ReturnType<typeof useCart>;
  menuMap: Map<string, Menu>;
  subtotal: number;
  onClose: () => void;
  onCheckout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay-2 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-dark-1">Keranjang</h2>
          <button onClick={onClose} className="text-2xl leading-none text-gray-2 hover:text-dark-1">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-2.5">
          {cart.items.length === 0 ? (
            <p className="text-center text-sm text-gray-5 py-8">Keranjang kosong.</p>
          ) : (
            cart.items.map((l) => {
              const m = menuMap.get(l.menuId);
              if (!m) return null;
              const unitPrice = m.price + l.options.reduce((s, o) => s + o.priceDelta, 0);
              return (
                <div key={l.key} className="rounded-lg border border-gray-6 bg-white p-2.5 flex items-center gap-3">
                  <MenuImage image={m.image} category={m.category} className="h-14 w-14 rounded-md shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-dark-2 truncate">{m.name}</p>
                    {l.options.length > 0 && (
                      <p className="text-[11px] text-gray-5 truncate">{l.options.map((o) => o.name).join(", ")}</p>
                    )}
                    <p className="text-xs text-primary font-semibold">{rupiah(unitPrice)}</p>
                    <input
                      value={l.forName}
                      onChange={(e) => cart.setForName(l.key, e.target.value)}
                      placeholder="Untuk siapa? (misal: Ainun) — opsional"
                      className="mt-1 w-full text-xs rounded-md border border-gray-4 bg-gray-3 px-2 py-1 outline-none placeholder:text-gray-2 focus:border-primary focus:bg-white"
                    />
                    <input
                      value={l.notes}
                      onChange={(e) => cart.setNotes(l.key, e.target.value)}
                      placeholder="Catatan (opsional)…"
                      className="mt-1 w-full text-xs rounded-md border border-gray-4 bg-gray-3 px-2 py-1 outline-none placeholder:text-gray-2 focus:border-primary focus:bg-white"
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <button onClick={() => cart.setQty(l.key, l.qty - 1)} className="h-6 w-6 rounded-full border border-primary text-primary font-semibold text-sm leading-none btn-press hover:bg-primary hover:text-white transition">−</button>
                      <span className="w-4 text-center font-semibold text-sm text-dark-1">{l.qty}</span>
                      <button onClick={() => cart.setQty(l.key, l.qty + 1)} className="h-6 w-6 rounded-full border border-primary text-primary font-semibold text-sm leading-none btn-press hover:bg-primary hover:text-white transition">+</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="p-4 border-t border-gray-4 bg-white shadow-bottom">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-5">Subtotal ({cart.count} item)</span>
            <span className="text-xl font-semibold text-dark-1">{rupiah(subtotal)}</span>
          </div>
          <Button onClick={onCheckout} disabled={cart.items.length === 0} className="w-full py-3.5 rounded-full">Checkout</Button>
        </div>
      </div>
    </div>
  );
}

function CheckoutSheet({
  outlet,
  cart,
  subtotal,
  onClose,
  onDone,
}: {
  outlet: { id: string; name: string };
  cart: ReturnType<typeof useCart>;
  subtotal: number;
  onClose: () => void;
  onDone: (orderId: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [buyerChecked, setBuyerChecked] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [usePoints, setUsePoints] = useState(0);

  const maxRedeemable = Math.min(pointsBalance, subtotal);

  useEffect(() => {
    fetch("/api/buyer/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.buyer) {
          setName(d.buyer.name);
          setPhone(d.buyer.phone);
          setPointsBalance(d.buyer.points ?? 0);
        }
        setBuyerChecked(true);
      })
      .catch(() => setBuyerChecked(true));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim() || !phone.trim()) return setErr("Nama dan nomor HP wajib diisi.");
    setLoading(true);
    const res = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId: outlet.id,
        buyerName: name,
        buyerPhone: phone,
        items: cart.items.map((l) => ({ menuId: l.menuId, qty: l.qty, notes: l.notes, forName: l.forName, optionIds: l.options.map((o) => o.optionId) })),
        pointsToUse: usePoints,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setErr(d.error || "Gagal checkout.");
    }
    const d = await res.json();
    onDone(d.orderId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-overlay-2 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl border border-gray-4 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-center mb-3">
            <span className="hanko h-12 w-12 text-xl">🧾</span>
          </div>
          <h3 className="text-xl font-semibold text-center text-dark-1">Checkout</h3>
          <p className="text-sm text-gray-5 text-center mt-1">{cart.count} item · {rupiah(subtotal)}</p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              disabled={!buyerChecked}
              className="w-full rounded-lg border border-gray-6 bg-white px-4 py-3 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nomor WhatsApp (08…)"
              inputMode="tel"
              disabled={!buyerChecked}
              className="w-full rounded-lg border border-gray-6 bg-white px-4 py-3 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
            />
            {pointsBalance > 0 && (
              <div className="rounded-lg bg-primary-light border border-[#FEE4E2] p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-5">🪙 Poin kamu: {pointsBalance}</span>
                  <button
                    type="button"
                    onClick={() => setUsePoints(usePoints > 0 ? 0 : maxRedeemable)}
                    className="font-semibold text-primary hover:underline"
                  >
                    {usePoints > 0 ? "Batal pakai" : "Pakai maksimal"}
                  </button>
                </div>
                {usePoints > 0 && (
                  <input
                    type="range"
                    min={0}
                    max={maxRedeemable}
                    value={usePoints}
                    onChange={(e) => setUsePoints(Number(e.target.value))}
                    className="w-full"
                  />
                )}
                {usePoints > 0 && <p className="text-xs text-primary font-semibold">Pakai {usePoints} poin · potongan {rupiah(usePoints)}</p>}
              </div>
            )}
            {err && <p className="text-sm text-primary bg-primary-light rounded-lg px-3 py-2">{err}</p>}
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-gray-5">Total</span>
              <span className="text-lg font-semibold text-primary">{rupiah(Math.max(0, subtotal - usePoints))}</span>
            </div>
            <Button type="submit" className="w-full py-3.5" disabled={loading || !buyerChecked}>
              {loading ? "Memproses…" : "Buat Pesanan →"}
            </Button>
            <button type="button" onClick={onClose} className="w-full text-center text-sm text-gray-5 hover:text-dark-1 py-1">Batal</button>
          </form>
          <p className="text-center text-[11px] text-gray-5 mt-3">
            Belum punya akun? <Link href="/account/register" className="text-primary font-semibold hover:underline">Daftar</Link> biar checkout lebih cepat lain kali.
          </p>
        </div>
      </div>
    </div>
  );
}

function HelpChatSheet({ outlet, onClose }: { outlet: { id: string; name: string }; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/buyer/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.buyer) {
          setName(d.buyer.name);
          setPhone(d.buyer.phone);
        }
      })
      .catch(() => {});
  }, []);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim() || !phone.trim()) return setErr("Isi nama dan nomor HP dulu ya.");
    setLoading(true);
    const res = await fetch("/api/chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outletId: outlet.id, buyerName: name, buyerPhone: phone }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setErr(d.error || "Gagal memulai chat.");
    }
    const { conversationId } = await res.json();
    router.push(`/chat/${conversationId}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-overlay-2 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white border border-gray-6 rounded-2xl p-6 w-full max-w-sm animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-3">
          <span className="hanko h-12 w-12 text-xl">💬</span>
        </div>
        <h3 className="text-xl font-semibold text-center text-dark-1">Tanya Kasir Dulu?</h3>
        <p className="text-sm text-gray-5 text-center mt-1">Untuk pertanyaan sebelum order — bukan untuk checkout.</p>
        <form onSubmit={start} className="mt-5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            className="w-full rounded-lg border border-gray-6 bg-white px-4 py-3 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Nomor WhatsApp (08…)"
            inputMode="tel"
            className="w-full rounded-lg border border-gray-6 bg-white px-4 py-3 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
          {err && <p className="text-sm text-primary bg-primary-light rounded-lg px-3 py-2">{err}</p>}
          <Button type="submit" className="w-full py-3.5" disabled={loading}>
            {loading ? "Membuka chat…" : "Mulai Chat →"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function ReservationSheet({ outlet, onClose }: { outlet: { id: string; name: string }; onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [reservedFor, setReservedFor] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/buyer/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.buyer) {
          setName(d.buyer.name);
          setPhone(d.buyer.phone);
        }
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim() || !phone.trim() || !reservedFor) return setErr("Nama, nomor HP, dan waktu reservasi wajib diisi.");
    setLoading(true);
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outletId: outlet.id, buyerName: name, buyerPhone: phone, partySize, reservedFor, notes }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setErr(d.error || "Gagal membuat reservasi.");
    }
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-overlay-2 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white border border-gray-6 rounded-2xl p-6 w-full max-w-sm animate-fade-up" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-4">
            <div className="hanko h-14 w-14 text-2xl mx-auto mb-3">📅</div>
            <p className="text-xl font-semibold text-dark-1">Reservasi Terkirim!</p>
            <p className="text-sm text-gray-5 mt-1">Kasir akan mengonfirmasi reservasimu segera.</p>
            <Button onClick={onClose} className="w-full mt-4">Tutup</Button>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-3">
              <span className="hanko h-12 w-12 text-xl">📅</span>
            </div>
            <h3 className="text-xl font-semibold text-center text-dark-1">Reservasi Meja</h3>
            <p className="text-sm text-gray-5 text-center mt-1">{outlet.name}</p>
            <form onSubmit={submit} className="mt-5 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama kamu"
                className="w-full rounded-lg border border-gray-6 bg-white px-4 py-3 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nomor WhatsApp (08…)"
                inputMode="tel"
                className="w-full rounded-lg border border-gray-6 bg-white px-4 py-3 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-gray-5">Jumlah Orang</span>
                  <input
                    type="number"
                    min={1}
                    value={partySize}
                    onChange={(e) => setPartySize(Math.max(1, Number(e.target.value)))}
                    className="mt-1 w-full rounded-lg border border-gray-6 bg-white px-4 py-2.5 text-sm text-dark-1 outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-5">Tanggal & Jam</span>
                  <input
                    type="datetime-local"
                    value={reservedFor}
                    onChange={(e) => setReservedFor(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-6 bg-white px-4 py-2.5 text-sm text-dark-1 outline-none focus:border-primary"
                  />
                </label>
              </div>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan (opsional)…"
                className="w-full rounded-lg border border-gray-6 bg-white px-4 py-3 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
              {err && <p className="text-sm text-primary bg-primary-light rounded-lg px-3 py-2">{err}</p>}
              <Button type="submit" className="w-full py-3.5" disabled={loading}>
                {loading ? "Mengirim…" : "Kirim Reservasi →"}
              </Button>
              <button type="button" onClick={onClose} className="w-full text-center text-sm text-gray-5 hover:text-dark-1 py-1">Batal</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
