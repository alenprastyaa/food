"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { PageHeader, PageBody, Panel } from "@/components/dash";
import { HeroBanner } from "@/components/HeroBanner";
import { uploadImage } from "@/lib/upload";
import { IconCamera, IconCheckCircle, IconTrash, IconPackage } from "@/components/icons";

const THEMES = [
  { key: "default", label: "Klasik Merah", swatch: "#c52424" },
  { key: "sakura", label: "Sakura", swatch: "#e31b54" },
  { key: "matcha", label: "Matcha", swatch: "#039855" },
  { key: "malam", label: "Malam", swatch: "#1a1e26" },
];

const field =
  "w-full rounded-lg border border-gray-6 bg-white px-4 py-2.5 text-sm text-dark-1 placeholder:text-gray-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";
const labelCls = "text-xs font-semibold text-gray-8";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-primary" : "bg-gray-6"}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${on ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

export default function SettingsManager() {
  const [announcement, setAnnouncement] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [themeName, setThemeName] = useState("default");
  const [pointsEarnPercent, setPointsEarnPercent] = useState(1);

  const [bannerActive, setBannerActive] = useState(false);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerTag, setBannerTag] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerCtaText, setBannerCtaText] = useState("");
  const [bannerCtaHref, setBannerCtaHref] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetErr, setResetErr] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const [backedUp, setBackedUp] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d.setting ?? {};
        setAnnouncement(s.announcement ?? "");
        setIsActive(!!s.isActive);
        setThemeName(s.themeName ?? "default");
        setPointsEarnPercent(s.pointsEarnPercent ?? 1);
        setBannerActive(!!s.bannerActive);
        setBannerImage(s.bannerImage ?? null);
        setBannerTag(s.bannerTag ?? "");
        setBannerTitle(s.bannerTitle ?? "");
        setBannerSubtitle(s.bannerSubtitle ?? "");
        setBannerCtaText(s.bannerCtaText ?? "");
        setBannerCtaHref(s.bannerCtaHref ?? "");
        setLoading(false);
      });
  }, []);

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setUploading(true);
    try {
      setBannerImage(await uploadImage(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setErr("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        announcement, isActive, themeName, pointsEarnPercent,
        bannerActive, bannerImage, bannerTag, bannerTitle, bannerSubtitle, bannerCtaText, bannerCtaHref,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setErr("Gagal menyimpan. Coba lagi.");
      return;
    }
    setSaved(true);
    // theme is applied server-side on <html>, so re-fetch the page to reflect it
    setTimeout(() => location.reload(), 600);
  }

  async function resetData() {
    setResetErr("");
    if (!backedUp) {
      const skip = confirm(
        "Kamu belum mengunduh cadangan. Setelah reset, data TIDAK bisa dikembalikan.\n\nTetap lanjut tanpa cadangan?"
      );
      if (!skip) return;
    }
    if (!confirm("Yakin reset semua data? Order, chat, menu, outlet, dan akun pembeli akan dihapus permanen.")) return;

    setResetting(true);
    const res = await fetch("/api/settings/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword }),
    });
    setResetting(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setResetErr(d.error || "Gagal mereset data.");
    }
    setResetPassword("");
    setResetDone(true);
    setTimeout(() => location.reload(), 1200);
  }

  if (loading) return null;

  const previewSetting = {
    bannerActive, bannerImage, bannerTag: bannerTag || null, bannerTitle: bannerTitle || null,
    bannerSubtitle: bannerSubtitle || null, bannerCtaText: bannerCtaText || null,
    bannerCtaHref: bannerCtaHref || null,
  };

  return (
    <div>
      <PageHeader title="Pengaturan" subtitle="Banner, pengumuman & tampilan aplikasi">
        <div className="flex items-center gap-3">
          {saved && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-success">
              <IconCheckCircle className="h-4 w-4" /> Tersimpan
            </span>
          )}
          <Button onClick={save} disabled={saving}>{saving ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </PageHeader>

      <PageBody className="max-w-5xl space-y-6">
        {err && (
          <p className="rounded-lg bg-primary-light border border-[#FEE4E2] px-4 py-3 text-sm font-medium text-primary">{err}</p>
        )}

        {/* ---------- Banner menu baru ---------- */}
        <Panel
          title="Banner Halaman Depan"
          action={
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-gray-5">{bannerActive ? "Aktif" : "Nonaktif"}</span>
              <Toggle on={bannerActive} onClick={() => setBannerActive((v) => !v)} />
            </div>
          }
        >
          <p className="-mt-1 mb-5 text-sm text-gray-5">
            Tampil di sisi kanan halaman depan. Pakai ini untuk mengumumkan menu baru ke pengunjung.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* form */}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Gambar Banner</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-6 bg-white px-3 py-2 text-sm font-semibold text-gray-8 hover:border-primary hover:text-primary transition disabled:opacity-60"
                  >
                    <IconCamera className="h-4 w-4" />
                    {uploading ? "Mengunggah…" : bannerImage ? "Ganti Gambar" : "Unggah Gambar"}
                  </button>
                  {bannerImage && (
                    <button
                      type="button"
                      onClick={() => setBannerImage(null)}
                      className="text-sm font-medium text-gray-5 hover:text-primary transition"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickImage} />
                <p className="mt-1.5 text-[11px] text-gray-2">Format gambar bebas, maksimal 5 MB. Rasio lebar (16:9) paling pas.</p>
              </div>

              <div>
                <label className={labelCls}>Label Kecil</label>
                <input
                  value={bannerTag}
                  onChange={(e) => setBannerTag(e.target.value)}
                  placeholder="MENU BARU"
                  maxLength={40}
                  className={`mt-1.5 ${field}`}
                />
              </div>

              <div>
                <label className={labelCls}>Judul</label>
                <input
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="Katsu Cheese Melt"
                  maxLength={90}
                  className={`mt-1.5 ${field}`}
                />
              </div>

              <div>
                <label className={labelCls}>Deskripsi</label>
                <textarea
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  rows={2}
                  placeholder="Katsu renyah dengan lelehan keju mozzarella. Tersedia mulai hari ini."
                  maxLength={160}
                  className={`mt-1.5 ${field}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Teks Tombol</label>
                  <input
                    value={bannerCtaText}
                    onChange={(e) => setBannerCtaText(e.target.value)}
                    placeholder="Pesan Sekarang"
                    maxLength={40}
                    className={`mt-1.5 ${field}`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Link Tombol</label>
                  <input
                    value={bannerCtaHref}
                    onChange={(e) => setBannerCtaHref(e.target.value)}
                    placeholder="/promo"
                    className={`mt-1.5 ${field}`}
                  />
                </div>
              </div>
              <p className="-mt-1 text-[11px] text-gray-2">
                Link harus diawali <code className="rounded bg-gray-3 px-1">/</code> — misal <code className="rounded bg-gray-3 px-1">/promo</code> atau <code className="rounded bg-gray-3 px-1">/outlets</code>. Tombol hanya muncul kalau teks dan link sama-sama diisi.
              </p>
            </div>

            {/* live preview */}
            <div>
              <p className={labelCls}>Pratinjau</p>
              <div className="mt-1.5 rounded-xl bg-gray-3 p-4">
                <HeroBanner setting={{ ...previewSetting, bannerActive: true }} preview />
              </div>
              {!bannerActive && (
                <p className="mt-2 text-[11px] text-gray-2">
                  Banner sedang nonaktif — tidak tampil di halaman depan sampai tombol di atas dinyalakan.
                </p>
              )}
            </div>
          </div>
        </Panel>

        {/* ---------- Pengumuman ---------- */}
        <Panel
          title="Pengumuman Atas"
          action={
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-gray-5">{isActive ? "Aktif" : "Nonaktif"}</span>
              <Toggle on={isActive} onClick={() => setIsActive((v) => !v)} />
            </div>
          }
        >
          <p className="-mt-1 mb-4 text-sm text-gray-5">Strip tipis di paling atas halaman depan.</p>
          <textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Contoh: Promo Katsu Curry diskon 20% khusus hari ini!"
            className={field}
          />
        </Panel>

        {/* ---------- Tema ---------- */}
        <Panel title="Tema Tampilan">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setThemeName(t.key)}
                className={`rounded-xl border p-3 text-left transition ${
                  themeName === t.key ? "border-primary ring-2 ring-primary/20" : "border-gray-4 hover:border-gray-6"
                }`}
              >
                <span className="mb-2 block h-7 w-7 rounded-full" style={{ background: t.swatch }} />
                <span className="text-xs font-semibold text-dark-1">{t.label}</span>
              </button>
            ))}
          </div>
        </Panel>

        {/* ---------- Zona berbahaya ---------- */}
        <section className="rounded-xl border-2 border-[#FDA29B] bg-white">
          <div className="border-b border-[#FEE4E2] bg-primary-light px-5 py-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-primary">
              <IconTrash className="h-4 w-4" />
              Zona Berbahaya
            </h3>
            <p className="mt-0.5 text-sm text-primary/80">Tindakan di sini permanen dan tidak bisa dibatalkan.</p>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <p className="text-sm font-semibold text-dark-1">Reset Data</p>
              <p className="mt-1 text-sm text-gray-5">
                Mengosongkan seluruh data operasional. Aplikasi kembali seperti baru dipasang.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-4 bg-gray-3 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Dihapus</p>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-gray-8">
                    <li>Order, item &amp; pembayaran</li>
                    <li>Chat &amp; seluruh pesan</li>
                    <li>Reservasi &amp; rating</li>
                    <li>Akun pembeli &amp; poin</li>
                    <li>Menu &amp; varian</li>
                    <li>Outlet &amp; QRIS</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-gray-4 bg-gray-3 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-success">Tetap Aman</p>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-gray-8">
                    <li>Akun owner &amp; kasir</li>
                    <li>Pengaturan &amp; tema</li>
                    <li>Banner halaman depan</li>
                  </ul>
                  <p className="mt-2 text-[11px] text-gray-5">
                    Akun kasir tetap ada, tapi penugasan outletnya kosong karena outletnya ikut terhapus.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-4 bg-gray-3 p-3">
              <p className="text-sm font-semibold text-dark-1">1. Unduh cadangan dulu</p>
              <p className="mt-0.5 text-xs text-gray-5">
                File JSON berisi seluruh data saat ini. Satu-satunya cara memulihkan setelah reset.
              </p>
              <a
                href="/api/settings/backup"
                download
                onClick={() => setBackedUp(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-gray-6 bg-white px-3 py-2 text-sm font-semibold text-gray-8 hover:border-primary hover:text-primary transition"
              >
                <IconPackage className="h-4 w-4" />
                Unduh Cadangan
              </a>
              {backedUp && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                  <IconCheckCircle className="h-3.5 w-3.5" /> Cadangan diunduh
                </p>
              )}
            </div>

            <div>
              <label className="block">
                <span className="text-sm font-semibold text-dark-1">2. Konfirmasi dengan password owner</span>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => { setResetPassword(e.target.value); setResetErr(""); }}
                  placeholder="Password akun owner"
                  autoComplete="current-password"
                  className={`mt-1.5 ${field} max-w-sm`}
                />
              </label>
            </div>

            {resetErr && (
              <p className="rounded-lg bg-primary-light px-3 py-2 text-sm font-medium text-primary">{resetErr}</p>
            )}
            {resetDone && (
              <p className="rounded-lg bg-[#ECFDF3] px-3 py-2 text-sm font-medium text-success">
                Data berhasil direset. Memuat ulang…
              </p>
            )}

            <button
              onClick={resetData}
              disabled={resetting || !resetPassword.trim()}
              className="btn-press inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:bg-gray-4 disabled:text-gray-2 disabled:shadow-none"
            >
              <IconTrash className="h-4 w-4" />
              {resetting ? "Menghapus…" : "Reset Data Sekarang"}
            </button>
          </div>
        </section>

        {/* ---------- Poin ---------- */}
        <Panel title="Poin Loyalitas">
          <p className="-mt-1 mb-4 text-sm text-gray-5">
            1 poin = Rp1 saat ditukar. Atur berapa persen dari total belanja yang dikembalikan jadi poin.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={pointsEarnPercent}
              onChange={(e) => setPointsEarnPercent(Number(e.target.value))}
              className={`w-28 ${field}`}
            />
            <span className="text-sm text-gray-5">% dari total belanja</span>
          </div>
          <p className="mt-2 text-[11px] text-gray-2">
            Contoh: pembeli bayar Rp10.000 dengan {pointsEarnPercent}% → dapat{" "}
            {Math.floor((10000 * pointsEarnPercent) / 100)} poin (senilai Rp
            {Math.floor((10000 * pointsEarnPercent) / 100)}).
          </p>
        </Panel>
      </PageBody>
    </div>
  );
}
