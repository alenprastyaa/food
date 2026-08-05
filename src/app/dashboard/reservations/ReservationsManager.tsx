"use client";
import { useMemo, useState } from "react";
import { usePoll } from "@/lib/hooks";
import { PageHeader, EmptyState } from "@/components/dash";
import { IconCalendar } from "@/components/icons";
import { StatusBadge, Button } from "@/components/ui";

type Reservation = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  partySize: number;
  reservedFor: string;
  notes: string | null;
  status: string;
  createdAt: string;
  outlet?: { name: string };
};

const STATUS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Menunggu", tone: "amber" },
  CONFIRMED: { label: "Dikonfirmasi", tone: "sky" },
  COMPLETED: { label: "Selesai", tone: "emerald" },
  CANCELLED: { label: "Dibatalkan", tone: "rose" },
};

const FILTERS = [
  { key: "upcoming", label: "Menunggu & Dikonfirmasi", statuses: ["PENDING", "CONFIRMED"] },
  { key: "all", label: "Semua", statuses: null as string[] | null },
  { key: "done", label: "Selesai", statuses: ["COMPLETED"] },
  { key: "cancel", label: "Batal", statuses: ["CANCELLED"] },
];

export default function ReservationsManager({ role }: { role: string }) {
  const [filter, setFilter] = useState("upcoming");
  const [busy, setBusy] = useState<string | null>(null);
  const { data, reload } = usePoll<{ reservations: Reservation[] }>("/api/reservations", 5000);
  const reservations = data?.reservations ?? [];

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter);
    if (!f?.statuses) return reservations;
    return reservations.filter((r) => f.statuses!.includes(r.status));
  }, [reservations, filter]);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    await fetch(`/api/reservations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null);
    reload();
  }

  return (
    <div>
      <PageHeader title="Reservasi" subtitle="Booking meja dari pembeli">
        <span className="text-sm text-sumi/50">{reservations.length} total</span>
      </PageHeader>

      <div className="p-5 lg:p-8">
        <div className="flex gap-2 overflow-x-auto scroll-thin pb-3 -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-round font-semibold transition ${
                filter === f.key ? "bg-shu text-white shadow-[0_3px_0_var(--color-shu-dark)]" : "bg-paper text-sumi/60 ring-1 ring-sumi/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<IconCalendar className="h-6 w-6" />} title="Belum ada reservasi di sini" subtitle="Reservasi baru dari pembeli akan muncul otomatis." />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
            {filtered.map((r) => {
              const st = STATUS[r.status];
              return (
                <div key={r.id} className="paper-card rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-round font-semibold text-sm text-sumi">{r.buyerName}</p>
                    <StatusBadge label={st?.label} tone={st?.tone} />
                  </div>
                  <p className="text-xs text-sumi/50 mt-1">
                    📅 {new Date(r.reservedFor).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="text-xs text-sumi/50">👥 {r.partySize} orang · 📞 {r.buyerPhone}</p>
                  {r.notes && <p className="text-xs text-sumi/40 mt-1 italic">"{r.notes}"</p>}
                  {role === "OWNER" && r.outlet && <p className="text-[11px] text-sumi/40 mt-1">{r.outlet.name}</p>}

                  {r.status === "PENDING" && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button variant="matcha" disabled={busy === r.id} onClick={() => setStatus(r.id, "CONFIRMED")} className="py-2 text-xs">
                        ✓ Konfirmasi
                      </Button>
                      <Button variant="outline" disabled={busy === r.id} onClick={() => setStatus(r.id, "CANCELLED")} className="py-2 text-xs">
                        ✕ Tolak
                      </Button>
                    </div>
                  )}
                  {r.status === "CONFIRMED" && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button disabled={busy === r.id} onClick={() => setStatus(r.id, "COMPLETED")} className="py-2 text-xs">
                        🎉 Selesai
                      </Button>
                      <Button variant="outline" disabled={busy === r.id} onClick={() => setStatus(r.id, "CANCELLED")} className="py-2 text-xs">
                        ✕ Batal
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
