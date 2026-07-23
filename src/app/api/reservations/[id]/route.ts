import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";
import { canAccessOutlet } from "@/lib/scope";

const ALLOWED = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

// Staff: confirm / cancel / complete a reservation
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);
  const { id } = await params;
  const { status } = await req.json().catch(() => ({}));
  if (!ALLOWED.includes(status)) return bad("Status tidak valid.");

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return bad("Reservasi tidak ditemukan.", 404);
  if (!canAccessOutlet(user, reservation.outletId)) return bad("Bukan outletmu.", 403);

  const updated = await prisma.reservation.update({ where: { id }, data: { status } });
  return ok({ reservation: updated });
}
