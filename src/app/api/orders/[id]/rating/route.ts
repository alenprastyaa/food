import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";

// Buyer rates the outlet after their order is completed (one rating per order)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { stars, comment } = await req.json().catch(() => ({}));
  const s = Number(stars);
  if (!Number.isInteger(s) || s < 1 || s > 5) return bad("Rating harus 1-5 bintang.");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return bad("Order tidak ditemukan.", 404);
  if (order.status !== "COMPLETED") return bad("Order belum selesai.", 409);

  const existing = await prisma.outletRating.findUnique({ where: { orderId: id } });
  if (existing) return bad("Order ini sudah diberi rating.", 409);

  const rating = await prisma.outletRating.create({
    data: { outletId: order.outletId, orderId: id, buyerName: order.buyerName, stars: s, comment: comment?.trim() || null },
  });
  return ok({ rating });
}
