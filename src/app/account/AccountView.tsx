"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo, Button, MenuImage } from "@/components/ui";
import { rupiah, timeAgo, ORDER_STATUS } from "@/lib/format";
import { StatusBadge } from "@/components/ui";
import { EmptyState } from "@/components/dash";

type Order = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  orderType: string;
  createdAt: string;
  outlet: { name: string };
  items: { id: string; menuName: string; qty: number }[];
};

type Reservation = {
  id: string;
  partySize: number;
  reservedFor: string;
  status: string;
  outlet: { name: string };
};

const RESERVATION_STATUS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Menunggu", tone: "amber" },
  CONFIRMED: { label: "Dikonfirmasi", tone: "sky" },
  COMPLETED: { label: "Selesai", tone: "emerald" },
  CANCELLED: { label: "Dibatalkan", tone: "rose" },
};

export default function AccountView() {
  const router = useRouter();
  const [buyer, setBuyer] = useState<{ name: string; phone: string; email: string | null; points: number } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/buyer/me")
      .then((r) => r.json())
      .then((d) => {
        setBuyer(d.buyer ?? null);
        setOrders(d.orders ?? []);
        setReservations(d.reservations ?? []);
        setLoading(false);
      });
  }, []);

  async function logout() {
    await fetch("/api/buyer/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-asanoha">
      <div className="noren h-2 w-full" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <Logo size={46} />
          <button onClick={logout} className="text-sm font-round font-semibold text-sumi/60 hover:text-shu">Keluar</button>
        </div>

        {buyer && (
          <div className="paper-card rounded-3xl p-5 flex items-center gap-4 mb-5">
            <span className="hanko h-14 w-14 text-xl shrink-0">{buyer.name.charAt(0)}</span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold text-sumi truncate">{buyer.name}</p>
              <p className="text-sm text-sumi/50">{buyer.phone}{buyer.email ? ` · ${buyer.email}` : ""}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-xl font-bold text-shu">🪙 {buyer.points}</p>
              <p className="text-[10px] text-sumi/40">Poin</p>
            </div>
          </div>
        )}

        <h2 className="font-display text-xl font-bold text-sumi mb-3">Riwayat Order</h2>

        {loading ? (
          <p className="text-sumi/40 text-sm">Memuat…</p>
        ) : orders.length === 0 ? (
          <EmptyState icon="🍱" title="Belum ada order" subtitle="Order pertamamu akan muncul di sini." />
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const st = ORDER_STATUS[o.status];
              return (
                <Link key={o.id} href={`/order/${o.id}`} className="paper-card rounded-2xl p-4 flex items-center gap-3 hover:-translate-y-0.5 transition block">
                  <MenuImage image={null} category="Katsu" className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-round font-semibold text-sm text-sumi truncate">{o.invoiceNumber}</p>
                      <span className="text-[10px] text-sumi/40 shrink-0">{timeAgo(o.createdAt)}</span>
                    </div>
                    <p className="text-xs text-sumi/50 truncate">{o.outlet.name.replace("Nashi Katsu — ", "")} · {o.items.length} item</p>
                    <div className="mt-1.5"><StatusBadge label={st?.label} tone={st?.tone} /></div>
                  </div>
                  <span className="font-display font-bold text-shu shrink-0">{rupiah(o.total)}</span>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && reservations.length > 0 && (
          <>
            <h2 className="font-display text-xl font-bold text-sumi mb-3 mt-8">Reservasi Saya</h2>
            <div className="space-y-3">
              {reservations.map((r) => {
                const st = RESERVATION_STATUS[r.status];
                return (
                  <div key={r.id} className="paper-card rounded-2xl p-4 flex items-center gap-3">
                    <span className="hanko h-12 w-12 text-lg shrink-0">📅</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-round font-semibold text-sm text-sumi truncate">{r.outlet.name.replace("Nashi Katsu — ", "")}</p>
                      <p className="text-xs text-sumi/50">
                        {new Date(r.reservedFor).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} · {r.partySize} orang
                      </p>
                      <div className="mt-1.5"><StatusBadge label={st?.label} tone={st?.tone} /></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <Link href="/" className="block mt-6"><Button variant="outline" className="w-full">← Pesan Lagi</Button></Link>
      </div>
    </div>
  );
}
