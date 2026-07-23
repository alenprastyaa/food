import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Logo, Button, MenuImage } from "@/components/ui";
import { rupiah } from "@/lib/format";
import { getBuyerSession } from "@/lib/buyerAuth";
import { isOutletOpen } from "@/lib/outlet";
import Petals from "@/components/Petals";

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
    <div className="min-h-screen bg-washi text-sumi overflow-x-hidden">
      {setting?.isActive && setting.announcement && (
        <div className="bg-shu text-white text-center text-xs sm:text-sm font-round font-bold px-4 py-2">
          {setting.announcement}
        </div>
      )}
      {/* noren top */}
      <div className="noren h-2 w-full" />

      {/* nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-washi/80 border-b border-sumi/10">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Logo size={40} />
          <div className="flex items-center gap-2">
            <Link href="#menu" className="hidden sm:inline text-sm font-round font-bold text-sumi/70 hover:text-shu px-3 py-2">Menu</Link>
            <Link href="#outlets" className="hidden sm:inline text-sm font-round font-bold text-sumi/70 hover:text-shu px-3 py-2">Outlet</Link>
            {buyer ? (
              <Link href="/account">
                <Button variant="outline" className="py-2">👤 {buyer.name.split(" ")[0]}</Button>
              </Link>
            ) : (
              <Link href="/account/login">
                <Button variant="outline" className="py-2">Masuk / Daftar</Button>
              </Link>
            )}
            <Link href="/login" className="hidden sm:inline text-xs text-sumi/40 hover:text-shu px-2">Staff</Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative mx-auto max-w-6xl px-5 pt-14 pb-20">
        <Petals count={8} />
        <div className="absolute right-0 top-0 font-display text-[16rem] leading-none text-shu/[0.06] select-none pointer-events-none hidden md:block">カツ</div>
        <div className="grid lg:grid-cols-2 gap-10 items-center relative">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-shu/10 px-3 py-1 text-xs font-round font-bold text-shu ring-1 ring-shu/20">
              <span className="h-1.5 w-1.5 rounded-full bg-shu animate-pulse" /> サクサク・ジューシー・やみつき
            </div>
            <h1 className="mt-5 font-display text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Katsu enak,<br />dipesan lewat<br /><span className="text-shu">obrolan.</span>
            </h1>
            <p className="mt-5 text-sumi/60 text-lg max-w-md leading-relaxed">
              Ngobrol dulu sama kasir, sepakati pesanan, bayar QRIS, lalu pantau antrian dapur secara langsung. Sehangat ramen di musim dingin.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="#outlets">
                <Button className="px-7 py-3.5 text-base">Mulai Pesan · 注文</Button>
              </Link>
              <Link href="#menu">
                <Button variant="ghost" className="px-5 py-3.5 text-base">Lihat Menu ↓</Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm">
              <div><p className="font-display text-2xl font-extrabold text-shu">14rb</p><p className="text-sumi/50 text-xs">mulai dari</p></div>
              <div className="h-8 w-px bg-sumi/15" />
              <div><p className="font-display text-2xl font-extrabold">{outlets.length}</p><p className="text-sumi/50 text-xs">outlet aktif</p></div>
              <div className="h-8 w-px bg-sumi/15" />
              <div><p className="font-display text-2xl font-extrabold">QRIS</p><p className="text-sumi/50 text-xs">pembayaran</p></div>
            </div>
          </div>

          {/* hero card stack */}
          <div className="relative h-[420px] hidden lg:block">
            <div className="absolute inset-0 grid place-items-center">
              <div className="h-72 w-72 rounded-full bg-gradient-to-br from-shu/20 to-kin/20 blur-2xl" />
            </div>
            <div className="absolute top-6 left-8 paper-card rounded-3xl p-5 w-56 animate-float" style={{ animationDelay: "0s" }}>
              <MenuImage image="🍱" category="Donburi" big className="h-28 w-full rounded-2xl mb-3" />
              <p className="font-round font-bold text-sm">Katsu Curry Donburi</p>
              <p className="price-tag text-xs px-2 py-1 mt-2">{rupiah(21000)}</p>
            </div>
            <div className="absolute bottom-4 right-6 paper-card rounded-3xl p-5 w-52 animate-float" style={{ animationDelay: "1.5s" }}>
              <MenuImage image="🍤" category="Katsu" big className="h-24 w-full rounded-2xl mb-3" />
              <p className="font-round font-bold text-sm">Katsu Happy</p>
              <p className="price-tag text-xs px-2 py-1 mt-2">{rupiah(14000)}</p>
            </div>
            <div className="absolute top-1/2 right-24 -translate-y-1/2 hanko h-24 w-24 text-4xl animate-float" style={{ animationDelay: "0.8s" }}>旨</div>
          </div>
        </div>
      </section>

      {/* menu strip */}
      <section id="menu" className="bg-sumi text-washi py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-30" />
        <div className="mx-auto max-w-6xl px-5 relative">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="font-round text-kin-light text-sm tracking-[0.3em]">セール中</p>
              <h2 className="font-display text-3xl font-extrabold mt-1">Menu Promo</h2>
            </div>
            <Link href="/promo" className="font-display text-shu-light text-sm hover:underline">Lihat semua →</Link>
          </div>
          {featured.length === 0 ? (
            <p className="text-washi/40 text-sm">Belum ada promo saat ini.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {featured.map((m) => (
                <Link key={m.id} href={`/o/${m.outletId}?add=${m.id}`} className="rounded-2xl bg-washi/5 ring-1 ring-washi/10 p-4 hover:bg-washi/10 transition group min-w-0 block">
                  <MenuImage image={m.image} category={m.category} big className="aspect-square w-full rounded-xl mb-3 group-hover:scale-105 transition-transform" />
                  <p className="font-round font-bold text-sm leading-snug">{m.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-washi/40">{m.category}</span>
                    {m.promoPrice != null && m.promoPrice < m.price ? (
                      <span className="flex items-center gap-1.5">
                        <span className="text-washi/30 line-through text-xs">{rupiah(m.price)}</span>
                        <span className="price-tag text-xs px-2 py-0.5">{rupiah(m.promoPrice)}</span>
                      </span>
                    ) : (
                      <span className="price-tag text-xs px-2 py-0.5">{rupiah(m.price)}</span>
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
        <div className="text-center mb-10">
          <p className="font-round text-shu text-sm tracking-[0.3em]">店舗を選ぶ</p>
          <h2 className="font-display text-3xl font-extrabold mt-1">Pilih Outlet & Mulai Chat</h2>
          <p className="text-sumi/50 mt-2">Tanpa daftar. Cukup pilih outlet terdekat lalu ngobrol dengan kasir.</p>
          <Link href="/outlets" className="inline-block mt-3 text-sm font-round font-bold text-shu hover:underline">Lihat semua & peta →</Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {outlets.map((o) => {
            const open = isOutletOpen(o);
            const avgRating = o.ratings.length > 0 ? o.ratings.reduce((s, r) => s + r.stars, 0) / o.ratings.length : null;
            return (
              <Link key={o.id} href={`/o/${o.id}`} className="paper-card rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl transition group">
                <div className="flex items-start justify-between">
                  <div className="hanko h-11 w-11 text-lg">店</div>
                  <span className={`text-xs font-round font-bold rounded-full px-2 py-1 ring-1 ${open ? "text-emerald-700 bg-emerald-100 ring-emerald-200" : "text-rose-600 bg-rose-100 ring-rose-200"}`}>
                    {open ? "Buka" : "Tutup"}
                  </span>
                </div>
                <h3 className="font-display text-xl font-extrabold mt-4 group-hover:text-shu transition">{o.name}</h3>
                <p className="text-sm text-sumi/50 mt-1">{o.address}</p>
                <p className="text-sm text-sumi/40 mt-0.5">{o.phone}</p>
                <div className="flex items-center gap-3 mt-1">
                  {o.openTime && o.closeTime && <p className="text-xs text-sumi/40">🕒 {o.openTime}–{o.closeTime}</p>}
                  {avgRating != null && <p className="text-xs text-sumi/40">⭐ {avgRating.toFixed(1)} ({o.ratings.length})</p>}
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-shu font-round font-bold text-sm">
                  Mulai Chat <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-sumi/10 bg-washi-dark">
        <div className="mx-auto max-w-6xl px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={36} />
          <p className="text-xs text-sumi/40">© 2026 Nashi Katsu · 美味しいカツ · GrabFood · ShopeeFood · GoFood</p>
        </div>
      </footer>
    </div>
  );
}
