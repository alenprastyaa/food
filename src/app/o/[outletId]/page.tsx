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

  // Known categories keep their curated order; anything the owner added later
  // falls to the end alphabetically instead of jumping to the front (indexOf -1).
  const CATEGORY_ORDER = ["Katsu", "Donburi", "Snack", "Drink", "Extra"];
  const rank = (c: string) => {
    const i = CATEGORY_ORDER.indexOf(c);
    return i === -1 ? CATEGORY_ORDER.length : i;
  };
  const categories = Array.from(new Set(outlet.menus.map((m) => m.category))).sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b, "id")
  );
  const buyer = await getBuyerSession();
  const open = isOutletOpen(outlet);

  return (
    <div className="min-h-screen bg-gray-3 overflow-x-hidden">
      {/* top bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-4">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-2">
          <Logo size={44} />
          <div className="flex items-center gap-1.5 min-w-0 shrink">
            <span
              className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-white rounded-full px-3 py-1 ${
                open ? "bg-success" : "bg-primary"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {open ? "Buka" : "Tutup"}
            </span>
            {buyer ? (
              <Link
                href="/account"
                className="shrink-0 text-xs font-semibold text-gray-8 bg-white rounded-full px-2.5 py-1 border border-gray-4 hover:border-primary hover:text-primary transition truncate max-w-[110px]"
              >
                {buyer.name.split(" ")[0]}
              </Link>
            ) : (
              <Link
                href="/account/login"
                className="shrink-0 text-xs font-semibold text-gray-8 bg-white rounded-full px-2.5 py-1 border border-gray-4 hover:border-primary hover:text-primary transition"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-5">
        {!open && (
          <div className="mb-4 rounded-lg bg-primary-light border border-[#FEE4E2] text-primary text-sm font-semibold px-4 py-3 text-center">
            Sedang Tutup{outlet.openTime && outlet.closeTime ? ` · Buka ${outlet.openTime}–${outlet.closeTime}` : ""}
            {outlet.closedNote ? <span className="block text-xs font-normal mt-1 text-gray-5">{outlet.closedNote}</span> : null}
          </div>
        )}
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
