import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";
import { getBuyerSession } from "@/lib/buyerAuth";

export async function GET() {
  const session = await getBuyerSession();
  if (!session) return bad("Belum masuk.", 401);

  const orders = await prisma.order.findMany({
    where: { buyerId: session.id },
    include: { items: true, outlet: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return ok({ buyer: session, orders });
}
