"use client";
import { useState } from "react";
import Link from "next/link";
import { rupiah, clock, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/format";
import { StatusBadge, Button } from "@/components/ui";

export type FullOrder = {
  id: string;
  invoiceNumber: string;
  status: string;
  orderType: string;
  deliveryAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  buyerName: string;
  buyerPhone: string;
  conversationId: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  outlet?: { name: string };
  items: { id: string; menuName: string; qty: number; price: number; subtotal: number; notes: string | null }[];
  payment: { status: string; amount: number; proofImage: string | null; notes: string | null } | null;
};

const NEXT: Record<string, string> = { QUEUED: "COOKING", COOKING: "READY", READY: "COMPLETED" };
const NEXT_LABEL: Record<string, string> = { QUEUED: "Mulai Masak 🍳", COOKING: "Tandai Siap 🍱", READY: "Selesaikan 🎉" };

export default function OrderDrawer({ order, onClose, onChanged }: { order: FullOrder; onClose: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  const st = ORDER_STATUS[order.status];

  async function act(url: string, body: unknown) {
    setBusy(true);
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    onChanged();
  }

  const mapUrl = order.latitude != null ? `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}` : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-sumi/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-washi h-full flex flex-col animate-fade-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-sumi text-washi px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-round text-kin-light text-[11px] tracking-widest">注文詳細</p>
            <h2 className="font-display text-lg font-extrabold">{order.invoiceNumber}</h2>
          </div>
          <button onClick={onClose} className="text-2xl text-washi/60 hover:text-washi">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin p-5 space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge label={st?.label} jp={st?.jp} tone={st?.tone} />
            <span className="text-xs text-sumi/40">{clock(order.createdAt)}</span>
          </div>

          {/* buyer */}
          <div className="paper-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-round font-bold text-sm">{order.buyerName}</p>
                <p className="text-xs text-sumi/50">{order.buyerPhone}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg bg-sumi/5">{order.orderType === "DELIVERY" ? "🛵 Delivery" : "🥡 Take Away"}</span>
            </div>
            {order.deliveryAddress && (
              <div className="mt-3 pt-3 border-t border-sumi/10">
                <p className="text-xs text-sumi/60">📍 {order.deliveryAddress}</p>
                {mapUrl && (
                  <a href={mapUrl} target="_blank" className="text-xs font-bold text-shu hover:underline mt-1 inline-block">Buka di Google Maps →</a>
                )}
              </div>
            )}
          </div>

          {/* items */}
          <div className="paper-card rounded-xl p-4 space-y-2">
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span className="text-sumi/70">{it.qty}× {it.menuName}{it.notes ? <span className="text-sumi/40"> · {it.notes}</span> : null}</span>
                <span className="font-semibold">{rupiah(it.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-sumi/20 pt-2 mt-2 space-y-1 text-sm">
              <div className="flex justify-between text-sumi/50"><span>Subtotal</span><span>{rupiah(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Diskon</span><span>− {rupiah(order.discount)}</span></div>}
              {order.tax > 0 && <div className="flex justify-between text-sumi/50"><span>Pajak</span><span>{rupiah(order.tax)}</span></div>}
              {order.deliveryFee > 0 && <div className="flex justify-between text-sumi/50"><span>Ongkir</span><span>{rupiah(order.deliveryFee)}</span></div>}
              <div className="flex justify-between font-display font-extrabold text-shu text-lg pt-1"><span>Total</span><span>{rupiah(order.total)}</span></div>
            </div>
          </div>

          {/* payment */}
          {order.payment && (
            <div className="paper-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-round font-bold text-sm">Pembayaran</p>
                <StatusBadge label={PAYMENT_STATUS[order.payment.status]?.label} tone={PAYMENT_STATUS[order.payment.status]?.tone} />
              </div>
              {order.payment.proofImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.payment.proofImage} alt="bukti" className="rounded-lg max-h-56 w-full object-contain bg-white ring-1 ring-sumi/10" />
              ) : (
                <p className="text-xs text-sumi/40">Belum ada bukti pembayaran.</p>
              )}
              {order.payment.notes && <p className="text-xs text-sumi/50 mt-2">Catatan: {order.payment.notes}</p>}
            </div>
          )}
        </div>

        {/* actions */}
        <div className="border-t border-sumi/10 bg-paper p-4 space-y-2">
          {order.status === "WAITING_PAYMENT_VERIFICATION" && !showReject && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="matcha" disabled={busy} onClick={() => act(`/api/orders/${order.id}/verify`, { action: "approve" })}>✓ Approve</Button>
              <Button variant="outline" disabled={busy} onClick={() => setShowReject(true)}>✕ Tolak</Button>
            </div>
          )}
          {order.status === "WAITING_PAYMENT_VERIFICATION" && showReject && (
            <div className="space-y-2">
              <input value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Alasan penolakan…" className="w-full rounded-lg border border-sumi/15 bg-washi/50 px-3 py-2 text-sm outline-none focus:border-shu" />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" disabled={busy} onClick={() => act(`/api/orders/${order.id}/verify`, { action: "reject", notes: rejectNote })}>Tolak Bukti</Button>
                <Button variant="ghost" onClick={() => setShowReject(false)}>Batal</Button>
              </div>
            </div>
          )}
          {NEXT[order.status] && (
            <Button disabled={busy} onClick={() => act(`/api/orders/${order.id}/status`, { status: NEXT[order.status] })} className="w-full">
              {NEXT_LABEL[order.status]}
            </Button>
          )}
          <div className="flex gap-2">
            {order.conversationId && (
              <Link href={`/dashboard/chats`} className="flex-1">
                <Button variant="ghost" className="w-full">💬 Chat</Button>
              </Link>
            )}
            <Link href={`/order/${order.id}`} target="_blank" className="flex-1">
              <Button variant="ghost" className="w-full">🔗 Link Order</Button>
            </Link>
            {!["COMPLETED", "CANCELLED"].includes(order.status) && (
              <Button variant="ghost" className="text-rose-600" disabled={busy} onClick={() => act(`/api/orders/${order.id}/status`, { status: "CANCELLED" })}>Batalkan</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
