import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo, Button, MenuImage } from "@/components/ui";
import { HeroBanner } from "@/components/HeroBanner";
import { IconStore, IconClock, IconStar, IconArrowRight, IconUtensils } from "@/components/icons";
import { rupiah } from "@/lib/format";
import { getBuyerSession } from "@/lib/buyerAuth";
import { isOutletOpen } from "@/lib/outlet";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const outlets = await prisma.outlet.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, include: { ratings: true } });
  const featured = await prisma.menu.findMany({
    where: { isPromo: true, isAvailable: true, outlet: { isActive: true } },
    take: 6,
    orderBy: { price: "asc" },
  });
  const buyer = await getBuyerSession();
  const setting = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });

  return (
    <div className="min-h-screen bg-gray-3 text-dark-1 overflow-x-hidden">
      {setting?.isActive && setting.announcement && (
        <div className="bg-primary text-white text-center text-xs sm:text-sm font-semibold px-4 py-2.5">
          {setting.announcement}
        </div>
      )}

      {/* nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/90 border-b border-gray-4">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Logo size={50} />
          <div className="flex items-center gap-2">
            <Link href="#menu" className="hidden sm:inline text-sm font-semibold text-gray-8 hover:text-primary px-3 py-2 transition">Menu</Link>
            <Link href="#outlets" className="hidden sm:inline text-sm font-semibold text-gray-8 hover:text-primary px-3 py-2 transition">Outlet</Link>
            {buyer ? (
              <Link href="/account">
                <Button variant="outline" className="py-2">{buyer.name.split(" ")[0]}</Button>
              </Link>
            ) : (
              <Link href="/account/login">
                <Button variant="outline" className="py-2">Masuk / Daftar</Button>
              </Link>
            )}
            <Link href="/login" className="hidden sm:inline text-xs font-medium text-gray-5 hover:text-primary px-2 transition">Staff</Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative mx-auto max-w-6xl px-5 pt-14 pb-20">
        <div className={`grid gap-10 items-center relative ${setting?.bannerActive ? "lg:grid-cols-2" : ""}`}>
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Gurih · Renyah · Bikin Nagih
            </div>
            <h1 className="mt-5 text-5xl sm:text-6xl font-bold leading-[1.05] tracking-tight text-dark-1">
              Katsu enak,<br />dipesan lewat<br /><span className="text-primary">obrolan.</span>
            </h1>
            <p className="mt-5 text-gray-5 text-lg max-w-md leading-relaxed">
              Ngobrol dulu sama kasir, sepakati pesanan, bayar QRIS, lalu pantau antrian dapur secara langsung. 
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="#outlets">
                <Button className="px-7 py-3.5 text-base">Mulai Pesan</Button>
              </Link>
              <Link href="#menu">
                <Button variant="ghost" className="px-5 py-3.5 text-base">Lihat Menu ↓</Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm">
              <div><p className="text-2xl font-semibold text-primary tracking-tight">14rb</p><p className="text-gray-5 text-xs mt-0.5">mulai dari</p></div>
              <div className="h-8 w-px bg-gray-4" />
              <div><p className="text-2xl font-semibold text-dark-1 tracking-tight">{outlets.length}</p><p className="text-gray-5 text-xs mt-0.5">outlet aktif</p></div>
              <div className="h-8 w-px bg-gray-4" />
              <div><p className="text-2xl font-semibold text-dark-1 tracking-tight">QRIS</p><p className="text-gray-5 text-xs mt-0.5">pembayaran</p></div>
            </div>
          </div>

          {/* owner-managed banner (Dashboard → Pengaturan) */}
          {setting?.bannerActive && (
            <div className="hidden lg:block">
              <HeroBanner setting={setting} />
            </div>
          )}
        </div>
      </section>

      {/* promo */}
      <section id="menu" className="border-y border-gray-4 bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-dark-1">Menu Promo</h2>
              <p className="mt-1 text-gray-5">Harga spesial, jumlah terbatas.</p>
            </div>
            {featured.length > 0 && (
              <Link
                href="/promo"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
              >
                Lihat semua <IconArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {featured.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-6 bg-gray-3 py-14 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white text-gray-2">
                <IconUtensils className="h-5 w-5" />
              </div>
              <p className="font-semibold text-dark-2">Belum ada promo saat ini</p>
              <p className="mt-1 text-sm text-gray-5">Menu promo akan muncul di sini begitu tersedia.</p>
              <Link
                href="/outlets"
                className="btn-press mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
              >
                Lihat Menu Lengkap <IconArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
              {featured.map((m) => (
                <Link
                  key={m.id}
                  href={`/o/${m.outletId}?add=${m.id}`}
                  className="group block min-w-0 rounded-xl border border-gray-6 bg-white p-3 transition hover:border-gray-6 hover:shadow-sm"
                >
                  <MenuImage
                    image={m.image}
                    category={m.category}
                    big
                    className="mb-3 aspect-square w-full rounded-lg bg-gray-3"
                  />
                  <p className="line-clamp-1 text-sm font-semibold text-dark-2 group-hover:text-primary transition">{m.name}</p>
                  <p className="mt-0.5 text-xs text-gray-8">{m.category}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    {m.promoPrice != null && m.promoPrice < m.price ? (
                      <>
                        <span className="text-sm font-semibold text-primary">{rupiah(m.promoPrice)}</span>
                        <span className="text-xs text-gray-2 line-through">{rupiah(m.price)}</span>
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-dark-1">{rupiah(m.price)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* outlets / start chat */}
      <section id="outlets" className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-dark-1">Pilih Outlet &amp; Mulai Chat</h2>
          <p className="mx-auto mt-2 max-w-md text-gray-5">
            Tanpa daftar. Cukup pilih outlet terdekat lalu ngobrol dengan kasir.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
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

        <div className="mt-8 text-center">
          <Link
            href="/outlets"
            className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
          >
            Lihat semua outlet &amp; peta
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-gray-4 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row">
          <Logo size={44} />
          <p className="text-xs text-gray-5">© 2026 Nashi Katsu · GrabFood · ShopeeFood · GoFood</p>
        </div>
      </footer>
    </div>
  );
}
