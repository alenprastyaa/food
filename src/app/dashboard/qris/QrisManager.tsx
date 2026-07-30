"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { PageHeader } from "@/components/dash";
import { fileToDataUrl } from "@/lib/hooks";

type Outlet = {
  id: string;
  name: string;
  payment: { qrisImage: string | null; ownerName: string; notes: string | null } | null;
};

export default function QrisManager() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [editing, setEditing] = useState<Outlet | null>(null);

  async function load() {
    const d = await fetch("/api/outlets").then((r) => r.json());
    setOutlets(d.outlets ?? []);
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="QRIS" jp="支払い" subtitle="Kelola QRIS statis pembayaran tiap outlet" />
      <div className="p-5 lg:p-8 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {outlets.map((o) => (
          <div key={o.id} className="paper-card rounded-2xl p-5 text-center">
            <h3 className="font-display font-extrabold text-sumi">{o.name}</h3>
            <div className="mt-3 rounded-xl bg-white ring-1 ring-sumi/10 p-3 grid place-items-center aspect-square">
              {o.payment?.qrisImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.payment.qrisImage} alt="QRIS" className="max-h-52 object-contain" />
              ) : (
                <span className="text-sumi/30 text-sm">Belum ada QRIS</span>
              )}
            </div>
            <p className="text-sm font-round font-bold mt-2">{o.payment?.ownerName ?? "—"}</p>
            {o.payment?.notes && <p className="text-xs text-sumi/50 mt-1">{o.payment.notes}</p>}
            <div className="flex gap-2 mt-3">
              {o.payment?.qrisImage && (
                <a
                  href={o.payment.qrisImage}
                  download={`qris-${o.name}.png`}
                  className="flex-1 inline-flex items-center justify-center rounded-xl ring-1 ring-sumi/15 text-sumi text-sm font-round font-bold py-2.5 hover:bg-sumi/5 transition"
                >
                  ⬇ Unduh
                </a>
              )}
              <Button variant="outline" className="flex-1" onClick={() => setEditing(o)}>✎ Ubah</Button>
            </div>
          </div>
        ))}
      </div>
      {editing && <QrisForm outlet={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function QrisForm({ outlet, onClose, onSaved }: { outlet: Outlet; onClose: () => void; onSaved: () => void }) {
  const [qris, setQris] = useState<string | null>(outlet.payment?.qrisImage ?? null);
  const [ownerName, setOwnerName] = useState(outlet.payment?.ownerName ?? "NASHI KATSU FOOD");
  const [notes, setNotes] = useState(outlet.payment?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQris(await fileToDataUrl(file));
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/outlets/${outlet.id}/qris`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrisImage: qris, ownerName, notes }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sumi/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="paper-card rounded-3xl p-6 w-full max-w-md animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-extrabold mb-4">QRIS · {outlet.name}</h2>
        <label className="block">
          <span className="text-xs font-semibold text-sumi/60">Gambar QRIS</span>
          <div className="mt-1 rounded-xl border-2 border-dashed border-sumi/20 p-4 grid place-items-center cursor-pointer hover:border-shu transition bg-washi/40 aspect-square">
            {qris ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qris} alt="qris" className="max-h-52 object-contain" />
            ) : (
              <span className="text-sm text-sumi/40">📤 Unggah gambar QRIS</span>
            )}
            <input type="file" accept="image/*" hidden onChange={onFile} />
          </div>
        </label>
        <div className="space-y-3 mt-3">
          <label className="block"><span className="text-xs font-semibold text-sumi/60">Nama Merchant</span>
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="in" /></label>
          <label className="block"><span className="text-xs font-semibold text-sumi/60">Catatan</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="in" /></label>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Menyimpan…" : "Simpan QRIS"}</Button>
            <Button variant="ghost" onClick={onClose}>Batal</Button>
          </div>
        </div>
      </div>
      <style>{`.in{margin-top:.25rem;width:100%;border-radius:.75rem;border:1px solid rgba(23,40,46,.15);background:rgba(247,241,227,.5);padding:.6rem .9rem;font-size:.875rem;outline:none}.in:focus{border-color:var(--color-shu);box-shadow:0 0 0 2px rgba(214,72,63,.15)}`}</style>
    </div>
  );
}
