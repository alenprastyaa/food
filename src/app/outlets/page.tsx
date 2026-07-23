import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui";
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
    <div className="min-h-screen bg-washi">
      <div className="noren h-2 w-full" />
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <Logo size={38} />
          <Link href="/" className="text-sm font-round font-bold text-sumi/60 hover:text-shu">← Beranda</Link>
        </div>
        <div className="text-center mb-6">
          <p className="font-round text-shu text-sm tracking-[0.3em]">店舗一覧</p>
          <h1 className="font-display text-4xl font-extrabold mt-1">Pilih Outlet</h1>
          <p className="text-sumi/50 mt-2">Semua cabang Nashi Katsu di petamu.</p>
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
              <Link key={o.id} href={`/o/${o.id}`} className="paper-card rounded-2xl p-5 hover:-translate-y-1 transition group">
                <div className="flex items-start justify-between">
                  <div className="hanko h-10 w-10 text-base">店</div>
                  <span className={`text-xs font-round font-bold rounded-full px-2 py-1 ring-1 ${open ? "text-emerald-700 bg-emerald-100 ring-emerald-200" : "text-rose-600 bg-rose-100 ring-rose-200"}`}>
                    {open ? "Buka" : "Tutup"}
                  </span>
                </div>
                <h3 className="font-display text-lg font-extrabold mt-3 group-hover:text-shu transition">{o.name}</h3>
                <p className="text-sm text-sumi/50 mt-1">{o.address}</p>
                <p className="text-sm text-sumi/40">{o.phone}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-sumi/50">
                  {o.openTime && o.closeTime && <span>🕒 {o.openTime}–{o.closeTime}</span>}
                  {avgRating != null && <span>⭐ {avgRating.toFixed(1)} ({o.ratings.length})</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
