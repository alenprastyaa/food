import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo, MenuImage } from "@/components/ui";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PromoPage() {
  const menus = await prisma.menu.findMany({
    where: { isPromo: true, isAvailable: true, outlet: { isActive: true } },
    include: { outlet: { select: { id: true, name: true } } },
    orderBy: { price: "asc" },
  });

  return (
    <div className="min-h-screen bg-washi">
      <div className="noren h-2 w-full" />
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <Logo size={46} />
          <Link href="/" className="text-sm font-round font-semibold text-sumi/60 hover:text-shu">← Beranda</Link>
        </div>
        <div className="text-center mb-8">
          <p className="font-round text-shu text-sm tracking-[0.3em]">PROMO SPESIAL</p>
          <h1 className="font-display text-4xl font-bold mt-1">Menu Promo</h1>
          <p className="text-sumi/50 mt-2">Menu pilihan dengan harga spesial, tersedia di outlet-outlet berikut.</p>
        </div>
        {menus.length === 0 ? (
          <p className="text-center text-sumi/40 py-16">Belum ada promo saat ini. Cek lagi nanti ya 🌸</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {menus.map((m) => (
              <Link key={m.id} href={`/o/${m.outletId}?add=${m.id}`} className="paper-card rounded-2xl overflow-hidden hover:-translate-y-1 transition group block">
                <div className="relative">
                  <MenuImage image={m.image} category={m.category} big className="aspect-square w-full group-hover:scale-105 transition-transform" />
                  <span className="absolute top-2 left-2 text-[10px] font-round font-semibold bg-shu text-white rounded-full px-2 py-0.5">PROMO</span>
                </div>
                <div className="p-3">
                  <p className="font-round font-semibold text-sm leading-snug line-clamp-2">{m.name}</p>
                  <p className="text-[11px] text-sumi/40 mt-0.5">{m.outlet.name.replace("Nashi Katsu — ", "")}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {m.promoPrice != null && m.promoPrice < m.price ? (
                      <>
                        <span className="price-tag text-xs px-2 py-1">{rupiah(m.promoPrice)}</span>
                        <span className="text-xs text-sumi/40 line-through">{rupiah(m.price)}</span>
                      </>
                    ) : (
                      <span className="price-tag text-xs px-2 py-1">{rupiah(m.price)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
