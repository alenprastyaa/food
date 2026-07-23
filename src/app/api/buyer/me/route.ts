import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";
import { getBuyerSession } from "@/lib/buyerAuth";

export async function GET() {
  const session = await getBuyerSession();
  if (!session) return bad("Belum masuk.", 401);

  const buyer = await prisma.buyer.findUnique({ where: { id: session.id } });

  const orders = await prisma.order.findMany({
    where: { OR: [{ buyerId: session.id }, { buyerId: null, buyerPhone: session.phone }] },
    include: { items: true, outlet: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const reservations = await prisma.reservation.findMany({
    where: { OR: [{ buyerId: session.id }, { buyerId: null, buyerPhone: session.phone }] },
    include: { outlet: { select: { name: true } } },
    orderBy: { reservedFor: "desc" },
    take: 20,
  });

  return ok({ buyer: { ...session, points: buyer?.points ?? 0 }, orders, reservations });
}
