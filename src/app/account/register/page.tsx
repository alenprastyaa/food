"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo, Button } from "@/components/ui";

export default function BuyerRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-asanoha" />}>
      <BuyerRegisterForm />
    </Suspense>
  );
}

function BuyerRegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await fetch("/api/buyer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email: email || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Gagal mendaftar.");
      return;
    }
    router.push(params.get("next") || "/account");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-asanoha grid place-items-center p-5 relative overflow-hidden">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-6 flex justify-center"><Logo size={56} /></div>
        <div className="paper-card rounded-[1.75rem] p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-shu" />
            <span className="font-round text-xs tracking-widest text-sumi/50 uppercase">Akun Pembeli</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-sumi">Daftar Akun</h1>
          <p className="text-sm text-sumi/50 mt-1">Cukup nomor HP, tanpa password. Checkout lebih cepat & lihat riwayat order.</p>

          <form onSubmit={submit} className="mt-6 space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-sumi/60">Nama</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" className="mt-1 w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-2.5 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-sumi/60">Nomor HP</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" inputMode="tel" className="mt-1 w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-2.5 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-sumi/60">Email (opsional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kamu@email.com" className="mt-1 w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-2.5 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20" />
            </div>
            {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? "Memproses…" : "Daftar & Masuk"}
            </Button>
          </form>

          <p className="text-center text-sm text-sumi/50 mt-5">
            Sudah punya akun? <Link href="/account/login" className="text-shu font-semibold hover:underline">Masuk</Link>
          </p>
        </div>
        <p className="text-center text-xs text-sumi/40 mt-6">
          <Link href="/" className="hover:text-shu">← Kembali ke beranda</Link>
        </p>
      </div>
    </div>
  );
}
