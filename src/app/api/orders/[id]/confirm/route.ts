import { prisma } from "@/lib/prisma";
import { ok, bad, nextQueueNumber } from "@/lib/api";

// Buyer confirms the reviewed order → proceed to payment (or straight to kitchen for COD)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { paymentMethod } = await req.json().catch(() => ({}));
  const isCod = paymentMethod === "COD";

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return bad("Order tidak ditemukan.", 404);
  if (order.status !== "WAITING_CONFIRMATION") return bad("Order tidak dalam tahap konfirmasi.", 409);

  const queueNumber = isCod ? await nextQueueNumber(order.outletId) : undefined;

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: isCod ? "QUEUED" : "WAITING_PAYMENT",
      queueNumber,
      payment: { update: { method: isCod ? "COD" : "QRIS" } },
    },
  });

  if (order.conversationId) {
    await prisma.message.create({
      data: {
        conversationId: order.conversationId,
        sender: "system",
        type: "system",
        content: isCod
          ? `Pesanan ${order.invoiceNumber} dikonfirmasi. Bayar di tempat (COD) saat pesanan diambil/diantar — langsung masuk antrian dapur.`
          : `Pesanan ${order.invoiceNumber} dikonfirmasi. Menunggu pembayaran.`,
      },
    });
  }
  return ok({ order: updated });
}
