import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";

// Public order detail for buyer order link
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { options: true } },
      payment: true,
      outlet: { include: { payment: true } },
    },
  });
  if (!order) return bad("Order tidak ditemukan.", 404);
  const rating = await prisma.outletRating.findUnique({ where: { orderId: id } });
  return ok({ order: { ...order, rating } });
}
