"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo, Button } from "@/components/ui";
import Petals from "@/components/Petals";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-asanoha" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function doLogin(loginEmail: string, loginPassword: string) {
    setErr("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Gagal masuk.");
      return;
    }
    router.push(params.get("next") || "/dashboard");
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    doLogin(email, password);
  }

  const quick = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    doLogin(e, p);
  };

  return (
    <div className="min-h-screen bg-asanoha grid lg:grid-cols-2 relative overflow-hidden">
      <Petals count={7} />
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-sumi text-washi overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-40" />
        <div className="absolute -right-24 top-1/2 -translate-y-1/2 font-display text-[22rem] leading-none text-shu/20 select-none">梨</div>
        <div className="relative">
          <Logo size={52} />
        </div>
        <div className="relative">
          <p className="font-round text-kin-light text-sm tracking-[0.3em]">サクサク・ジューシー</p>
          <h1 className="font-display text-5xl font-extrabold mt-3 leading-tight">
            Pesan lewat <span className="text-shu-light">obrolan.</span>
            <br />Bukan sekadar<br />keranjang.
          </h1>
          <p className="mt-5 text-washi/60 max-w-sm leading-relaxed">
            Dashboard untuk Owner &amp; Kasir. Kelola chat, order, antrian dapur, dan keuangan seluruh outlet dalam satu tempat.
          </p>
        </div>
        <div className="relative flex items-center gap-2 text-washi/40 text-xs">
          <span className="h-px w-8 bg-washi/30" /> Nashi Katsu © 2026 · 美味しいカツ
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size={48} />
          </div>
          <div className="paper-card rounded-[1.75rem] p-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-shu" />
              <span className="font-round text-xs tracking-widest text-sumi/50 uppercase">Masuk Dashboard</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-sumi">Selamat datang kembali</h2>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-sumi/60">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@nashi.id"
                  className="mt-1 w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-2.5 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20 transition"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-sumi/60">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-2.5 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20 transition"
                  required
                />
              </div>
              {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
              <Button type="submit" className="w-full py-3" disabled={loading}>
                {loading ? "Memproses…" : "Masuk"}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-sumi/10">
              <p className="text-xs text-sumi/50 mb-2">Pintasan login — klik untuk langsung masuk:</p>
              <div className="grid grid-cols-1 gap-2">
                <button type="button" disabled={loading} onClick={() => quick("owner@nashi.id", "owner123")} className="text-left rounded-lg border border-sumi/10 px-3 py-2 text-xs hover:border-shu/40 hover:bg-shu/5 transition disabled:opacity-50">
                  <span className="font-bold text-sumi">Owner</span> · owner@nashi.id / owner123
                </button>
                <button type="button" disabled={loading} onClick={() => quick("kasir1@nashi.id", "kasir123")} className="text-left rounded-lg border border-sumi/10 px-3 py-2 text-xs hover:border-shu/40 hover:bg-shu/5 transition disabled:opacity-50">
                  <span className="font-bold text-sumi">Kasir Malioboro</span> · kasir1@nashi.id / kasir123
                </button>
                <button type="button" disabled={loading} onClick={() => quick("kasir2@nashi.id", "kasir123")} className="text-left rounded-lg border border-sumi/10 px-3 py-2 text-xs hover:border-shu/40 hover:bg-shu/5 transition disabled:opacity-50">
                  <span className="font-bold text-sumi">Kasir Seturan</span> · kasir2@nashi.id / kasir123
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-sumi/40 mt-6">
            Pembeli tidak perlu login — cukup buka link chat outlet.
          </p>
        </div>
      </div>
    </div>
  );
}
