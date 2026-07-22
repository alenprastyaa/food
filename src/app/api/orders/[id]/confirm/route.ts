import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";

// Buyer confirms the reviewed order → proceed to payment
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return bad("Order tidak ditemukan.", 404);
  if (order.status !== "WAITING_CONFIRMATION") return bad("Order tidak dalam tahap konfirmasi.", 409);

  const updated = await prisma.order.update({ where: { id }, data: { status: "WAITING_PAYMENT" } });

  if (order.conversationId) {
    await prisma.message.create({
      data: { conversationId: order.conversationId, sender: "system", type: "system", content: `Pesanan ${order.invoiceNumber} dikonfirmasi. Menunggu pembayaran.` },
    });
  }
  return ok({ order: updated });
}
