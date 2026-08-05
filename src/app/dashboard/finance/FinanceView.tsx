"use client";
import { useEffect, useState } from "react";
import { rupiah, clock, ORDER_STATUS } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/dash";
import { IconChart } from "@/components/icons";
import { StatusBadge } from "@/components/ui";

type Report = {
  revenue: number;
  orderCount: number;
  cancelled: number;
  paidCount: number;
  avgOrder: number;
  orders: {
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
    createdAt: string;
    buyerName: string;
    orderType: string;
    outlet?: { name: string };
    payment: { status: string } | null;
  }[];
};

const RANGES = [
  { key: "day", label: "Hari Ini" },
  { key: "week", label: "7 Hari" },
  { key: "month", label: "30 Hari" },
];

export default function FinanceView({ role, outlets }: { role: string; outlets: { id: string; name: string }[] }) {
  const [range, setRange] = useState("week");
  const [outletId, setOutletId] = useState("");
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/finance?range=${range}${outletId ? `&outletId=${outletId}` : ""}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [range, outletId]);

  return (
    <div>
      <PageHeader title="Keuangan" subtitle={role === "OWNER" ? "Laporan seluruh outlet" : "Laporan outletmu"} />

      <div className="p-5 lg:p-8 space-y-5">
        {/* filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 bg-paper rounded-full p-1 ring-1 ring-sumi/10">
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setRange(r.key)} className={`rounded-full px-4 py-1.5 text-sm font-round font-semibold transition ${range === r.key ? "bg-shu text-white" : "text-sumi/60"}`}>
                {r.label}
              </button>
            ))}
          </div>
          {role === "OWNER" && (
            <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="rounded-xl border border-sumi/15 bg-paper px-4 py-2 text-sm font-round font-semibold outline-none focus:border-shu">
              <option value="">Semua Outlet</option>
              {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
        </div>

        {loading || !data ? (
          <p className="text-sumi/40 text-sm">Memuat laporan…</p>
        ) : (
          <>
            {/* summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <Card label="Revenue" value={rupiah(data.revenue)} accent big />
              <Card label="Total Order" value={data.orderCount.toString()} />
              <Card label="Pembayaran" value={data.paidCount.toString()} />
              <Card label="Dibatalkan" value={data.cancelled.toString()} tone="text-rose-500" />
              <Card label="Rata-rata" value={rupiah(data.avgOrder)} />
            </div>

            {/* orders table */}
            <div className="paper-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-sumi/10 flex items-center justify-between">
                <h3 className="font-display font-bold">Rincian Transaksi</h3>
                <span className="text-xs text-sumi/40">{data.orders.length} transaksi</span>
              </div>
              {data.orders.length === 0 ? (
                <EmptyState icon={<IconChart className="h-6 w-6" />} title="Belum ada transaksi" subtitle="Coba ubah rentang waktu." />
              ) : (
                <div className="overflow-x-auto scroll-thin">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-sumi/50 border-b border-sumi/10">
                        <th className="px-5 py-2.5 font-semibold">Invoice</th>
                        <th className="px-3 py-2.5 font-semibold">Pembeli</th>
                        {role === "OWNER" && <th className="px-3 py-2.5 font-semibold">Outlet</th>}
                        <th className="px-3 py-2.5 font-semibold">Tipe</th>
                        <th className="px-3 py-2.5 font-semibold">Status</th>
                        <th className="px-3 py-2.5 font-semibold">Waktu</th>
                        <th className="px-5 py-2.5 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.map((o) => {
                        const st = ORDER_STATUS[o.status];
                        return (
                          <tr key={o.id} className="border-b border-sumi/5 hover:bg-washi/50">
                            <td className="px-5 py-2.5 font-round font-semibold text-sumi">{o.invoiceNumber}</td>
                            <td className="px-3 py-2.5 text-sumi/70">{o.buyerName}</td>
                            {role === "OWNER" && <td className="px-3 py-2.5 text-sumi/50 text-xs">{o.outlet?.name.replace("Nashi Katsu — ", "")}</td>}
                            <td className="px-3 py-2.5">{o.orderType === "DELIVERY" ? "🛵" : "🥡"}</td>
                            <td className="px-3 py-2.5"><StatusBadge label={st?.label} tone={st?.tone} /></td>
                            <td className="px-3 py-2.5 text-sumi/40 text-xs">{clock(o.createdAt)}</td>
                            <td className="px-5 py-2.5 text-right font-display font-bold text-shu">{rupiah(o.total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, accent, tone, big }: { label: string; value: string; accent?: boolean; tone?: string; big?: boolean }) {
  return (
    <div className={`paper-card rounded-2xl p-4 relative overflow-hidden ${big ? "col-span-2 lg:col-span-1" : ""}`}>
      <p className="text-xs font-semibold text-sumi/50">{label}</p>
      <p className={`mt-1 font-display font-bold ${big ? "text-2xl" : "text-xl"} ${tone ?? (accent ? "text-shu" : "text-sumi")}`}>{value}</p>
    </div>
  );
}
