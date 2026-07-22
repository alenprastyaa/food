"use client";
import { useMemo, useState } from "react";
import { usePoll } from "@/lib/hooks";
import { rupiah, timeAgo, ORDER_STATUS } from "@/lib/format";
import { StatusBadge } from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/dash";
import OrderDrawer, { FullOrder } from "@/components/OrderDrawer";

const FILTERS: { key: string; label: string; statuses: string[] | null }[] = [
  { key: "all", label: "Semua", statuses: null },
  { key: "verify", label: "Perlu Verifikasi", statuses: ["WAITING_PAYMENT_VERIFICATION"] },
  { key: "pay", label: "Menunggu Bayar", statuses: ["WAITING_CONFIRMATION", "WAITING_PAYMENT"] },
  { key: "active", label: "Aktif", statuses: ["QUEUED", "COOKING", "READY"] },
  { key: "done", label: "Selesai", statuses: ["COMPLETED"] },
  { key: "cancel", label: "Batal", statuses: ["CANCELLED"] },
];

export default function OrdersManager({ role }: { role: string }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const { data, reload } = usePoll<{ orders: FullOrder[] }>("/api/orders", 4000);
  const orders = data?.orders ?? [];

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter);
    if (!f?.statuses) return orders;
    return orders.filter((o) => f.statuses!.includes(o.status));
  }, [orders, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILTERS) c[f.key] = f.statuses ? orders.filter((o) => f.statuses!.includes(o.status)).length : orders.length;
    return c;
  }, [orders]);

  const active = orders.find((o) => o.id === selected) ?? null;

  return (
    <div>
      <PageHeader title="Order" jp="注文" subtitle="Kelola pesanan & verifikasi pembayaran">
        <span className="text-sm text-sumi/50">{orders.length} total</span>
      </PageHeader>

      <div className="p-5 lg:p-8">
        <div className="flex gap-2 overflow-x-auto scroll-thin pb-3 -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-round font-bold transition flex items-center gap-2 ${
                filter === f.key ? "bg-shu text-white shadow-[0_3px_0_var(--color-shu-dark)]" : "bg-paper text-sumi/60 ring-1 ring-sumi/10"
              }`}
            >
              {f.label}
              <span className={`text-xs rounded-full px-1.5 ${filter === f.key ? "bg-white/25" : "bg-sumi/10"}`}>{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="🧾" title="Belum ada order di sini" subtitle="Order baru akan muncul otomatis." />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
            {filtered.map((o) => {
              const st = ORDER_STATUS[o.status];
              const needsAction = o.status === "WAITING_PAYMENT_VERIFICATION";
              return (
                <button
                  key={o.id}
                  onClick={() => setSelected(o.id)}
                  className={`paper-card rounded-2xl p-4 text-left hover:-translate-y-0.5 transition relative ${needsAction ? "ring-2 ring-violet-300" : ""}`}
                >
                  {needsAction && <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-violet-500 pulse-ring" />}
                  <div className="flex items-center justify-between">
                    <span className="font-round font-bold text-sm text-sumi">{o.invoiceNumber}</span>
                    <span className="text-[10px] text-sumi/40">{timeAgo(o.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="min-w-0">
                      <p className="text-sm text-sumi/70 truncate">{o.buyerName}</p>
                      <p className="text-[11px] text-sumi/40">
                        {o.orderType === "DELIVERY" ? "🛵" : "🥡"} {o.items.length} item
                        {role === "OWNER" && o.outlet ? ` · ${o.outlet.name.replace("Nashi Katsu — ", "")}` : ""}
                      </p>
                    </div>
                    <span className="font-display font-extrabold text-shu">{rupiah(o.total)}</span>
                  </div>
                  <div className="mt-3">
                    <StatusBadge label={st?.label} jp={st?.jp} tone={st?.tone} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {active && <OrderDrawer order={active} onClose={() => setSelected(null)} onChanged={reload} />}
    </div>
  );
}
