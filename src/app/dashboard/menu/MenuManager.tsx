"use client";
import { useEffect, useMemo, useState } from "react";
import { rupiah } from "@/lib/format";
import { Button, MenuImage } from "@/components/ui";
import { PageHeader, EmptyState } from "@/components/dash";
import { IconUtensils, IconPlus, IconX } from "@/components/icons";
import { uploadImage } from "@/lib/upload";

type MenuOption = { id: string; name: string; priceDelta: number };
type MenuOptionGroup = { id: string; name: string; required: boolean; multiple: boolean; options: MenuOption[] };
type Menu = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  image: string | null;
  isAvailable: boolean;
  isPromo: boolean;
  promoPrice: number | null;
  outletId: string;
  optionGroups: MenuOptionGroup[];
};
type Outlet = { id: string; name: string };

const EMOJIS = ["🍱", "🍤", "🍗", "🍛", "🍚", "🍥", "🍿", "🥚", "🔥", "🍢", "🥟", "🐙", "🍘", "🍵", "🍳", "🌶️", "🥢", "🍜"];
const DEFAULT_CATS = ["Katsu", "Donburi", "Snack", "Drink", "Extra"];

/** Defaults first (in order), then any custom category the owner has created. */
function orderCategories(found: string[]) {
  const extra = found.filter((c) => !DEFAULT_CATS.includes(c)).sort((a, b) => a.localeCompare(b, "id"));
  return [...DEFAULT_CATS, ...extra];
}

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

  // Derived from actual menus, so a custom category never hides its items.
  const allCats = useMemo(() => orderCategories(Object.keys(byCat)), [byCat]);

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
      <PageHeader title="Menu" subtitle="Kelola menu tiap outlet">
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>+ Menu Baru</Button>
      </PageHeader>

      <div className="p-5 lg:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-sumi/50">Outlet:</span>
          <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className="rounded-xl border border-sumi/15 bg-paper px-4 py-2 text-sm font-round font-semibold outline-none focus:border-shu">
            {outlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <span className="text-sm text-sumi/40">{menus.length} item</span>
        </div>

        {loading ? (
          <p className="text-sumi/40 text-sm">Memuat…</p>
        ) : menus.length === 0 ? (
          <EmptyState icon={<IconUtensils className="h-6 w-6" />} title="Belum ada menu" subtitle="Tambahkan menu pertama outlet ini." />
        ) : (
          allCats.filter((c) => byCat[c]?.length).map((cat) => (
            <div key={cat}>
              <h3 className="font-display text-lg font-bold text-sumi mb-2 flex items-center gap-2">
                {cat} <span className="text-xs font-normal text-sumi/40">({byCat[cat].length})</span>
              </h3>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {byCat[cat].map((m) => (
                  <div key={m.id} className={`paper-card rounded-2xl p-3 flex gap-3 transition ${!m.isAvailable ? "opacity-55" : ""}`}>
                    <MenuImage image={m.image} category={m.category} className="h-16 w-16 rounded-xl shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-round font-semibold text-sm truncate">{m.name}</p>
                      <p className="text-xs text-sumi/50 line-clamp-2">{m.description}</p>
                      <p className="text-shu font-display font-bold text-sm mt-0.5">{rupiah(m.price)}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <button onClick={() => toggle(m)} className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${m.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                          {m.isAvailable ? "● Tersedia" : "○ Habis"}
                        </button>
                        {m.optionGroups.length > 0 && (
                          <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 bg-violet-100 text-violet-700">{m.optionGroups.length} varian</span>
                        )}
                        {m.isPromo && (
                          <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 bg-shu/10 text-shu">🔥 Promo</span>
                        )}
                        <button onClick={() => { setEditing(m); setShowForm(true); }} className="text-[11px] font-semibold text-sumi/50 hover:text-shu">Edit</button>
                        <button onClick={() => remove(m)} className="text-[11px] font-semibold text-rose-400 hover:text-rose-600">Hapus</button>
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
          cats={allCats}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

type GroupDraft = { name: string; required: boolean; multiple: boolean; options: { name: string; priceDelta: number }[] };

function MenuForm({ outletId, menu, emojis, cats, onClose, onSaved }: { outletId: string; menu: Menu | null; emojis: string[]; cats: string[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(menu?.name ?? "");
  const [category, setCategory] = useState(menu?.category ?? cats[0] ?? "Katsu");
  const [newCat, setNewCat] = useState(false);
  const [price, setPrice] = useState(menu?.price ?? 0);
  const [description, setDescription] = useState(menu?.description ?? "");
  const [image, setImage] = useState(menu?.image ?? "🍱");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [imgErr, setImgErr] = useState("");
  const [isPromo, setIsPromo] = useState(menu?.isPromo ?? false);
  const [promoPrice, setPromoPrice] = useState(menu?.promoPrice ?? 0);
  const [groups, setGroups] = useState<GroupDraft[]>(
    (menu?.optionGroups ?? []).map((g) => ({ name: g.name, required: g.required, multiple: g.multiple, options: g.options.map((o) => ({ name: o.name, priceDelta: o.priceDelta })) }))
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function addGroup() {
    setGroups((p) => [...p, { name: "", required: false, multiple: false, options: [{ name: "", priceDelta: 0 }] }]);
  }
  function updateGroup(i: number, patch: Partial<GroupDraft>) {
    setGroups((p) => p.map((g, gi) => (gi === i ? { ...g, ...patch } : g)));
  }
  function removeGroup(i: number) {
    setGroups((p) => p.filter((_, gi) => gi !== i));
  }
  function addOption(gi: number) {
    setGroups((p) => p.map((g, i) => (i === gi ? { ...g, options: [...g.options, { name: "", priceDelta: 0 }] } : g)));
  }
  function updateOption(gi: number, oi: number, patch: Partial<{ name: string; priceDelta: number }>) {
    setGroups((p) => p.map((g, i) => (i === gi ? { ...g, options: g.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : g)));
  }
  function removeOption(gi: number, oi: number) {
    setGroups((p) => p.map((g, i) => (i === gi ? { ...g, options: g.options.filter((_, j) => j !== oi) } : g)));
  }

  async function save() {
    setErr("");
    if (!name.trim() || !price) return setErr("Nama & harga wajib.");
    const cat = category.trim();
    if (!cat) return setErr("Kategori wajib diisi.");
    setSaving(true);
    const body = { outletId, name, category: cat, price, description, image, isPromo, promoPrice: isPromo ? promoPrice || null : null };
    const res = menu
      ? await fetch(`/api/menu/${menu.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch(`/api/menu`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) {
      setSaving(false);
      const d = await res.json().catch(() => ({}));
      return setErr(d.error || "Gagal menyimpan.");
    }
    const saved = await res.json();
    const menuId = menu?.id ?? saved.menu?.id;
    if (menuId) {
      const cleanGroups = groups
        .filter((g) => g.name.trim() && g.options.some((o) => o.name.trim()))
        .map((g) => ({ ...g, options: g.options.filter((o) => o.name.trim()) }));
      await fetch(`/api/menu/${menuId}/options`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groups: cleanGroups }) });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-sumi/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div className="paper-card rounded-t-[1.75rem] sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-bold p-6 pb-0 shrink-0">{menu ? "Edit Menu" : "Menu Baru"}</h2>
        <div className="flex-1 overflow-y-auto scroll-thin p-6 space-y-3">
          <Field label="Nama"><input value={name} onChange={(e) => setName(e.target.value)} className="in" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategori">
              {newCat ? (
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Nama kategori baru"
                    maxLength={40}
                    className="in"
                  />
                  <button
                    type="button"
                    title="Batal"
                    onClick={() => { setNewCat(false); setCategory(cats[0] ?? "Katsu"); }}
                    className="shrink-0 rounded-lg border border-gray-4 px-2.5 text-gray-5 hover:border-primary hover:text-primary transition"
                  >
                    <IconX className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="in">
                    {cats.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <button
                    type="button"
                    title="Tambah kategori baru"
                    onClick={() => { setNewCat(true); setCategory(""); }}
                    className="shrink-0 rounded-lg border border-gray-4 px-2.5 text-gray-8 hover:border-primary hover:text-primary transition"
                  >
                    <IconPlus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </Field>
            <Field label="Harga (Rp)"><input type="number" value={price || ""} onChange={(e) => setPrice(Number(e.target.value))} className="in" /></Field>
          </div>
          <Field label="Deskripsi (isi produk, bahan, dll — tampil di menu & pilihan varian)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="mis. Katsu ayam krispi di atas nasi hangat, disiram saus tonkatsu." className="in resize-none" />
          </Field>
          <Field label="Foto Menu">
            <div className="mt-1 flex items-center gap-3">
              <div className="h-16 w-16 rounded-xl overflow-hidden shrink-0 ring-1 ring-sumi/10">
                <MenuImage image={image} category={category} className="h-full w-full" />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="block rounded-lg border border-gray-6 bg-white px-3 py-2 text-xs font-semibold text-center cursor-pointer hover:border-primary hover:text-primary transition">
                  {uploadingImg ? "Mengunggah…" : "Unggah Foto Asli"}
                  <input type="file" accept="image/*" hidden disabled={uploadingImg} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setImgErr("");
                    setUploadingImg(true);
                    try { setImage(await uploadImage(file)); }
                    catch (er) { setImgErr(er instanceof Error ? er.message : "Gagal mengunggah."); }
                    finally { setUploadingImg(false); e.target.value = ""; }
                  }} />
                </label>
                {imgErr && <p className="text-[11px] font-medium text-primary">{imgErr}</p>}
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
          <div className="rounded-xl border border-sumi/15 bg-washi/40 p-3 space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sumi/60">🔥 Tandai sebagai Promo</span>
              <input type="checkbox" checked={isPromo} onChange={(e) => setIsPromo(e.target.checked)} />
            </label>
            {isPromo && (
              <Field label="Harga Promo (Rp, opsional — kosongkan jika hanya ingin tampil di halaman promo)">
                <input type="number" value={promoPrice || ""} onChange={(e) => setPromoPrice(Number(e.target.value))} className="in" placeholder={`Normal: ${price}`} />
              </Field>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sumi/60">Opsi / Varian (mis. Level Pedas, Tambahan)</span>
              <button type="button" onClick={addGroup} className="text-xs font-semibold text-shu hover:underline">+ Grup</button>
            </div>
            <div className="mt-1.5 space-y-2.5 max-h-52 overflow-y-auto scroll-thin pr-1">
              {groups.map((g, gi) => (
                <div key={gi} className="rounded-xl border border-sumi/15 bg-washi/40 p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      value={g.name}
                      onChange={(e) => updateGroup(gi, { name: e.target.value })}
                      placeholder="Nama grup (mis. Level Pedas)"
                      className="flex-1 rounded-lg border border-sumi/15 bg-paper px-2.5 py-1.5 text-xs outline-none focus:border-shu"
                    />
                    <button type="button" onClick={() => removeGroup(gi)} className="text-rose-400 hover:text-rose-600 text-xs px-1">✕</button>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-sumi/60">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={g.required} onChange={(e) => updateGroup(gi, { required: e.target.checked })} /> Wajib pilih
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={g.multiple} onChange={(e) => updateGroup(gi, { multiple: e.target.checked })} /> Bisa multi-pilih
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    {g.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-1.5">
                        <input
                          value={o.name}
                          onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                          placeholder="Nama opsi"
                          className="flex-1 rounded-lg border border-sumi/15 bg-paper px-2.5 py-1.5 text-xs outline-none focus:border-shu"
                        />
                        <input
                          type="number"
                          value={o.priceDelta || ""}
                          onChange={(e) => updateOption(gi, oi, { priceDelta: Number(e.target.value) })}
                          placeholder="+Rp"
                          className="w-20 rounded-lg border border-sumi/15 bg-paper px-2.5 py-1.5 text-xs outline-none focus:border-shu"
                        />
                        <button type="button" onClick={() => removeOption(gi, oi)} className="text-rose-400 hover:text-rose-600 text-xs px-1">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(gi)} className="text-[11px] font-semibold text-shu hover:underline">+ Opsi</button>
                  </div>
                </div>
              ))}
              {groups.length === 0 && <p className="text-[11px] text-sumi/40">Belum ada varian. Menu ini akan tampil apa adanya tanpa pilihan tambahan.</p>}
            </div>
          </div>
          {err && <p className="text-sm text-shu bg-shu/10 rounded-lg px-3 py-2">{err}</p>}
        </div>
        <div className="flex gap-2 p-6 pt-3 border-t border-sumi/10 shrink-0">
          <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Menyimpan…" : "Simpan"}</Button>
          <Button variant="ghost" onClick={onClose}>Batal</Button>
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
