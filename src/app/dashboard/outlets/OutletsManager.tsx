"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { PageHeader } from "@/components/dash";

type Outlet = {
  id: string;
  name: string;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  _count: { menus: number; users: number; orders: number };
};

export default function OutletsManager() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Outlet | null>(null);

  async function load() {
    const d = await fetch("/api/outlets").then((r) => r.json());
    setOutlets(d.outlets ?? []);
  }
  useEffect(() => { load(); }, []);

  async function toggle(o: Outlet) {
    setOutlets((p) => p.map((x) => (x.id === o.id ? { ...x, isActive: !x.isActive } : x)));
    await fetch(`/api/outlets/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !o.isActive }) });
  }

  return (
    <div>
      <PageHeader title="Outlet" jp="店舗" subtitle="Kelola cabang bisnismu">
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>+ Outlet Baru</Button>
      </PageHeader>

      <div className="p-5 lg:p-8 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {outlets.map((o) => (
          <div key={o.id} className="paper-card rounded-2xl overflow-hidden">
            <div className="bg-sumi text-washi p-4 relative overflow-hidden">
              <div className="absolute -right-3 -top-4 font-display text-6xl text-shu/20">店</div>
              <div className="flex items-center justify-between relative">
                <span className="hanko h-9 w-9 text-sm">{o.name.replace("Nashi Katsu — ", "").charAt(0)}</span>
                <button onClick={() => toggle(o)} className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${o.isActive ? "bg-emerald-500/90 text-white" : "bg-washi/20 text-washi/60"}`}>
                  {o.isActive ? "● Aktif" : "○ Nonaktif"}
                </button>
              </div>
              <h3 className="font-display text-lg font-extrabold mt-3 relative">{o.name}</h3>
            </div>
            <div className="p-4 space-y-1.5">
              <p className="text-sm text-sumi/60">📍 {o.address}</p>
              <p className="text-sm text-sumi/60">📞 {o.phone}</p>
              {o.latitude != null && (
                <a href={`https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`} target="_blank" className="text-xs text-shu font-bold hover:underline inline-block">Lihat di peta →</a>
              )}
              <div className="flex gap-4 pt-2 mt-2 border-t border-sumi/10 text-center">
                <Metric label="Menu" value={o._count.menus} />
                <Metric label="Kasir" value={o._count.users} />
                <Metric label="Order" value={o._count.orders} />
              </div>
              <button onClick={() => { setEditing(o); setShowForm(true); }} className="mt-2 w-full text-sm font-round font-bold text-sumi/60 hover:text-shu rounded-lg py-2 hover:bg-shu/5 transition">✎ Edit Outlet</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && <OutletForm outlet={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1">
      <p className="font-display text-lg font-extrabold text-sumi">{value}</p>
      <p className="text-[10px] text-sumi/40">{label}</p>
    </div>
  );
}

function OutletForm({ outlet, onClose, onSaved }: { outlet: Outlet | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: outlet?.name ?? "",
    phone: outlet?.phone ?? "",
    address: outlet?.address ?? "",
    latitude: outlet?.latitude?.toString() ?? "",
    longitude: outlet?.longitude?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  function useCurrentLocation() {
    if (!navigator.geolocation) return setErr("Browser tidak mendukung geolokasi.");
    setErr("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", pos.coords.latitude.toString());
        set("longitude", pos.coords.longitude.toString());
        setLocating(false);
      },
      () => {
        setErr("Gagal mengambil lokasi. Izinkan akses lokasi di browser, atau isi manual.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function save() {
    setErr("");
    if (!f.name || !f.phone || !f.address) return setErr("Nama, telepon, alamat wajib.");
    setSaving(true);
    const res = outlet
      ? await fetch(`/api/outlets/${outlet.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) })
      : await fetch(`/api/outlets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); return setErr(d.error || "Gagal menyimpan."); }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sumi/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="paper-card rounded-3xl p-6 w-full max-w-md animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-extrabold mb-4">{outlet ? "Edit Outlet" : "Outlet Baru"} <span className="font-round text-shu/60 text-sm">店舗</span></h2>
        <div className="space-y-3">
          <F label="Nama Outlet"><input value={f.name} onChange={(e) => set("name", e.target.value)} className="in" placeholder="Nashi Katsu — Cabang" /></F>
          <F label="Telepon"><input value={f.phone} onChange={(e) => set("phone", e.target.value)} className="in" placeholder="0812-…" /></F>
          <F label="Alamat"><textarea value={f.address} onChange={(e) => set("address", e.target.value)} rows={2} className="in" /></F>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="w-full text-sm font-round font-bold text-shu bg-shu/10 rounded-xl py-2.5 hover:bg-shu/20 transition disabled:opacity-50"
          >
            {locating ? "Mengambil lokasi…" : "📍 Gunakan Lokasi Saat Ini"}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <F label="Latitude"><input value={f.latitude} onChange={(e) => set("latitude", e.target.value)} className="in" placeholder="-7.79" /></F>
            <F label="Longitude"><input value={f.longitude} onChange={(e) => set("longitude", e.target.value)} className="in" placeholder="110.36" /></F>
          </div>
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
