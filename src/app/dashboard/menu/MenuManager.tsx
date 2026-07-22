"use client";
import { useEffect, useMemo, useState } from "react";
import { rupiah } from "@/lib/format";
import { Button, MenuImage } from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/dash";
import { fileToDataUrl } from "@/lib/hooks";

type Menu = { id: string; name: string; category: string; description: string | null; price: number; image: string | null; isAvailable: boolean; outletId: string };
type Outlet = { id: string; name: string };

const EMOJIS = ["🍱", "🍤", "🍗", "🍛", "🍚", "🍥", "🍿", "🥚", "🔥", "🍢", "🥟", "🐙", "🍘", "🍵", "🍳", "🌶️", "🥢", "🍜"];
const CATS = ["Katsu", "Donburi", "Snack", "Drink", "Extra"];

export default function MenuManager({ outlets }: { outlets: Outlet[] }) {
  const [outletId, setOutletId] = useState(outlets[0]?.id ?? "");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const d = await fetch(`/api/menu?outletId=${outletId}`).then((r) => r.json());
    setMenus(d.menus ?? []);
    setLoading(false);
  }
  useEffect(() => {
    if (outletId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outletId]);

  const byCat = useMemo(() => {
    const g: Record<string, Menu[]> = {};
    for (const m of menus) (g[m.category] ??= []).push(m);
    return g;
  }, [menus]);

  async function toggle(m: Menu) {
    setMenus((p) => p.map((x) => (x.id === m.id ? { ...x, isAvailable: !x.isAvailable } : x)));
    await fetch(`/api/menu/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAvailable: !m.isAvailable }) });
  }
  async function remove(m: Menu) {
    if (!confirm(`Hapus menu "${m.name}"?`)) return;
    await fetch(`/api/menu/${m.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title="Menu" jp="メニュー" subtitle="Kelola menu tiap outlet">
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>+ Menu Baru</Button>
      </PageHeader>

      <div className="p-5 lg:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-sumi/50">Outlet:</span>
          <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="rounded-xl border border-sumi/15 bg-paper px-4 py-2 text-sm font-round font-bold outline-none focus:border-shu">
            {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <span className="text-sm text-sumi/40">{menus.length} item</span>
        </div>

        {loading ? (
          <p className="text-sumi/40 text-sm">Memuat…</p>
        ) : menus.length === 0 ? (
          <EmptyState icon="🍱" title="Belum ada menu" subtitle="Tambahkan menu pertama outlet ini." />
        ) : (
          CATS.filter((c) => byCat[c]?.length).map((cat) => (
            <div key={cat}>
              <h3 className="font-display text-lg font-extrabold text-sumi mb-2 flex items-center gap-2">
                {cat} <span className="text-xs font-normal text-sumi/40">({byCat[cat].length})</span>
              </h3>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {byCat[cat].map((m) => (
                  <div key={m.id} className={`paper-card rounded-2xl p-3 flex gap-3 transition ${!m.isAvailable ? "opacity-55" : ""}`}>
                    <MenuImage image={m.image} category={m.category} className="h-16 w-16 rounded-xl shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-round font-bold text-sm truncate">{m.name}</p>
                      <p className="text-xs text-sumi/50 line-clamp-2">{m.description}</p>
                      <p className="text-shu font-display font-extrabold text-sm mt-0.5">{rupiah(m.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => toggle(m)} className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${m.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                          {m.isAvailable ? "● Tersedia" : "○ Habis"}
                        </button>
                        <button onClick={() => { setEditing(m); setShowForm(true); }} className="text-[11px] font-bold text-sumi/50 hover:text-shu">Edit</button>
                        <button onClick={() => remove(m)} className="text-[11px] font-bold text-rose-400 hover:text-rose-600">Hapus</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <MenuForm
          outletId={outletId}
          menu={editing}
          emojis={EMOJIS}
          cats={CATS}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function MenuForm({ outletId, menu, emojis, cats, onClose, onSaved }: { outletId: string; menu: Menu | null; emojis: string[]; cats: string[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(menu?.name ?? "");
  const [category, setCategory] = useState(menu?.category ?? cats[0]);
  const [price, setPrice] = useState(menu?.price ?? 0);
  const [description, setDescription] = useState(menu?.description ?? "");
  const [image, setImage] = useState(menu?.image ?? "🍱");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setErr("");
    if (!name.trim() || !price) return setErr("Nama & harga wajib.");
    setSaving(true);
    const body = { outletId, name, category, price, description, image };
    const res = menu
      ? await fetch(`/api/menu/${menu.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch(`/api/menu`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); return setErr(d.error || "Gagal menyimpan."); }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sumi/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="paper-card rounded-3xl p-6 w-full max-w-md animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-extrabold mb-4">{menu ? "Edit Menu" : "Menu Baru"} <span className="font-round text-shu/60 text-sm">献立</span></h2>
        <div className="space-y-3">
          <Field label="Nama"><input value={name} onChange={(e) => setName(e.target.value)} className="in" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategori">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="in">{cats.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            <Field label="Harga (Rp)"><input type="number" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} className="in" /></Field>
          </div>
          <Field label="Foto Menu">
            <div className="mt-1 flex items-center gap-3">
              <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 ring-1 ring-sumi/10">
                <MenuImage image={image} category={category} className="h-full w-full" />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="block rounded-lg border border-sumi/15 bg-washi/50 px-3 py-2 text-xs font-round font-bold text-center cursor-pointer hover:border-shu transition">
                  📤 Unggah Foto Asli
                  <input type="file" accept="image/*" hidden onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImage(await fileToDataUrl(file));
                  }} />
                </label>
                {image?.startsWith("data:") || image?.startsWith("/") || image?.startsWith("http") ? (
                  <button onClick={() => setImage("🍱")} className="text-[11px] text-sumi/40 hover:text-shu">Hapus foto, pakai ikon</button>
                ) : null}
              </div>
            </div>
            <p className="text-[11px] text-sumi/40 mt-2">atau pilih ikon:</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {emojis.map((e) => (
                <button key={e} onClick={() => setImage(e)} className={`h-9 w-9 rounded-lg text-lg grid place-items-center ${image === e ? "bg-shu/15 ring-2 ring-shu" : "bg-washi/60 ring-1 ring-sumi/10"}`}>{e}</button>
              ))}
            </div>
          </Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-sumi/60">{label}</span>
      {children}
    </label>
  );
}
