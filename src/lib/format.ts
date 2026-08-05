export const rupiah = (n: number) =>
  "Rp" + (n ?? 0).toLocaleString("id-ID");

export const rupiahShort = (n: number) => {
  if (n >= 1_000_000) return "Rp" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "jt";
  if (n >= 1_000) return "Rp" + Math.round(n / 1000) + "rb";
  return "Rp" + n;
};

export const timeAgo = (d: Date | string) => {
  const date = new Date(d);
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "baru saja";
  if (s < 3600) return Math.floor(s / 60) + " mnt";
  if (s < 86400) return Math.floor(s / 3600) + " jam";
  return Math.floor(s / 86400) + " hari";
};

export const clock = (d: Date | string) =>
  new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  DRAFT: { label: "Draft", tone: "slate" },
  WAITING_CONFIRMATION: { label: "Menunggu Konfirmasi", tone: "amber" },
  WAITING_PAYMENT: { label: "Menunggu Pembayaran", tone: "amber" },
  WAITING_PAYMENT_VERIFICATION: { label: "Verifikasi Bayar", tone: "violet" },
  PAID: { label: "Lunas", tone: "emerald" },
  QUEUED: { label: "Antrian", tone: "sky" },
  COOKING: { label: "Dimasak", tone: "orange" },
  READY: { label: "Siap", tone: "emerald" },
  COMPLETED: { label: "Selesai", tone: "green" },
  CANCELLED: { label: "Dibatalkan", tone: "rose" },
};

export const PAYMENT_STATUS: Record<string, { label: string; tone: string }> = {
  UNPAID: { label: "Belum Bayar", tone: "slate" },
  WAITING_VERIFICATION: { label: "Menunggu Verifikasi", tone: "violet" },
  PAID: { label: "Terverifikasi", tone: "emerald" },
  REJECTED: { label: "Ditolak", tone: "rose" },
};

export const toneClass: Record<string, string> = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  amber: "bg-amber-100 text-amber-800 ring-amber-200",
  violet: "bg-violet-100 text-violet-800 ring-violet-200",
  emerald: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  sky: "bg-sky-100 text-sky-800 ring-sky-200",
  orange: "bg-orange-100 text-orange-800 ring-orange-200",
  green: "bg-green-100 text-green-800 ring-green-200",
  rose: "bg-rose-100 text-rose-800 ring-rose-200",
};
