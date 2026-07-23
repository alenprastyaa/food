"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { PageHeader } from "@/components/dash";

const THEMES = [
  { key: "default", label: "Klasik Merah", swatch: "#d6483f" },
  { key: "sakura", label: "Sakura", swatch: "#e0637a" },
  { key: "matcha", label: "Matcha", swatch: "#6f8a4f" },
  { key: "malam", label: "Malam", swatch: "#e2554b" },
];

export default function SettingsManager() {
  const [announcement, setAnnouncement] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [themeName, setThemeName] = useState("default");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setAnnouncement(d.setting?.announcement ?? "");
        setIsActive(!!d.setting?.isActive);
        setThemeName(d.setting?.themeName ?? "default");
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcement, isActive, themeName }),
    });
    setSaving(false);
    setSaved(true);
    location.reload(); // theme is applied server-side on <html>, so re-fetch the page to reflect it
  }

  if (loading) return null;

  return (
    <div>
      <PageHeader title="Setting" jp="設定" subtitle="Pengumuman & tampilan aplikasi" />
      <div className="p-5 lg:p-8 max-w-xl space-y-5">
        <div className="paper-card rounded-2xl p-6 space-y-4">
          <p className="font-round font-bold text-sm text-sumi">Tema Tampilan</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setThemeName(t.key)}
                className={`rounded-xl p-3 text-left ring-1 transition ${themeName === t.key ? "ring-2 ring-offset-2 ring-shu" : "ring-sumi/10"}`}
              >
                <span className="block h-6 w-6 rounded-full mb-2" style={{ background: t.swatch }} />
                <span className="text-xs font-round font-bold text-sumi">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="paper-card rounded-2xl p-6 space-y-4">
          <label className="flex items-center justify-between gap-3">
            <div>
              <p className="font-round font-bold text-sm text-sumi">Tampilkan banner pengumuman</p>
              <p className="text-xs text-sumi/50 mt-0.5">Muncul di paling atas landing page kalau aktif.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`shrink-0 text-xs font-bold rounded-full px-3 py-1.5 transition ${isActive ? "bg-emerald-500 text-white" : "bg-sumi/10 text-sumi/50"}`}
            >
              {isActive ? "● Aktif" : "○ Nonaktif"}
            </button>
          </label>
          <div>
            <label className="text-xs font-semibold text-sumi/60">Isi Pengumuman</label>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              rows={3}
              placeholder="Contoh: Promo Katsu Curry diskon 20% khusus hari ini!"
              className="mt-1 w-full rounded-xl border border-sumi/15 bg-washi/40 px-4 py-2.5 text-sm outline-none focus:border-shu focus:ring-2 focus:ring-shu/20"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving}>{saving ? "Menyimpan…" : "Simpan"}</Button>
            {saved && <span className="text-sm text-emerald-600 font-round font-bold">Tersimpan ✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
