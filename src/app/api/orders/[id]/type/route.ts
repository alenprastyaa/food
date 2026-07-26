import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";
import { DELIVERY_FEE } from "@/lib/scope";

// Buyer sets take away / delivery
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orderType, deliveryAddress, latitude, longitude, scheduledFor } = await req.json().catch(() => ({}));
  if (!["TAKEAWAY", "DELIVERY"].includes(orderType)) return bad("Tipe pesanan tidak valid.");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return bad("Order tidak ditemukan.", 404);
  if (!["WAITING_CONFIRMATION", "WAITING_PAYMENT"].includes(order.status))
    return bad("Order sudah tidak bisa diubah.", 409);

  if (orderType === "DELIVERY" && (!deliveryAddress || latitude == null || longitude == null))
    return bad("Delivery butuh alamat & lokasi GPS aktif.");

  const deliveryFee = orderType === "DELIVERY" ? DELIVERY_FEE : 0;
  const total = Math.max(0, order.subtotal - order.discount - order.pointsUsed + order.tax + deliveryFee);

  const updated = await prisma.order.update({
    where: { id },
    data: {
      orderType,
      deliveryAddress: orderType === "DELIVERY" ? deliveryAddress : null,
      latitude: orderType === "DELIVERY" ? latitude : null,
      longitude: orderType === "DELIVERY" ? longitude : null,
      deliveryFee,
      total,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      payment: { update: { amount: total } },
    },
  });
  return ok({ order: updated });
}
