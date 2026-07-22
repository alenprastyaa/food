"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, MenuImage } from "@/components/ui";
import { rupiah } from "@/lib/format";

type Menu = { id: string; name: string; category: string; description: string | null; price: number; image: string | null };

export default function StartChat({
  outlet,
  menus,
  categories,
}: {
  outlet: { id: string; name: string; address: string; phone: string };
  menus: Menu[];
  categories: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cat, setCat] = useState(categories[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim() || !phone.trim()) return setErr("Isi nama dan nomor HP dulu ya.");
    setLoading(true);
    const res = await fetch("/api/chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outletId: outlet.id, buyerName: name, buyerPhone: phone }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setErr(d.error || "Gagal memulai chat.");
    }
    const { conversationId } = await res.json();
    router.push(`/chat/${conversationId}`);
  }

  const filtered = menus.filter((m) => m.category === cat);

  return (
    <div className="space-y-5">
      {/* outlet hero */}
      <div className="paper-card rounded-3xl overflow-hidden">
        <div className="bg-sumi text-washi p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-8 font-display text-8xl text-shu/20 select-none">丼</div>
          <p className="font-round text-kin-light text-xs tracking-[0.3em] relative">いらっしゃいませ</p>
          <h1 className="font-display text-2xl font-extrabold mt-1 relative">{outlet.name}</h1>
          <p className="text-washi/60 text-sm mt-2 relative">📍 {outlet.address}</p>
          <p className="text-washi/60 text-sm relative">📞 {outlet.phone}</p>
        </div>
        <div className="p-5">
          <p className="text-sm text-sumi/60 leading-relaxed">
            Pesan lewat obrolan langsung dengan kasir. Lihat-lihat menu dulu, lalu tekan tombol di bawah untuk mulai ngobrol 🌸
          </p>
          <Button className="w-full py-3.5 mt-4 text-base" onClick={() => setOpen(true)}>
            Mulai Chat dengan Kasir · 注文
          </Button>
        </div>
      </div>

      {/* menu browse */}
      <div>
        <div className="flex items-center gap-2 overflow-x-auto scroll-thin pb-2 -mx-1 px-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-round font-bold transition ${
                cat === c ? "bg-shu text-white shadow-[0_3px_0_var(--color-shu-dark)]" : "bg-paper text-sumi/60 ring-1 ring-sumi/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 mt-3">
          {filtered.map((m) => (
            <div key={m.id} className="paper-card rounded-2xl p-3 flex items-center gap-3">
              <MenuImage image={m.image} category={m.category} className="h-16 w-16 rounded-xl shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-round font-bold text-sm text-sumi truncate">{m.name}</p>
                <p className="text-xs text-sumi/50 line-clamp-2">{m.description}</p>
              </div>
              <span className="price-tag text-xs px-2.5 py-1 shrink-0">{rupiah(m.price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* start chat sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-sumi/40 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="paper-card rounded-3xl p-6 w-full max-w-sm animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-3">
              <span className="hanko h-12 w-12 text-xl">梨</span>
            </div>
            <h3 className="font-display text-xl font-extrabold text-center">Sebelum mulai chat</h3>
            <p className="text-sm text-sumi/50 text-center mt-1">Biar kasir bisa menyapamu 🙏</p>
            <form onSubmit={start} className="mt-5 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama kamu"
                className="w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nomor WhatsApp (08…)"
                inputMode="tel"
                className="w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-3 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
              />
              {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
              <Button type="submit" className="w-full py-3.5" disabled={loading}>
                {loading ? "Membuka chat…" : "Masuk ke Chat →"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
