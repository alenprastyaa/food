"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePoll } from "@/lib/hooks";
import { rupiah, rupiahShort } from "@/lib/format";
import { PageHeader, PageBody, Panel } from "@/components/dash";
import { RevenueAreaChart, TopMenuBarChart } from "@/components/charts";
import {
  IconChat, IconReceipt, IconWallet, IconCheckCircle, IconClock,
  IconFlame, IconPackage, IconTrendingUp, IconStore, IconTrophy,
} from "@/components/icons";

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

/**
 * Solid, saturated card per metric. White text throughout, so shades are
 * picked for contrast against white rather than for pastel prettiness.
 */
const TONE: Record<string, string> = {
  blue: "bg-blue-600 hover:bg-blue-700",
  amber: "bg-amber-600 hover:bg-amber-700",
  orange: "bg-orange-600 hover:bg-orange-700",
  violet: "bg-violet-600 hover:bg-violet-700",
  cyan: "bg-cyan-600 hover:bg-cyan-700",
  rose: "bg-rose-600 hover:bg-rose-700",
  emerald: "bg-emerald-600 hover:bg-emerald-700",
  green: "bg-green-600 hover:bg-green-700",
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

  const [greet, setGreet] = useState("Halo");
  useEffect(() => {
    const hour = new Date().getHours();
    setGreet(hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam");
  }, []);

  const peakRevenue = o ? Math.max(0, ...o.monthly.map((d) => d.total)) : 0;

  const tiles = [
    { label: "Chat Aktif", value: c.activeChats, href: "/dashboard/chats", tone: "blue", Icon: IconChat },
    { label: "Order Baru", value: c.newOrders, href: "/dashboard/orders", tone: "amber", Icon: IconReceipt, live: c.newOrders > 0 },
    { label: "Menunggu Bayar", value: c.waitingPayment, href: "/dashboard/orders", tone: "orange", Icon: IconWallet },
    { label: "Verifikasi Bayar", value: c.waitingVerif, href: "/dashboard/orders", tone: "violet", Icon: IconCheckCircle, live: c.waitingVerif > 0 },
    { label: "Antrian", value: c.queued, href: "/dashboard/queue", tone: "cyan", Icon: IconClock },
    { label: "Dimasak", value: c.cooking, href: "/dashboard/queue", tone: "rose", Icon: IconFlame },
    { label: "Siap Diambil", value: c.ready, href: "/dashboard/queue", tone: "emerald", Icon: IconPackage },
    { label: "Order Hari Ini", value: c.todayOrders, href: "/dashboard/orders", tone: "green", Icon: IconTrendingUp },
  ];

  return (
    <div>
      <PageHeader
        title={`${greet}, ${user.name.split(" ")[0]}`}
        subtitle={user.role === "OWNER" ? "Ringkasan seluruh outlet" : "Ringkasan outletmu hari ini"}
      >
        <div className="text-right">
          <p className="text-xs text-gray-5">Pendapatan hari ini</p>
          <p className="text-xl lg:text-2xl font-semibold text-dark-1 tracking-tight">{rupiah(c.revenueToday)}</p>
        </div>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* operational counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tiles.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={`group rounded-xl p-4 text-white shadow-sm transition ${TONE[t.tone]}`}
            >
              <div className="flex items-start justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/20">
                  <t.Icon className="h-[18px] w-[18px]" />
                </span>
                {t.live && <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />}
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{t.value}</p>
              <p className="text-sm font-medium text-white/90 mt-0.5">{t.label}</p>
            </Link>
          ))}
        </div>

        {/* Owner analytics */}
        {o && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard label="Revenue Semua Outlet" value={rupiah(o.revenueAll)} Icon={IconWallet} accent />
              <SummaryCard label="Total Order" value={o.totalOrders.toLocaleString("id-ID")} Icon={IconReceipt} />
              <SummaryCard label="Total Chat" value={o.totalChats.toLocaleString("id-ID")} Icon={IconChat} />
              <SummaryCard label="Outlet Aktif" value={o.outletCount.toString()} Icon={IconStore} />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Panel
                title="Pendapatan 30 Hari"
                className="lg:col-span-2"
                action={
                  <span className="text-sm text-gray-5">
                    Tertinggi <span className="font-semibold text-dark-1">{rupiahShort(peakRevenue)}</span>
                  </span>
                }
              >
                <RevenueAreaChart data={o.monthly} />
              </Panel>

              <Panel title="Menu Terlaris">
                <TopMenuBarChart data={o.bestMenus} />
              </Panel>
            </div>

            <Panel title="Performa per Outlet" bodyClassName="p-0">
              {o.perOutlet.length === 0 ? (
                <p className="p-5 text-sm text-gray-5">Belum ada data outlet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead>
                      <tr className="border-b border-gray-4 text-left">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-5">Outlet</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-5 text-right">Revenue</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-5 text-right">Order</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-5 text-right">Chat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.perOutlet.map((p, i) => (
                        <tr key={p.id} className="border-b border-gray-4 last:border-0 hover:bg-gray-3/60 transition">
                          <td className="px-5 py-3.5">
                            <span className="flex items-center gap-2 font-medium text-dark-2">
                              {i === 0 && <IconTrophy className="h-4 w-4 text-warning" />}
                              <span className="truncate">{p.name}</span>
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-dark-1 tabular-nums">{rupiahShort(p.revenue)}</td>
                          <td className="px-5 py-3.5 text-right text-gray-5 tabular-nums">{p.orders}</td>
                          <td className="px-5 py-3.5 text-right text-gray-5 tabular-nums">{p.chats}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </>
        )}
      </PageBody>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  Icon,
  accent,
}: {
  label: string;
  value: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  /** Fills the card — reserved for the headline revenue figure. */
  accent?: boolean;
}) {
  if (accent) {
    return (
      <div className="rounded-xl bg-primary p-4 text-white shadow-sm">
        <div className="flex items-center gap-2 text-white/80">
          <Icon className="h-4 w-4" />
          <p className="text-xs font-medium truncate">{label}</p>
        </div>
        <p className="mt-2 text-xl font-semibold tracking-tight tabular-nums">{value}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-6 bg-white p-4">
      <div className="flex items-center gap-2 text-gray-5">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-medium truncate">{label}</p>
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-dark-1 tabular-nums">{value}</p>
    </div>
  );
}

