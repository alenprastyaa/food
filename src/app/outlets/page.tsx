import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui";
import { IconStore, IconClock, IconStar, IconArrowRight } from "@/components/icons";
import { isOutletOpen } from "@/lib/outlet";
import OutletMap from "@/components/OutletMapLoader";

export const dynamic = "force-dynamic";

export default async function OutletsPage() {
  const outlets = await prisma.outlet.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { ratings: true },
  });
  const mappable = outlets.filter((o) => o.latitude != null && o.longitude != null) as (typeof outlets[number] & { latitude: number; longitude: number })[];

  return (
    <div className="min-h-screen bg-gray-3">
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <Logo size={46} />
          <Link href="/" className="text-sm font-semibold text-gray-8 hover:text-primary transition">← Beranda</Link>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-4xl font-semibold tracking-tight text-dark-1">Pilih Outlet</h1>
          <p className="text-gray-5 mt-2">Semua cabang Nashi Katsu di petamu.</p>
        </div>

        {mappable.length > 0 && (
          <div className="mb-6">
            <OutletMap outlets={mappable.map((o) => ({ id: o.id, name: o.name, address: o.address, latitude: o.latitude, longitude: o.longitude }))} />
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {outlets.map((o) => {
            const open = isOutletOpen(o);
            const avgRating = o.ratings.length > 0 ? o.ratings.reduce((s, r) => s + r.stars, 0) / o.ratings.length : null;
            return (
              <Link
                key={o.id}
                href={`/o/${o.id}`}
                className="group rounded-xl border border-gray-6 bg-white p-5 transition hover:border-primary hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-white">
                    <IconStore className="h-5 w-5" />
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white ${
                      open ? "bg-success" : "bg-primary"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {open ? "Buka" : "Tutup"}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-dark-1 group-hover:text-primary transition">{o.name}</h3>
                <p className="mt-1 text-sm text-dark-2">{o.address}</p>
                <p className="mt-0.5 text-sm text-dark-2">{o.phone}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-5">
                  {o.openTime && o.closeTime && (
                    <span className="inline-flex items-center gap-1.5">
                      <IconClock className="h-3.5 w-3.5 text-gray-2" />
                      {o.openTime}–{o.closeTime}
                    </span>
                  )}
                  {avgRating != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <IconStar className="h-3.5 w-3.5 text-warning-light" />
                      {avgRating.toFixed(1)}
                      <span className="text-gray-2">({o.ratings.length})</span>
                    </span>
                  )}
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Mulai Chat
                  <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
