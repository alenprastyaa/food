import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui";
import { getBuyerSession } from "@/lib/buyerAuth";
import { isOutletOpen } from "@/lib/outlet";
import Shop from "./Shop";

export const dynamic = "force-dynamic";

export default async function OutletPage({ params }: { params: Promise<{ outletId: string }> }) {
  const { outletId } = await params;
  const outlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    include: {
      menus: {
        where: { isAvailable: true },
        orderBy: { price: "asc" },
        include: { optionGroups: { include: { options: true } } },
      },
      ratings: true,
    },
  });
  if (!outlet) notFound();
  const avgRating = outlet.ratings.length > 0 ? outlet.ratings.reduce((s, r) => s + r.stars, 0) / outlet.ratings.length : null;

  const CATEGORY_ORDER = ["Katsu", "Donburi", "Snack", "Drink", "Extra"];
  const categories = Array.from(new Set(outlet.menus.map((m) => m.category))).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );
  const buyer = await getBuyerSession();
  const open = isOutletOpen(outlet);

  return (
    <div className="min-h-screen bg-asanoha overflow-x-hidden">
      <div className="noren h-2 w-full" />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {!open && (
          <div className="mb-4 rounded-2xl bg-rose-50 ring-1 ring-rose-200 text-rose-700 text-sm font-round font-bold px-4 py-3 text-center">
            ● Sedang Tutup{outlet.openTime && outlet.closeTime ? ` · Buka ${outlet.openTime}–${outlet.closeTime}` : ""}
            {outlet.closedNote ? <span className="block text-xs font-normal mt-1">{outlet.closedNote}</span> : null}
          </div>
        )}
        <div className="flex items-center justify-between mb-5 sticky top-0 z-20 bg-asanoha/95 backdrop-blur -mx-4 px-4 py-2 gap-2">
          <Logo size={34} withText={false} />
          <div className="flex items-center gap-1.5 min-w-0 shrink">
            <span className={`shrink-0 text-xs font-round font-bold rounded-full px-2.5 py-1 ring-1 ${open ? "text-emerald-700 bg-emerald-100 ring-emerald-200" : "text-rose-600 bg-rose-100 ring-rose-200"}`}>
              {open ? "● Buka" : "● Tutup"}
            </span>
            {buyer ? (
              <Link href="/account" className="shrink-0 text-xs font-round font-bold text-sumi/60 bg-paper rounded-full px-2.5 py-1 ring-1 ring-sumi/10 hover:text-shu truncate max-w-[110px]">
                👤 {buyer.name.split(" ")[0]}
              </Link>
            ) : (
              <Link href="/account/login" className="shrink-0 text-xs font-round font-bold text-sumi/60 bg-paper rounded-full px-2.5 py-1 ring-1 ring-sumi/10 hover:text-shu">
                Masuk
              </Link>
            )}
          </div>
        </div>
        <Suspense>
          <Shop
            outlet={{ id: outlet.id, name: outlet.name, address: outlet.address, phone: outlet.phone }}
            menus={outlet.menus}
            categories={categories}
            rating={avgRating != null ? { avg: avgRating, count: outlet.ratings.length } : null}
          />
        </Suspense>
      </div>
    </div>
  );
}
