import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";
import { canAccessOutlet } from "@/lib/scope";

// Cashier confirms cash was received for a COD order
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id }, include: { payment: true } });
  if (!order) return bad("Order tidak ditemukan.", 404);
  if (!canAccessOutlet(user, order.outletId)) return bad("Bukan outletmu.", 403);
  if (!order.payment || order.payment.method !== "COD") return bad("Order ini bukan pembayaran COD.", 409);
  if (order.payment.status === "PAID") return bad("Sudah ditandai lunas.", 409);

  const updated = await prisma.order.update({
    where: { id },
    data: { payment: { update: { status: "PAID", verifiedBy: user.id, verifiedAt: new Date() } } },
    include: { payment: true },
  });
  return ok({ order: updated });
}
