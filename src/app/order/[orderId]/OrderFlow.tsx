"use client";
import { useState } from "react";
import Link from "next/link";
import { usePoll, fileToDataUrl } from "@/lib/hooks";
import { Button, Logo, MenuImage } from "@/components/ui";
import { rupiah, ORDER_STATUS } from "@/lib/format";
import Petals from "@/components/Petals";

type OrderData = {
  order: {
    id: string;
    invoiceNumber: string;
    queueNumber: number | null;
    status: string;
    orderType: string;
    deliveryAddress: string | null;
    latitude: number | null;
    longitude: number | null;
    buyerName: string;
    subtotal: number;
    discount: number;
    tax: number;
    deliveryFee: number;
    pointsUsed: number;
    total: number;
    items: { id: string; menuName: string; qty: number; price: number; subtotal: number; notes: string | null; forName: string | null; options: { id: string; optionName: string; priceDelta: number }[] }[];
    payment: { method: string; status: string; amount: number; proofImage: string | null; notes: string | null } | null;
    scheduledFor: string | null;
    rating: { stars: number; comment: string | null } | null;
    outlet: {
      name: string;
      phone: string;
      address: string;
      payment: { qrisImage: string | null; ownerName: string; notes: string | null } | null;
    };
  };
};

const STEPS = [
  { key: "review", label: "Review", jp: "確認" },
  { key: "pay", label: "Bayar", jp: "支払" },
  { key: "verify", label: "Verifikasi", jp: "検証" },
  { key: "kitchen", label: "Dapur", jp: "調理" },
  { key: "done", label: "Selesai", jp: "完了" },
];

// COD skips the pay/verify steps entirely — payment happens on handoff, not upfront
const COD_STEPS = [
  { key: "review", label: "Review", jp: "確認" },
  { key: "kitchen", label: "Dapur", jp: "調理" },
  { key: "done", label: "Selesai", jp: "完了" },
];

function stepIndex(status: string) {
  if (status === "WAITING_CONFIRMATION") return 0;
  if (status === "WAITING_PAYMENT") return 1;
  if (status === "WAITING_PAYMENT_VERIFICATION") return 2;
  if (["PAID", "QUEUED", "COOKING", "READY"].includes(status)) return 3;
  if (status === "COMPLETED") return 4;
  return 0;
}

function codStepIndex(status: string) {
  if (status === "WAITING_CONFIRMATION") return 0;
  if (status === "COMPLETED") return 2;
  return 1;
}

export default function OrderFlow({ orderId, conversationId }: { orderId: string; conversationId: string | null }) {
  const { data, reload } = usePoll<OrderData>(`/api/orders/${orderId}`, 2500);
  const order = data?.order;

  if (!order) return <div className="min-h-screen bg-asanoha grid place-items-center"><p className="text-sumi/50">Memuat order…</p></div>;

  const isCod = order.payment?.method === "COD";
  const steps = isCod ? COD_STEPS : STEPS;
  const si = isCod ? codStepIndex(order.status) : stepIndex(order.status);
  const cancelled = order.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-asanoha">
      <div className="noren h-2 w-full" />
      <Petals count={6} />
      <div className="mx-auto max-w-lg px-4 py-5">
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <Logo size={34} />
          {conversationId && (
            <Link href={`/chat/${conversationId}`} className="text-sm font-round font-bold text-sumi/60 hover:text-shu">‹ Chat</Link>
          )}
        </div>

        {/* invoice card */}
        <div className="paper-card rounded-3xl overflow-hidden mb-4">
          <div className="bg-sumi text-washi px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-round text-kin-light text-[11px] tracking-widest">請求書</p>
              <p className="font-display text-lg font-extrabold">{order.invoiceNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              {order.queueNumber != null && (
                <span className="text-xs font-round font-bold bg-kin text-sumi rounded-full px-3 py-1.5">#{order.queueNumber}</span>
              )}
              <span className="text-xs font-round font-bold bg-shu rounded-full px-3 py-1.5">
                {ORDER_STATUS[order.status]?.label}
              </span>
            </div>
          </div>

          {/* stepper */}
          {!cancelled && (
            <div className="px-5 py-4 border-b border-sumi/10">
              <div className="flex items-center">
                {steps.map((s, i) => (
                  <div key={s.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`grid place-items-center h-8 w-8 rounded-full text-xs font-bold transition ${i <= si ? "bg-shu text-white" : "bg-sumi/10 text-sumi/40"}`}>
                        {i < si ? "✓" : i + 1}
                      </div>
                      <span className={`text-[9px] mt-1 font-round font-bold ${i <= si ? "text-shu" : "text-sumi/30"}`}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-1 rounded ${i < si ? "bg-shu" : "bg-sumi/10"}`} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.scheduledFor && (
            <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 text-xs font-round font-bold text-amber-700">
              🕒 Dijadwalkan: {new Date(order.scheduledFor).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
            </div>
          )}

          {/* items */}
          <div className="px-5 py-4 space-y-3">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center gap-3">
                <MenuImage image={null} category="Katsu" className="h-11 w-11 rounded-lg shrink-0" />
                <div className="min-w-0 flex-1">
                  {it.forName && <p className="text-[11px] font-bold text-shu truncate">Untuk: {it.forName}</p>}
                  <p className="font-round font-bold text-sm text-sumi truncate">{it.menuName}</p>
                  {it.options.length > 0 && <p className="text-xs text-sumi/50 truncate">{it.options.map((o) => o.optionName).join(", ")}</p>}
                  <p className="text-xs text-sumi/50">{it.qty} × {rupiah(it.price)}{it.notes ? ` · ${it.notes}` : ""}</p>
                </div>
                <span className="font-semibold text-sm text-sumi">{rupiah(it.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* totals */}
          <div className="px-5 py-4 bg-washi/50 border-t border-dashed border-sumi/20 space-y-1.5 text-sm">
            <Row label="Subtotal" value={rupiah(order.subtotal)} />
            {order.discount > 0 && <Row label="Diskon" value={"− " + rupiah(order.discount)} tone="text-emerald-600" />}
            {order.pointsUsed > 0 && <Row label={`Poin (${order.pointsUsed})`} value={"− " + rupiah(order.pointsUsed)} tone="text-emerald-600" />}
            {order.tax > 0 && <Row label="Pajak / Biaya" value={rupiah(order.tax)} />}
            {order.deliveryFee > 0 && <Row label="Ongkir" value={rupiah(order.deliveryFee)} />}
            <div className="flex justify-between items-center pt-2 border-t border-sumi/10">
              <span className="font-round font-bold text-sumi">Total</span>
              <span className="font-display text-2xl font-extrabold text-shu">{rupiah(order.total)}</span>
            </div>
          </div>
        </div>

        {/* stage-specific */}
        {cancelled ? (
          <div className="paper-card rounded-2xl p-6 text-center">
            <div className="hanko h-14 w-14 text-2xl mx-auto mb-3 bg-rose-500 border-rose-700">✕</div>
            <p className="font-display font-bold text-lg">Order Dibatalkan</p>
            <p className="text-sm text-sumi/50 mt-1">Silakan hubungi kasir jika ini keliru.</p>
          </div>
        ) : order.status === "WAITING_CONFIRMATION" ? (
          <ReviewStage order={order} reload={reload} />
        ) : order.status === "WAITING_PAYMENT" || (order.status === "WAITING_PAYMENT_VERIFICATION" && order.payment?.status === "REJECTED") ? (
          <PayStage order={order} reload={reload} />
        ) : order.status === "WAITING_PAYMENT_VERIFICATION" ? (
          <VerifyStage order={order} />
        ) : (
          <KitchenStage order={order} reload={reload} />
        )}

        <p className="text-center text-xs text-sumi/40 mt-6">🔒 {order.outlet.name} · {order.outlet.phone}</p>
      </div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sumi/50">{label}</span>
      <span className={tone ?? "text-sumi/70"}>{value}</span>
    </div>
  );
}

/* ---------- REVIEW ---------- */
function ReviewStage({ order, reload }: { order: OrderData["order"]; reload: () => void }) {
  const [type, setType] = useState<"TAKEAWAY" | "DELIVERY">(order.orderType as "TAKEAWAY" | "DELIVERY");
  const [address, setAddress] = useState(order.deliveryAddress ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    order.latitude != null ? { lat: order.latitude, lng: order.longitude! } : null
  );
  const [scheduleLater, setScheduleLater] = useState(!!order.scheduledFor);
  const [scheduledFor, setScheduledFor] = useState(order.scheduledFor ? order.scheduledFor.slice(0, 16) : "");
  const [paymentMethod, setPaymentMethod] = useState<"QRIS" | "COD">("QRIS");
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function getLocation() {
    setErr("");
    setLocating(true);
    if (!navigator.geolocation) {
      setLocating(false);
      return setErr("Browser tidak mendukung GPS.");
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setErr("Izin lokasi ditolak. Aktifkan GPS untuk delivery.");
      },
      { enableHighAccuracy: true }
    );
  }

  async function confirm() {
    setErr("");
    if (type === "DELIVERY" && (!address.trim() || !coords)) return setErr("Isi alamat & aktifkan lokasi GPS dulu.");
    if (scheduleLater && !scheduledFor) return setErr("Pilih tanggal & jam pesanan dulu.");
    setLoading(true);
    const t = await fetch(`/api/orders/${order.id}/type`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderType: type,
        deliveryAddress: address,
        latitude: coords?.lat,
        longitude: coords?.lng,
        scheduledFor: scheduleLater ? scheduledFor : null,
      }),
    });
    if (!t.ok) {
      setLoading(false);
      const d = await t.json().catch(() => ({}));
      return setErr(d.error || "Gagal menyimpan.");
    }
    const c = await fetch(`/api/orders/${order.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod }),
    });
    setLoading(false);
    if (!c.ok) {
      const d = await c.json().catch(() => ({}));
      return setErr(d.error || "Gagal konfirmasi.");
    }
    reload();
  }

  return (
    <div className="paper-card rounded-2xl p-5 space-y-4">
      <p className="font-display font-extrabold text-lg">Pilih tipe pesanan</p>
      <div className="grid grid-cols-2 gap-3">
        {(["TAKEAWAY", "DELIVERY"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-2xl p-4 text-left ring-1 transition ${type === t ? "bg-shu/10 ring-shu shadow-[0_0_0_1px_var(--color-shu)]" : "bg-washi/50 ring-sumi/10"}`}
          >
            <div className="text-2xl">{t === "TAKEAWAY" ? "🥡" : "🛵"}</div>
            <p className="font-round font-bold text-sm mt-1">{t === "TAKEAWAY" ? "Take Away" : "Delivery"}</p>
            <p className="text-[11px] text-sumi/50">{t === "TAKEAWAY" ? "Ambil di outlet" : "Diantar (+ongkir)"}</p>
          </button>
        ))}
      </div>

      {type === "DELIVERY" && (
        <div className="space-y-3 animate-fade-up">
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder="Alamat lengkap pengantaran…"
            className="w-full rounded-xl border border-sumi/15 bg-washi/50 px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
          />
          <button
            onClick={getLocation}
            className={`w-full rounded-xl px-4 py-3 text-sm font-round font-bold ring-1 transition ${coords ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-washi/50 text-sumi ring-sumi/15"}`}
          >
            {locating ? "📍 Mencari lokasi…" : coords ? `📍 Lokasi aktif (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : "📍 Aktifkan Lokasi GPS"}
          </button>
        </div>
      )}

      <label className="flex items-center justify-between rounded-xl bg-washi/50 ring-1 ring-sumi/10 px-4 py-3 cursor-pointer">
        <span className="text-sm font-round font-bold text-sumi">🕒 Pesan untuk nanti?</span>
        <input type="checkbox" checked={scheduleLater} onChange={(e) => setScheduleLater(e.target.checked)} />
      </label>
      {scheduleLater && (
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="w-full rounded-xl border border-sumi/15 bg-washi/50 px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
        />
      )}

      <div>
        <p className="text-sm font-round font-bold text-sumi mb-2">Metode Pembayaran</p>
        <div className="grid grid-cols-2 gap-3">
          {(["QRIS", "COD"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setPaymentMethod(m)}
              className={`rounded-2xl p-4 text-left ring-1 transition ${paymentMethod === m ? "bg-shu/10 ring-shu shadow-[0_0_0_1px_var(--color-shu)]" : "bg-washi/50 ring-sumi/10"}`}
            >
              <div className="text-2xl">{m === "QRIS" ? "📱" : "💵"}</div>
              <p className="font-round font-bold text-sm mt-1">{m === "QRIS" ? "QRIS" : "COD"}</p>
              <p className="text-[11px] text-sumi/50">{m === "QRIS" ? "Scan & upload bukti" : "Bayar di tempat"}</p>
            </button>
          ))}
        </div>
      </div>

      {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
      <Button onClick={confirm} disabled={loading} className="w-full py-3.5">
        {loading ? "Memproses…" : paymentMethod === "COD" ? "Konfirmasi Pesanan →" : "Konfirmasi & Lanjut Bayar →"}
      </Button>
    </div>
  );
}

/* ---------- PAY ---------- */
function PayStage({ order, reload }: { order: OrderData["order"]; reload: () => void }) {
  const [proof, setProof] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const qris = order.outlet.payment;
  const rejected = order.payment?.status === "REJECTED";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProof(await fileToDataUrl(file));
  }

  async function submit() {
    setErr("");
    if (!proof) return setErr("Upload bukti pembayaran dulu ya.");
    setLoading(true);
    const res = await fetch(`/api/orders/${order.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofImage: proof }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setErr(d.error || "Gagal upload.");
    }
    reload();
  }

  return (
    <div className="paper-card rounded-2xl p-5 space-y-4">
      {rejected && (
        <div className="bg-rose-50 ring-1 ring-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
          Bukti sebelumnya ditolak{order.payment?.notes ? `: ${order.payment.notes}` : ""}. Silakan bayar & upload ulang.
        </div>
      )}
      <div className="text-center">
        <p className="font-round text-shu text-xs tracking-widest">QRIS 支払い</p>
        <p className="font-display font-extrabold text-lg">Scan & Bayar</p>
        <p className="text-sm text-sumi/50">Transfer nominal persis lalu upload bukti.</p>
      </div>

      <div className="rounded-2xl bg-white ring-1 ring-sumi/10 p-4 flex flex-col items-center">
        {qris?.qrisImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qris.qrisImage} alt="QRIS" className="h-52 w-52 object-contain" />
        ) : (
          <div className="h-52 w-52 grid place-items-center text-sumi/30">QRIS belum tersedia</div>
        )}
        <p className="font-round font-bold text-sm mt-2">{qris?.ownerName}</p>
        <div className="mt-2 price-tag px-4 py-1.5 text-base">{rupiah(order.total)}</div>
        {qris?.qrisImage && (
          <a
            href={qris.qrisImage}
            download={`qris-${order.invoiceNumber}.png`}
            className="mt-3 text-xs font-round font-bold text-shu hover:underline"
          >
            ⬇ Unduh gambar QRIS
          </a>
        )}
      </div>

      <label className="block">
        <span className="text-sm font-round font-bold text-sumi">Bukti Pembayaran</span>
        <div className="mt-1.5 rounded-xl border-2 border-dashed border-sumi/20 p-4 grid place-items-center cursor-pointer hover:border-shu transition bg-washi/40">
          {proof ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={proof} alt="bukti" className="max-h-40 rounded-lg" />
          ) : (
            <span className="text-sm text-sumi/40 text-center">📤 Ketuk untuk unggah screenshot transfer</span>
          )}
          <input type="file" accept="image/*" hidden onChange={onFile} />
        </div>
      </label>

      {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
      <Button onClick={submit} disabled={loading} className="w-full py-3.5">
        {loading ? "Mengirim…" : "Kirim Bukti Pembayaran →"}
      </Button>
    </div>
  );
}

/* ---------- VERIFY ---------- */
function VerifyStage({ order }: { order: OrderData["order"] }) {
  return (
    <div className="paper-card rounded-2xl p-6 text-center">
      <div className="hanko h-16 w-16 text-2xl mx-auto mb-3 animate-float">検</div>
      <p className="font-display font-extrabold text-lg">Menunggu Verifikasi Kasir</p>
      <p className="text-sm text-sumi/50 mt-1 max-w-xs mx-auto">
        Bukti pembayaranmu sedang diperiksa. Halaman ini akan otomatis diperbarui 🌸
      </p>
      {order.payment?.proofImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={order.payment.proofImage} alt="bukti" className="mt-4 max-h-32 mx-auto rounded-lg ring-1 ring-sumi/10" />
      )}
      <div className="mt-4 flex justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2 w-2 rounded-full bg-shu animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

/* ---------- KITCHEN / STATUS ---------- */
function KitchenStage({ order, reload }: { order: OrderData["order"]; reload: () => void }) {
  const stages = [
    { key: "QUEUED", label: "Masuk Antrian", jp: "待機列", icon: "📋" },
    { key: "COOKING", label: "Sedang Dimasak", jp: "調理中", icon: "🍳" },
    { key: "READY", label: "Siap Diambil", jp: "準備完了", icon: "🍱" },
    { key: "COMPLETED", label: "Selesai", jp: "完了", icon: "🎉" },
  ];
  const order2idx: Record<string, number> = { PAID: 0, QUEUED: 0, COOKING: 1, READY: 2, COMPLETED: 3 };
  const cur = order2idx[order.status] ?? 0;

  const isCod = order.payment?.method === "COD";

  return (
    <div className="space-y-4">
      {isCod && order.payment?.status !== "PAID" && (
        <div className="rounded-2xl bg-amber-50 ring-1 ring-amber-200 text-amber-700 text-sm font-round font-bold px-4 py-3 text-center">
          💵 Bayar {rupiah(order.total)} di tempat saat pesanan {order.orderType === "DELIVERY" ? "diantar" : "diambil"} (COD)
        </div>
      )}
      {isCod && order.payment?.status === "PAID" && (
        <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 text-emerald-700 text-sm font-round font-bold px-4 py-3 text-center">
          ✓ Pembayaran COD sudah diterima
        </div>
      )}
      {order.queueNumber != null && order.status !== "COMPLETED" && (
        <div className="paper-card rounded-2xl p-5 text-center">
          <p className="font-round text-shu/70 text-xs tracking-widest">NOMOR ANTRIAN</p>
          <p className="font-display font-extrabold text-5xl text-shu mt-1">#{order.queueNumber}</p>
          <p className="text-xs text-sumi/40 mt-1">Tunjukkan nomor ini saat pengambilan pesanan</p>
        </div>
      )}
      <div className="paper-card rounded-2xl p-5">
        <div className="text-center mb-5">
          <div className="text-5xl mb-1 animate-float inline-block">{stages[cur].icon}</div>
          <p className="font-display font-extrabold text-xl">{stages[cur].label}</p>
          <p className="font-round text-shu/70 text-sm">{stages[cur].jp}</p>
          {order.orderType === "DELIVERY" && order.deliveryAddress && (
            <p className="text-xs text-sumi/50 mt-2">🛵 Diantar ke: {order.deliveryAddress}</p>
          )}
        </div>
        <div className="space-y-3">
          {stages.map((s, i) => {
            const done = i < cur;
            const active = i === cur;
            return (
              <div key={s.key} className={`flex items-center gap-3 rounded-xl p-3 transition ${active ? "bg-shu/10 ring-1 ring-shu/30" : done ? "opacity-60" : "opacity-40"}`}>
                <div className={`grid place-items-center h-9 w-9 rounded-full ${done || active ? "bg-shu text-white" : "bg-sumi/10 text-sumi/40"}`}>
                  {done ? "✓" : s.icon}
                </div>
                <div className="flex-1">
                  <p className="font-round font-bold text-sm">{s.label}</p>
                </div>
                {active && <span className="h-2.5 w-2.5 rounded-full bg-shu pulse-ring" />}
              </div>
            );
          })}
        </div>
      </div>
      {order.status === "COMPLETED" && <RatingCard order={order} reload={reload} />}
    </div>
  );
}

/* ---------- RATING ---------- */
function RatingCard({ order, reload }: { order: OrderData["order"]; reload: () => void }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (order.rating) {
    return (
      <div className="paper-card rounded-2xl p-5 text-center">
        <p className="font-round font-bold text-sm text-sumi/60">Terima kasih atas ratingmu!</p>
        <p className="text-2xl mt-1">{"⭐".repeat(order.rating.stars)}</p>
        {order.rating.comment && <p className="text-sm text-sumi/50 mt-2 italic">"{order.rating.comment}"</p>}
      </div>
    );
  }

  async function submit() {
    setErr("");
    if (stars < 1) return setErr("Pilih bintang dulu ya.");
    setLoading(true);
    const res = await fetch(`/api/orders/${order.id}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars, comment }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setErr(d.error || "Gagal mengirim rating.");
    }
    reload();
  }

  return (
    <div className="paper-card rounded-2xl p-5 space-y-3 text-center">
      <p className="font-display font-extrabold text-lg">Bagaimana pesananmu?</p>
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setStars(n)} className="text-3xl leading-none">
            {n <= stars ? "⭐" : "☆"}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Komentar (opsional)…"
        className="w-full rounded-xl border border-sumi/15 bg-washi/50 px-4 py-2.5 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
      />
      {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
      <Button onClick={submit} disabled={loading} className="w-full py-3">
        {loading ? "Mengirim…" : "Kirim Rating"}
      </Button>
    </div>
  );
}
