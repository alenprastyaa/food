"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Logo } from "@/components/ui";

type NavItem = { href: string; label: string; jp: string; icon: string; owner?: boolean };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", jp: "ホーム", icon: "🏠" },
  { href: "/dashboard/chats", label: "Chat", jp: "チャット", icon: "💬" },
  { href: "/dashboard/orders", label: "Order", jp: "注文", icon: "🧾" },
  { href: "/dashboard/queue", label: "Antrian Dapur", jp: "調理", icon: "🍳" },
  { href: "/dashboard/reservations", label: "Reservasi", jp: "予約", icon: "📅" },
  { href: "/dashboard/finance", label: "Keuangan", jp: "会計", icon: "📊" },
  { href: "/dashboard/menu", label: "Menu", jp: "メニュー", icon: "🍱", owner: true },
  { href: "/dashboard/outlets", label: "Outlet", jp: "店舗", icon: "🏮", owner: true },
  { href: "/dashboard/cashiers", label: "Kasir", jp: "スタッフ", icon: "👤", owner: true },
  { href: "/dashboard/qris", label: "QRIS", jp: "支払", icon: "🏧", owner: true },
  { href: "/dashboard/settings", label: "Setting", jp: "設定", icon: "⚙️", owner: true },
];

export default function Sidebar({ user }: { user: { name: string; role: string; outletName?: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => !n.owner || user.role === "OWNER");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  return (
    <>
      {/* mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-sumi text-washi px-4 h-14">
        <Logo size={32} />
        <button onClick={() => setOpen(!open)} className="text-2xl">☰</button>
      </div>

      <aside
        className={clsx(
          "fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 bg-sumi text-washi flex flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="noren h-1.5 w-full" />
        <div className="p-5">
          <Logo size={38} />
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto scroll-thin">
          {items.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-round font-bold transition group",
                  active ? "bg-shu text-white shadow-[0_3px_0_var(--color-shu-dark)]" : "text-washi/60 hover:bg-washi/10 hover:text-washi"
                )}
              >
                <span className="text-base w-5 text-center">{n.icon}</span>
                <span className="flex-1">{n.label}</span>
                <span className={clsx("font-display text-[11px]", active ? "text-white/70" : "text-washi/25")}>{n.jp}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-washi/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="hanko h-9 w-9 text-sm shrink-0">{user.name.charAt(0)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-[11px] text-washi/50 truncate">
                {user.role === "OWNER" ? "Owner · 全店舗" : user.outletName ?? "Kasir"}
              </p>
            </div>
          </div>
          <button onClick={logout} className="mt-1 w-full text-left rounded-lg px-3 py-2 text-sm text-washi/60 hover:bg-shu/20 hover:text-shu-light transition font-round font-bold">
            ↩ Keluar
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-sumi/50 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
