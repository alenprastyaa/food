import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";
import { canAccessOutlet } from "@/lib/scope";

const QUEUE_FLOW = ["QUEUED", "COOKING", "READY", "COMPLETED"];

// Cashier changes queue/order status
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);
  const { id } = await params;
  const { status } = await req.json().catch(() => ({}));

  const order = await prisma.order.findUnique({ where: { id }, include: { conversation: true } });
  if (!order) return bad("Order tidak ditemukan.", 404);
  if (!canAccessOutlet(user, order.outletId)) return bad("Bukan outletmu.", 403);

  const allowed = [...QUEUE_FLOW, "CANCELLED"];
  if (!allowed.includes(status)) return bad("Status tidak valid.");

  const updated = await prisma.order.update({ where: { id }, data: { status } });

  // award loyalty points once, when an order first reaches COMPLETED
  if (status === "COMPLETED" && order.status !== "COMPLETED") {
    const buyerId = order.buyerId ?? (await prisma.buyer.findUnique({ where: { phone: order.buyerPhone } }))?.id;
    const setting = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
    const earnPercent = setting?.pointsEarnPercent ?? 1;
    // 1 point = Rp1, so points earned = earnPercent% of order total
    const points = Math.floor((order.total * earnPercent) / 100);
    if (buyerId && points > 0) {
      await prisma.buyer.update({ where: { id: buyerId }, data: { points: { increment: points } } });
      await prisma.pointTransaction.create({
        data: { buyerId, orderId: order.id, delta: points, reason: `Belanja ${order.invoiceNumber}` },
      });
    }
  }

  const labels: Record<string, string> = {
    COOKING: `Pesananmu ${order.invoiceNumber} sedang dimasak 🍳`,
    READY: `Pesananmu ${order.invoiceNumber} sudah siap! 🎉 Silakan diambil / tunggu kurir ya.`,
    COMPLETED: `Pesanan ${order.invoiceNumber} selesai. Terima kasih & sampai jumpa lagi 🌸`,
    CANCELLED: `Pesanan ${order.invoiceNumber} dibatalkan.`,
  };
  if (order.conversationId && labels[status]) {
    await prisma.message.create({
      data: { conversationId: order.conversationId, sender: "cashier", type: "text", content: labels[status] },
    });
  }

  return ok({ order: updated });
}
