"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Logo } from "@/components/ui";
import {
  IconDashboard, IconChat, IconReceipt, IconChefHat, IconCalendar, IconChart,
  IconUtensils, IconStore, IconUsers, IconQrCode, IconSettings,
  IconLogOut, IconMenuBars, IconX,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  owner?: boolean;
};

const OPERATIONS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
  { href: "/dashboard/chats", label: "Chat", Icon: IconChat },
  { href: "/dashboard/orders", label: "Order", Icon: IconReceipt },
  { href: "/dashboard/queue", label: "Antrian Dapur", Icon: IconChefHat },
  { href: "/dashboard/reservations", label: "Reservasi", Icon: IconCalendar },
  { href: "/dashboard/finance", label: "Keuangan", Icon: IconChart },
];

const MANAGEMENT: NavItem[] = [
  { href: "/dashboard/menu", label: "Menu", Icon: IconUtensils, owner: true },
  { href: "/dashboard/outlets", label: "Outlet", Icon: IconStore, owner: true },
  { href: "/dashboard/cashiers", label: "Kasir", Icon: IconUsers, owner: true },
  { href: "/dashboard/qris", label: "QRIS", Icon: IconQrCode, owner: true },
  { href: "/dashboard/settings", label: "Pengaturan", Icon: IconSettings, owner: true },
];

export default function Sidebar({ user }: { user: { name: string; role: string; outletName?: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isOwner = user.role === "OWNER";
  const management = MANAGEMENT.filter((n) => !n.owner || isOwner);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  const renderItem = (n: NavItem) => {
    const active = isActive(n.href);
    return (
      <Link
        key={n.href}
        href={n.href}
        onClick={() => setOpen(false)}
        aria-current={active ? "page" : undefined}
        className={clsx(
          "relative flex items-center gap-3 rounded-lg px-3 h-10 text-sm transition",
          active
            ? "bg-primary-light text-primary font-semibold"
            : "text-gray-8 font-medium hover:bg-gray-3 hover:text-dark-1"
        )}
      >
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />}
        <n.Icon className={clsx("h-[18px] w-[18px]", active ? "text-primary" : "text-gray-5")} />
        <span className="flex-1 truncate">{n.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-gray-4 px-4 h-14">
        <Logo size={40} />
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className="grid h-9 w-9 place-items-center rounded-lg text-gray-8 hover:bg-gray-3 transition"
        >
          {open ? <IconX className="h-5 w-5" /> : <IconMenuBars className="h-5 w-5" />}
        </button>
      </div>

      <aside
        className={clsx(
          "fixed lg:sticky top-0 z-40 h-screen w-64 shrink-0 bg-white border-r border-gray-4 flex flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-5 border-b border-gray-4 shrink-0">
          <Logo size={42} />
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto scroll-thin">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-2">Operasional</p>
          <div className="space-y-0.5">{OPERATIONS.map(renderItem)}</div>

          {management.length > 0 && (
            <>
              <p className="px-3 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-2">Manajemen</p>
              <div className="space-y-0.5">{management.map(renderItem)}</div>
            </>
          )}
        </nav>

        <div className="border-t border-gray-4 p-3 shrink-0">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-light text-primary text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-dark-1 truncate">{user.name}</p>
              <p className="text-xs text-gray-5 truncate">
                {isOwner ? "Owner · Semua Outlet" : user.outletName ?? "Kasir"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 h-10 text-sm font-medium text-gray-8 hover:bg-primary-light hover:text-primary transition"
          >
            <IconLogOut className="h-[18px] w-[18px]" />
            Keluar
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-overlay-2 lg:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
