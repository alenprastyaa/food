"use client";
import { useState } from "react";
import { usePoll } from "@/lib/hooks";
import { rupiah, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/dash";
import type { FullOrder } from "@/components/OrderDrawer";
import { IconClock, IconFlame, IconPackage, IconCheckCircle } from "@/components/icons";

const COLS = [
  { key: "QUEUED", label: "Antrian", Icon: IconClock, accent: "bg-sky-50 text-sky-600", bar: "bg-sky-400", next: "COOKING", nextLabel: "Masak" },
  { key: "COOKING", label: "Dimasak", Icon: IconFlame, accent: "bg-orange-50 text-orange-600", bar: "bg-orange-400", next: "READY", nextLabel: "Siap" },
  { key: "READY", label: "Siap", Icon: IconPackage, accent: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-400", next: "COMPLETED", nextLabel: "Selesai" },
  { key: "COMPLETED", label: "Selesai", Icon: IconCheckCircle, accent: "bg-gray-3 text-gray-5", bar: "bg-gray-6", next: null, nextLabel: "" },
];

export default function QueueBoard({ role }: { role: string }) {
  const { data, reload } = usePoll<{ orders: FullOrder[] }>("/api/orders?status=QUEUED,COOKING,READY,COMPLETED", 3000);
  const [busy, setBusy] = useState<string | null>(null);
  const orders = data?.orders ?? [];

  async function advance(id: string, status: string) {
    setBusy(id);
    await fetch(`/api/orders/${id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null);
    reload();
  }

  return (
    <div>
      <PageHeader title="Antrian Dapur" subtitle="Pantau & gerakkan pesanan sepanjang alur dapur">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live
        </div>
      </PageHeader>

      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLS.map((col) => {
            const items = orders.filter((o) => o.status === col.key).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
            return (
              <div key={col.key} className="rounded-xl border border-gray-6 bg-white flex flex-col min-h-[60vh] overflow-hidden">
                <div className={`h-1 w-full ${col.bar}`} />
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-4">
                  <div className="flex items-center gap-2.5">
                    <span className={`grid h-8 w-8 place-items-center rounded-lg ${col.accent}`}>
                      <col.Icon className="h-[18px] w-[18px]" />
                    </span>
                    <p className="font-semibold text-sm text-dark-1">{col.label}</p>
                  </div>
                  <span className="grid place-items-center h-6 min-w-6 px-1.5 rounded-full bg-gray-3 font-semibold text-xs text-gray-8 tabular-nums">{items.length}</span>
                </div>

                <div className="flex-1 px-2.5 pb-3 space-y-2.5 overflow-y-auto scroll-thin">
                  {items.length === 0 && <p className="text-center text-xs text-gray-2 py-8">Kosong</p>}
                  {items.map((o) => (
                    <div key={o.id} className="paper-card rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        {o.queueNumber != null ? (
                          <span className="font-display font-bold text-base text-shu">#{o.queueNumber}</span>
                        ) : (
                          <span className="font-round font-semibold text-xs text-sumi">{o.invoiceNumber.replace("NK-", "#")}</span>
                        )}
                        <span className="text-[10px] text-sumi/40">{timeAgo(o.createdAt)}</span>
                      </div>
                      {o.payment?.method === "COD" && o.payment.status !== "PAID" && (
                        <span className="inline-block mt-1 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-amber-100 text-amber-700">💵 COD · belum bayar</span>
                      )}
                      <p className="text-sm font-round font-semibold text-sumi mt-1 truncate">{o.buyerName}</p>
                      {o.scheduledFor && new Date(o.scheduledFor).getTime() > Date.now() && (
                        <p className="text-[10px] font-semibold text-amber-600">🕒 {new Date(o.scheduledFor).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</p>
                      )}
                      <div className="mt-1.5 space-y-0.5">
                        {o.items.map((it) => (
                          <p key={it.id} className="text-xs text-sumi/60 truncate">
                            <span className="font-semibold text-shu">{it.qty}×</span> {it.menuName}
                            {it.forName && <span className="font-semibold text-sumi"> ({it.forName})</span>}
                            {it.options.length > 0 && <span className="text-sumi/50"> · {it.options.map((op) => op.optionName).join(", ")}</span>}
                            {it.notes ? <span className="text-amber-600"> · {it.notes}</span> : null}
                          </p>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-sumi/5">
                        <span className="text-[11px] text-sumi/50">{o.orderType === "DELIVERY" ? "🛵 Antar" : "🥡 Ambil"} · {rupiah(o.total)}</span>
                      </div>
                      {col.next && (
                        <button
                          onClick={() => advance(o.id, col.next!)}
                          disabled={busy === o.id}
                          className="mt-2 w-full rounded-lg bg-sumi text-washi text-xs font-round font-semibold py-2 btn-press hover:bg-sumi-soft disabled:opacity-50"
                        >
                          {busy === o.id ? "…" : col.nextLabel}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {role === "OWNER" && <p className="text-xs text-sumi/40 mt-4">Menampilkan antrian seluruh outlet.</p>}
      </div>
    </div>
  );
}
