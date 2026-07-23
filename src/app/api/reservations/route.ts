import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";
import { outletScope } from "@/lib/scope";
import { getBuyerSession } from "@/lib/buyerAuth";

// Staff: list reservations scoped to their outlet (owner sees all)
export async function GET() {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);
  const reservations = await prisma.reservation.findMany({
    where: outletScope(user),
    include: { outlet: { select: { name: true } } },
    orderBy: { reservedFor: "asc" },
  });
  return ok({ reservations });
}

// Buyer: create a reservation request
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { outletId, buyerName, buyerPhone, partySize, reservedFor, notes } = body as {
    outletId: string;
    buyerName: string;
    buyerPhone: string;
    partySize: number;
    reservedFor: string;
    notes?: string;
  };

  if (!outletId || !buyerName?.trim() || !buyerPhone?.trim() || !partySize || !reservedFor)
    return bad("Nama, nomor HP, jumlah orang, dan waktu reservasi wajib diisi.");

  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet || !outlet.isActive) return bad("Outlet tidak ditemukan atau sedang tutup.", 404);

  const when = new Date(reservedFor);
  if (Number.isNaN(when.getTime()) || when.getTime() < Date.now()) return bad("Waktu reservasi tidak valid.");

  const buyerSession = await getBuyerSession();

  const reservation = await prisma.reservation.create({
    data: {
      outletId,
      buyerId: buyerSession?.id ?? null,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      partySize: Math.max(1, Math.round(Number(partySize))),
      reservedFor: when,
      notes: notes?.trim() || null,
    },
  });
  return ok({ reservation });
}
