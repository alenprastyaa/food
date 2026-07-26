"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, MenuImage, Logo } from "@/components/ui";
import { rupiah } from "@/lib/format";
import { useCart } from "@/lib/cart";
import VariantPicker, { OptionGroup } from "@/components/VariantPicker";

type Menu = { id: string; name: string; category: string; description: string | null; price: number; image: string | null; optionGroups: OptionGroup[] };

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
  const [cat, setCat] = useState(categories[0] ?? "");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [variantMenu, setVariantMenu] = useState<Menu | null>(null);

  const menuMap = useMemo(() => new Map(menus.map((m) => [m.id, m])), [menus]);
  const subtotal = cart.items.reduce((s, l) => s + ((menuMap.get(l.menuId)?.price ?? 0) + l.options.reduce((a, o) => a + o.priceDelta, 0)) * l.qty, 0);
  const filtered = menus.filter((m) => m.category === cat);

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
    <div className="space-y-4 pb-24">
      {/* outlet hero */}
      <div className="paper-card rounded-3xl overflow-hidden">
        <div className="bg-sumi text-washi p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-8 font-display text-8xl text-shu/20 select-none">丼</div>
          <p className="font-round text-kin-light text-xs tracking-[0.3em] relative">いらっしゃいませ</p>
          <h1 className="font-display text-2xl font-extrabold mt-1 relative">{outlet.name}</h1>
          <p className="text-washi/60 text-sm mt-2 relative">📍 {outlet.address}</p>
          {rating && <p className="text-kin-light text-sm mt-1 relative">⭐ {rating.avg.toFixed(1)} · {rating.count} rating</p>}
        </div>
        <div className="p-4 flex items-center justify-between gap-2">
          <p className="text-xs text-sumi/50">Pilih menu, masukkan keranjang, lalu checkout.</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => setReserveOpen(true)} className="text-xs font-round font-bold text-shu bg-shu/10 rounded-full px-3 py-1.5 hover:bg-shu/20 transition">
              📅 Reservasi
            </button>
            <button onClick={() => setHelpOpen(true)} className="text-xs font-round font-bold text-shu bg-shu/10 rounded-full px-3 py-1.5 hover:bg-shu/20 transition">
              💬 Tanya Kasir
            </button>
          </div>
        </div>
      </div>

      {/* category tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-1 -mx-1 px-1 sticky top-[68px] z-10 bg-asanoha/95 backdrop-blur py-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-round font-bold transition ${
              cat === c ? "bg-shu text-white shadow-[0_3px_0_var(--color-shu-dark)]" : "bg-paper text-sumi/60 ring-1 ring-sumi/10"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* menu grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((m) => {
          const hasVariants = m.optionGroups.length > 0;
          const qty = hasVariants
            ? cart.items.filter((l) => l.menuId === m.id).reduce((s, l) => s + l.qty, 0)
            : cart.lines[m.id]?.qty ?? 0;
          return (
            <div key={m.id} className="paper-card rounded-2xl overflow-hidden flex flex-col min-w-0">
              <MenuImage image={m.image} category={m.category} className="aspect-square w-full" />
              <div className="p-3 flex flex-col flex-1">
                <p className="font-round font-bold text-sm text-sumi leading-snug line-clamp-2">{m.name}</p>
                <p className="text-[11px] text-sumi/40 line-clamp-2 mt-0.5 flex-1">{m.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="price-tag text-xs px-2 py-1">{rupiah(m.price)}</span>
                  {hasVariants && <span className="text-[10px] text-sumi/40">ada varian</span>}
                </div>
                <div className="mt-2">
                  {hasVariants ? (
                    <button
                      onClick={() => setVariantMenu(m)}
                      className="w-full rounded-lg bg-sumi text-washi text-xs font-round font-bold py-2 btn-press hover:bg-sumi-soft"
                    >
                      {qty > 0 ? `+ Tambah (${qty} di keranjang)` : "+ Pilih Varian"}
                    </button>
                  ) : qty === 0 ? (
                    <button
                      onClick={() => cart.addLine(m.id, [])}
                      className="w-full rounded-lg bg-sumi text-washi text-xs font-round font-bold py-2 btn-press hover:bg-sumi-soft"
                    >
                      + Tambah
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-shu/10 rounded-lg p-1">
                      <button onClick={() => cart.setQty(m.id, qty - 1)} className="h-7 w-7 rounded-md bg-white text-shu font-bold btn-press shadow-sm">−</button>
                      <span className="font-display font-extrabold text-sm text-shu">{qty}</span>
                      <button onClick={() => cart.setQty(m.id, qty + 1)} className="h-7 w-7 rounded-md bg-shu text-white font-bold btn-press">+</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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

      {/* sticky cart bar */}
      {cart.count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-washi via-washi/95 to-transparent">
          <button
            onClick={() => setCartOpen(true)}
            className="mx-auto max-w-2xl w-full flex items-center justify-between rounded-2xl bg-sumi text-washi px-5 py-3.5 shadow-xl btn-press"
          >
            <span className="flex items-center gap-2 font-round font-bold text-sm">
              <span className="relative">
                🛒
                <span className="absolute -top-2 -right-2 h-4 w-4 grid place-items-center rounded-full bg-shu text-[10px] font-bold">{cart.count}</span>
              </span>
              Lihat Keranjang
            </span>
            <span className="font-display font-extrabold">{rupiah(subtotal)}</span>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-sumi/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-washi rounded-t-[1.75rem] max-h-[85vh] flex flex-col animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-sumi/10 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">Keranjang <span className="font-round text-shu/60 text-sm">カート</span></h2>
          <button onClick={onClose} className="text-2xl text-sumi/40 hover:text-sumi">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin p-4 space-y-2.5">
          {cart.items.length === 0 ? (
            <p className="text-center text-sm text-sumi/40 py-8">Keranjang kosong.</p>
          ) : (
            cart.items.map((l) => {
              const m = menuMap.get(l.menuId);
              if (!m) return null;
              const unitPrice = m.price + l.options.reduce((s, o) => s + o.priceDelta, 0);
              return (
                <div key={l.key} className="paper-card rounded-xl p-2.5 flex items-center gap-3">
                  <MenuImage image={m.image} category={m.category} className="h-14 w-14 rounded-lg shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-round font-bold text-sm truncate">{m.name}</p>
                    {l.options.length > 0 && (
                      <p className="text-[11px] text-sumi/50 truncate">{l.options.map((o) => o.name).join(", ")}</p>
                    )}
                    <p className="text-xs text-shu font-bold">{rupiah(unitPrice)}</p>
                    <input
                      value={l.forName}
                      onChange={(e) => cart.setForName(l.key, e.target.value)}
                      placeholder="Untuk siapa? (misal: Ainun) — opsional"
                      className="mt-1 w-full text-xs rounded-md border border-sumi/10 bg-washi/50 px-2 py-1 outline-none focus:border-shu"
                    />
                    <input
                      value={l.notes}
                      onChange={(e) => cart.setNotes(l.key, e.target.value)}
                      placeholder="Catatan (opsional)…"
                      className="mt-1 w-full text-xs rounded-md border border-sumi/10 bg-washi/50 px-2 py-1 outline-none focus:border-shu"
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => cart.setQty(l.key, l.qty - 1)} className="h-6 w-6 rounded-md bg-sumi/10 text-sumi font-bold text-xs btn-press">−</button>
                      <span className="w-4 text-center font-display font-bold text-sm">{l.qty}</span>
                      <button onClick={() => cart.setQty(l.key, l.qty + 1)} className="h-6 w-6 rounded-md bg-shu text-white font-bold text-xs btn-press">+</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="p-4 border-t border-sumi/10 bg-paper">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-sumi/50">Subtotal ({cart.count} item)</span>
            <span className="font-display text-xl font-extrabold text-shu">{rupiah(subtotal)}</span>
          </div>
          <Button onClick={onCheckout} disabled={cart.items.length === 0} className="w-full py-3.5">Checkout →</Button>
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-sumi/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-washi rounded-t-[1.75rem] sm:rounded-3xl paper-card animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-center mb-3">
            <span className="hanko h-12 w-12 text-xl">梨</span>
          </div>
          <h3 className="font-display text-xl font-extrabold text-center">Checkout</h3>
          <p className="text-sm text-sumi/50 text-center mt-1">{cart.count} item · {rupiah(subtotal)}</p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              disabled={!buyerChecked}
              className="w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20 disabled:opacity-50"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nomor WhatsApp (08…)"
              inputMode="tel"
              disabled={!buyerChecked}
              className="w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20 disabled:opacity-50"
            />
            {pointsBalance > 0 && (
              <div className="rounded-xl bg-shu/5 ring-1 ring-shu/15 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sumi/60">🪙 Poin kamu: {pointsBalance}</span>
                  <button
                    type="button"
                    onClick={() => setUsePoints(usePoints > 0 ? 0 : maxRedeemable)}
                    className="font-bold text-shu hover:underline"
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
                {usePoints > 0 && <p className="text-xs text-shu font-bold">Pakai {usePoints} poin · potongan {rupiah(usePoints)}</p>}
              </div>
            )}
            {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-sumi/50">Total</span>
              <span className="font-display text-lg font-extrabold text-shu">{rupiah(Math.max(0, subtotal - usePoints))}</span>
            </div>
            <Button type="submit" className="w-full py-3.5" disabled={loading || !buyerChecked}>
              {loading ? "Memproses…" : "Buat Pesanan →"}
            </Button>
            <button type="button" onClick={onClose} className="w-full text-center text-sm text-sumi/50 hover:text-sumi py-1">Batal</button>
          </form>
          <p className="text-center text-[11px] text-sumi/40 mt-3">
            Belum punya akun? <Link href="/account/register" className="text-shu font-bold hover:underline">Daftar</Link> biar checkout lebih cepat lain kali.
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-sumi/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="paper-card rounded-3xl p-6 w-full max-w-sm animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-3">
          <span className="hanko h-12 w-12 text-xl">💬</span>
        </div>
        <h3 className="font-display text-xl font-extrabold text-center">Tanya Kasir Dulu?</h3>
        <p className="text-sm text-sumi/50 text-center mt-1">Untuk pertanyaan sebelum order — bukan untuk checkout.</p>
        <form onSubmit={start} className="mt-5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            className="w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Nomor WhatsApp (08…)"
            inputMode="tel"
            className="w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
          />
          {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-sumi/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="paper-card rounded-3xl p-6 w-full max-w-sm animate-fade-up" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-4">
            <div className="hanko h-14 w-14 text-2xl mx-auto mb-3">📅</div>
            <p className="font-display text-xl font-extrabold">Reservasi Terkirim!</p>
            <p className="text-sm text-sumi/50 mt-1">Kasir akan mengonfirmasi reservasimu segera.</p>
            <Button onClick={onClose} className="w-full mt-4">Tutup</Button>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-3">
              <span className="hanko h-12 w-12 text-xl">📅</span>
            </div>
            <h3 className="font-display text-xl font-extrabold text-center">Reservasi Meja</h3>
            <p className="text-sm text-sumi/50 text-center mt-1">{outlet.name}</p>
            <form onSubmit={submit} className="mt-5 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama kamu"
                className="w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nomor WhatsApp (08…)"
                inputMode="tel"
                className="w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-sumi/50">Jumlah Orang</span>
                  <input
                    type="number"
                    min={1}
                    value={partySize}
                    onChange={(e) => setPartySize(Math.max(1, Number(e.target.value)))}
                    className="mt-1 w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-2.5 text-sm outline-none focus:border-shu"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-sumi/50">Tanggal & Jam</span>
                  <input
                    type="datetime-local"
                    value={reservedFor}
                    onChange={(e) => setReservedFor(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-2.5 text-sm outline-none focus:border-shu"
                  />
                </label>
              </div>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan (opsional)…"
                className="w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
              />
              {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
              <Button type="submit" className="w-full py-3.5" disabled={loading}>
                {loading ? "Mengirim…" : "Kirim Reservasi →"}
              </Button>
              <button type="button" onClick={onClose} className="w-full text-center text-sm text-sumi/50 hover:text-sumi py-1">Batal</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
