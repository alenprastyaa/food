"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/dash";
import { IconUsers } from "@/components/icons";

type Cashier = { id: string; name: string; email: string; outletId: string | null; outlet: { name: string } | null };
type Outlet = { id: string; name: string };

export default function CashiersManager({ outlets }: { outlets: Outlet[] }) {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Cashier | null>(null);

  async function load() {
    const d = await fetch("/api/cashiers").then((r) => r.json());
    setCashiers(d.cashiers ?? []);
  }
  useEffect(() => { load(); }, []);

  async function remove(c: Cashier) {
    if (!confirm(`Hapus kasir ${c.name}?`)) return;
    await fetch(`/api/cashiers/${c.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title="Kasir" subtitle="Kelola akun kasir tiap outlet">
        <Button onClick={() => { setEditing(null); setShow(true); }}>+ Kasir Baru</Button>
      </PageHeader>

      <div className="p-5 lg:p-8">
        {cashiers.length === 0 ? (
          <EmptyState icon={<IconUsers className="h-6 w-6" />} title="Belum ada kasir" subtitle="Tambahkan akun kasir untuk outletmu." />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {cashiers.map((c) => (
              <div key={c.id} className="paper-card rounded-2xl p-4 flex items-center gap-3">
                <span className="hanko h-12 w-12 text-lg shrink-0">{c.name.charAt(0)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-round font-semibold text-sm truncate">{c.name}</p>
                  <p className="text-xs text-sumi/50 truncate">{c.email}</p>
                  <p className="text-[11px] text-shu font-semibold mt-0.5">🏮 {c.outlet?.name.replace("Nashi Katsu — ", "") ?? "—"}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setEditing(c); setShow(true); }} className="text-xs font-semibold text-sumi/50 hover:text-shu">Edit</button>
                  <button onClick={() => remove(c)} className="text-xs font-semibold text-rose-400 hover:text-rose-600">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {show && <CashierForm cashier={editing} outlets={outlets} onClose={() => setShow(false)} onSaved={() => { setShow(false); load(); }} />}
    </div>
  );
}

function CashierForm({ cashier, outlets, onClose, onSaved }: { cashier: Cashier | null; outlets: Outlet[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(cashier?.name ?? "");
  const [email, setEmail] = useState(cashier?.email ?? "");
  const [password, setPassword] = useState("");
  const [outletId, setOutletId] = useState(cashier?.outletId ?? outlets[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setErr("");
    if (!name || (!cashier && (!email || !password)) || !outletId) return setErr("Lengkapi data (password wajib untuk kasir baru).");
    setSaving(true);
    const body: Record<string, unknown> = { name, outletId };
    if (!cashier) { body.email = email; body.password = password; }
    else if (password) body.password = password;
    const res = cashier
      ? await fetch(`/api/cashiers/${cashier.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch(`/api/cashiers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); return setErr(d.error || "Gagal menyimpan."); }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sumi/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="paper-card rounded-3xl p-6 w-full max-w-md animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-bold mb-4">{cashier ? "Edit Kasir" : "Kasir Baru"}</h2>
        <div className="space-y-3">
          <F label="Nama"><input value={name} onChange={(e) => setName(e.target.value)} className="in" /></F>
          <F label="Email"><input value={email} disabled={!!cashier} onChange={(e) => setEmail(e.target.value)} className="in disabled:opacity-50" placeholder="kasir@nashi.id" /></F>
          <F label={cashier ? "Password baru (opsional)" : "Password"}><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="in" placeholder="••••••" /></F>
          <F label="Outlet">
            <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="in">{outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
          </F>
          {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Menyimpan…" : "Simpan"}</Button>
            <Button variant="ghost" onClick={onClose}>Batal</Button>
          </div>
        </div>
      </div>
      <style>{`.in{margin-top:.25rem;width:100%;border-radius:.75rem;border:1px solid rgba(23,40,46,.15);background:rgba(247,241,227,.5);padding:.6rem .9rem;font-size:.875rem;outline:none}.in:focus{border-color:var(--color-shu);box-shadow:0 0 0 2px rgba(214,72,63,.15)}`}</style>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-semibold text-sumi/60">{label}</span>{children}</label>;
}
