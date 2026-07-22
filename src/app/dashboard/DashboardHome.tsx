"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePoll } from "@/lib/hooks";
import { rupiah, rupiahShort } from "@/lib/format";
import { PageHeader } from "@/components/dash";

type Cashier = {
  activeChats: number; newOrders: number; waitingPayment: number; waitingVerif: number;
  queued: number; cooking: number; ready: number; todayOrders: number; revenueToday: number;
};
type Owner = {
  revenueAll: number; totalOrders: number; totalChats: number; todayOrders: number; todayRevenue: number;
  perOutlet: { id: string; name: string; revenue: number; orders: number; chats: number }[];
  bestMenus: { name: string; qty: number; revenue: number }[];
  monthly: { date: string; total: number }[];
  outletCount: number;
};

export default function DashboardHome({
  user,
  initialCashier,
  initialOwner,
}: {
  user: { name: string; role: string };
  initialCashier: Cashier;
  initialOwner: Owner | null;
}) {
  const { data } = usePoll<{ cashier: Cashier; owner?: Owner }>("/api/dashboard", 4000);
  const c = data?.cashier ?? initialCashier;
  const o = data?.owner ?? initialOwner ?? undefined;
  const [greet, setGreet] = useState("Konnichiwa");
  useEffect(() => {
    const hour = new Date().getHours();
    setGreet(hour < 11 ? "Ohayō" : hour < 18 ? "Konnichiwa" : "Konbanwa");
  }, []);

  const tiles: { label: string; jp: string; value: number; href: string; tone: string; live?: boolean }[] = [
    { label: "Chat Aktif", jp: "会話", value: c.activeChats, href: "/dashboard/chats", tone: "sky" },
    { label: "Order Baru", jp: "新規", value: c.newOrders, href: "/dashboard/orders", tone: "amber", live: c.newOrders > 0 },
    { label: "Menunggu Bayar", jp: "支払", value: c.waitingPayment, href: "/dashboard/orders", tone: "amber" },
    { label: "Verifikasi Bayar", jp: "確認", value: c.waitingVerif, href: "/dashboard/orders", tone: "violet", live: c.waitingVerif > 0 },
    { label: "Antrian", jp: "待機", value: c.queued, href: "/dashboard/queue", tone: "sky" },
    { label: "Dimasak", jp: "調理", value: c.cooking, href: "/dashboard/queue", tone: "orange" },
    { label: "Siap", jp: "完了", value: c.ready, href: "/dashboard/queue", tone: "emerald" },
    { label: "Order Hari Ini", jp: "本日", value: c.todayOrders, href: "/dashboard/orders", tone: "green" },
  ];

  const toneBar: Record<string, string> = {
    sky: "before:bg-sky-400", amber: "before:bg-amber-400", violet: "before:bg-violet-400",
    orange: "before:bg-orange-400", emerald: "before:bg-emerald-400", green: "before:bg-green-500",
  };

  return (
    <div>
      <PageHeader
        title={`${greet}, ${user.name.split(" ")[0]} 🌸`}
        jp="ダッシュボード"
        subtitle={user.role === "OWNER" ? "Ringkasan seluruh outlet Nashi Katsu" : "Ringkasan outletmu hari ini"}
      >
        <div className="text-right">
          <p className="text-xs text-sumi/50">Pendapatan hari ini</p>
          <p className="font-display text-2xl font-extrabold text-shu">{rupiah(c.revenueToday)}</p>
        </div>
      </PageHeader>

      <div className="p-5 lg:p-8 space-y-8">
        {/* widget grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tiles.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={`paper-card rounded-2xl p-4 relative overflow-hidden hover:-translate-y-0.5 transition before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${toneBar[t.tone]}`}
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold text-sumi/50">{t.label}</p>
                {t.live && <span className="h-2 w-2 rounded-full bg-shu pulse-ring" />}
              </div>
              <p className="font-display text-3xl font-extrabold text-sumi mt-1">{t.value}</p>
              <p className="font-display text-[11px] text-sumi/30 absolute right-3 bottom-2">{t.jp}</p>
            </Link>
          ))}
        </div>

        {/* Owner analytics */}
        {o && (
          <>
            <div className="grid md:grid-cols-4 gap-3">
              <BigStat label="Revenue Semua Outlet" jp="総売上" value={rupiah(o.revenueAll)} accent />
              <BigStat label="Total Order" jp="注文" value={o.totalOrders.toString()} />
              <BigStat label="Total Chat" jp="会話" value={o.totalChats.toString()} />
              <BigStat label="Outlet Aktif" jp="店舗" value={o.outletCount.toString()} />
            </div>

            <div className="grid lg:grid-cols-3 gap-5">
              {/* monthly revenue */}
              <div className="lg:col-span-2 paper-card rounded-2xl p-5">
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="font-display text-lg font-extrabold">Pendapatan 30 Hari</h3>
                  <span className="font-round text-xs text-sumi/40">月間売上</span>
                </div>
                <MonthlyBars data={o.monthly} />
              </div>

              {/* best menus */}
              <div className="paper-card rounded-2xl p-5">
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="font-display text-lg font-extrabold">Menu Terlaris</h3>
                  <span className="font-round text-xs text-sumi/40">人気</span>
                </div>
                <div className="space-y-3">
                  {o.bestMenus.map((m, i) => {
                    const max = o.bestMenus[0]?.qty || 1;
                    return (
                      <div key={m.name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-round font-bold text-sumi truncate flex items-center gap-1.5">
                            <span className="text-shu font-display">{i + 1}</span> {m.name}
                          </span>
                          <span className="text-sumi/50 text-xs shrink-0">{m.qty}x</span>
                        </div>
                        <div className="h-2 rounded-full bg-sumi/5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-shu to-kin" style={{ width: `${(m.qty / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* per outlet */}
            <div className="paper-card rounded-2xl p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="font-display text-lg font-extrabold">Performa per Outlet</h3>
                <span className="font-round text-xs text-sumi/40">店舗別</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {o.perOutlet.map((p, i) => {
                  const max = o.perOutlet[0]?.revenue || 1;
                  return (
                    <div key={p.id} className="rounded-xl bg-washi/60 ring-1 ring-sumi/5 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-round font-bold text-sm flex items-center gap-2">
                          {i === 0 && <span className="text-kin">🏆</span>}
                          {p.name}
                        </p>
                        <span className="font-display font-extrabold text-shu">{rupiahShort(p.revenue)}</span>
                      </div>
                      <div className="mt-2 h-2.5 rounded-full bg-sumi/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-matcha to-kin" style={{ width: `${(p.revenue / max) * 100}%` }} />
                      </div>
                      <div className="mt-2 flex gap-4 text-xs text-sumi/50">
                        <span>{p.orders} order</span>
                        <span>{p.chats} chat</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BigStat({ label, jp, value, accent }: { label: string; jp: string; value: string; accent?: boolean }) {
  return (
    <div className="paper-card rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute -right-2 -top-3 font-display text-5xl opacity-[0.06]">{jp}</div>
      <p className="text-xs font-semibold text-sumi/50">{label}</p>
      <p className={`mt-1 font-display text-2xl font-extrabold ${accent ? "text-shu" : "text-sumi"}`}>{value}</p>
    </div>
  );
}

function MonthlyBars({ data }: { data: { date: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div>
      <div className="flex items-end gap-1 h-40">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 group relative flex flex-col justify-end h-full">
            <div
              className="w-full rounded-t bg-gradient-to-t from-shu/70 to-shu group-hover:from-shu group-hover:to-shu-light transition-all"
              style={{ height: `${Math.max((d.total / max) * 100, 2)}%` }}
            />
            {d.total > 0 && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-sumi text-washi text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                {rupiahShort(d.total)}
              </div>
            )}
            {i % 5 === 0 && <span className="text-[9px] text-sumi/30 text-center mt-1">{d.date.slice(8)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
