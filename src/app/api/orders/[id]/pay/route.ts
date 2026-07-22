import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";

// Buyer uploads payment proof
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { proofImage } = await req.json().catch(() => ({}));
  if (!proofImage) return bad("Upload bukti pembayaran dulu ya.");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return bad("Order tidak ditemukan.", 404);
  if (!["WAITING_PAYMENT", "WAITING_PAYMENT_VERIFICATION"].includes(order.status))
    return bad("Order tidak dalam tahap pembayaran.", 409);

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "WAITING_PAYMENT_VERIFICATION",
      payment: { update: { proofImage, status: "WAITING_VERIFICATION" } },
    },
    include: { payment: true },
  });

  if (order.conversationId) {
    await prisma.message.create({
      data: { conversationId: order.conversationId, sender: "buyer", type: "text", content: `Sudah transfer untuk order ${order.invoiceNumber}, ini bukti pembayarannya ya kak 🙏` },
    });
    await prisma.message.create({
      data: { conversationId: order.conversationId, sender: "buyer", type: "image", content: proofImage },
    });
    await prisma.conversation.update({ where: { id: order.conversationId }, data: { lastMessage: "📷 Bukti pembayaran", status: "WAITING", updatedAt: new Date() } });
  }
  return ok({ order: updated });
}
