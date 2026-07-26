"use client";
import { useState } from "react";
import { usePoll } from "@/lib/hooks";
import { rupiah, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/dash";
import type { FullOrder } from "@/components/OrderDrawer";

const COLS = [
  { key: "QUEUED", label: "Antrian", jp: "待機列", icon: "📋", accent: "border-sky-400 bg-sky-50", next: "COOKING", nextLabel: "Masak →" },
  { key: "COOKING", label: "Dimasak", jp: "調理中", icon: "🍳", accent: "border-orange-400 bg-orange-50", next: "READY", nextLabel: "Siap →" },
  { key: "READY", label: "Siap", jp: "準備完了", icon: "🍱", accent: "border-emerald-400 bg-emerald-50", next: "COMPLETED", nextLabel: "Selesai ✓" },
  { key: "COMPLETED", label: "Selesai", jp: "完了", icon: "🎉", accent: "border-slate-300 bg-slate-50", next: null, nextLabel: "" },
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
      <PageHeader title="Antrian Dapur" jp="調理場" subtitle="Pantau & gerakkan pesanan sepanjang alur dapur">
        <div className="flex items-center gap-1.5 text-xs text-sumi/50">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live
        </div>
      </PageHeader>

      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {COLS.map((col) => {
            const items = orders.filter((o) => o.status === col.key).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
            return (
              <div key={col.key} className={`rounded-2xl border-t-4 ${col.accent} ring-1 ring-sumi/5 flex flex-col min-h-[60vh]`}>
                <div className="px-4 py-3 flex items-center justify-between sticky top-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{col.icon}</span>
                    <div>
                      <p className="font-round font-extrabold text-sm text-sumi">{col.label}</p>
                      <p className="font-display text-[10px] text-sumi/40">{col.jp}</p>
                    </div>
                  </div>
                  <span className="grid place-items-center h-7 w-7 rounded-full bg-white/70 font-display font-extrabold text-sm text-sumi ring-1 ring-sumi/10">{items.length}</span>
                </div>

                <div className="flex-1 px-2.5 pb-3 space-y-2.5 overflow-y-auto scroll-thin">
                  {items.length === 0 && <p className="text-center text-xs text-sumi/30 py-8">Kosong</p>}
                  {items.map((o) => (
                    <div key={o.id} className="paper-card rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-round font-bold text-xs text-sumi">{o.invoiceNumber.replace("NK-", "#")}</span>
                        <span className="text-[10px] text-sumi/40">{timeAgo(o.createdAt)}</span>
                      </div>
                      {o.payment?.method === "COD" && o.payment.status !== "PAID" && (
                        <span className="inline-block mt-1 text-[10px] font-bold rounded-full px-2 py-0.5 bg-amber-100 text-amber-700">💵 COD · belum bayar</span>
                      )}
                      <p className="text-sm font-round font-bold text-sumi mt-1 truncate">{o.buyerName}</p>
                      {o.scheduledFor && new Date(o.scheduledFor).getTime() > Date.now() && (
                        <p className="text-[10px] font-bold text-amber-600">🕒 {new Date(o.scheduledFor).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}</p>
                      )}
                      <div className="mt-1.5 space-y-0.5">
                        {o.items.map((it) => (
                          <p key={it.id} className="text-xs text-sumi/60 truncate">
                            <span className="font-bold text-shu">{it.qty}×</span> {it.menuName}
                            {it.forName && <span className="font-bold text-sumi"> ({it.forName})</span>}
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
                          className="mt-2 w-full rounded-lg bg-sumi text-washi text-xs font-round font-bold py-2 btn-press hover:bg-sumi-soft disabled:opacity-50"
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
