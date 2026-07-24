import { prisma } from "@/lib/prisma";
import { ok, bad, invoiceNumber } from "@/lib/api";
import { getBuyerSession } from "@/lib/buyerAuth";

// Buyer checks out from cart (e-commerce style) — creates conversation + order in one go
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { outletId, buyerName, buyerPhone, items, pointsToUse } = body as {
    outletId: string;
    buyerName: string;
    buyerPhone: string;
    items: { menuId: string; qty: number; notes?: string; forName?: string; optionIds?: string[] }[];
    pointsToUse?: number;
  };

  if (!outletId || !buyerName?.trim() || !buyerPhone?.trim() || !Array.isArray(items) || items.length === 0)
    return bad("Nama, nomor HP, dan minimal satu item wajib diisi.");

  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet || !outlet.isActive) return bad("Outlet tidak ditemukan atau sedang tutup.", 404);

  const menus = await prisma.menu.findMany({
    where: { id: { in: items.map((i) => i.menuId) }, outletId, isAvailable: true },
    include: { optionGroups: { include: { options: true } } },
  });
  const menuMap = new Map(menus.map((m) => [m.id, m]));

  const orderItems = items
    .filter((i) => menuMap.has(i.menuId) && i.qty > 0)
    .map((i) => {
      const m = menuMap.get(i.menuId)!;
      const allOptions = m.optionGroups.flatMap((g) => g.options);
      const selected = (i.optionIds ?? []).map((id) => allOptions.find((o) => o.id === id)).filter((o): o is NonNullable<typeof o> => !!o);
      const unitPrice = m.price + selected.reduce((s, o) => s + o.priceDelta, 0);
      const sub = unitPrice * i.qty;
      return {
        menuId: m.id,
        menuName: m.name,
        qty: i.qty,
        price: unitPrice,
        subtotal: sub,
        notes: i.notes?.trim() || null,
        forName: i.forName?.trim() || null,
        options: { create: selected.map((o) => ({ optionName: o.name, priceDelta: o.priceDelta })) },
      };
    });

  if (orderItems.length === 0) return bad("Keranjang tidak valid — menu mungkin sudah habis.");

  const subtotal = orderItems.reduce((s, i) => s + i.subtotal, 0);
  const buyerSession = await getBuyerSession();
  const buyerNameClean = String(buyerName).trim();
  const buyerPhoneClean = String(buyerPhone).trim();

  // redeem loyalty points: 1 point = Rp100, capped by balance and by subtotal
  let pointsUsed = 0;
  const buyer = buyerSession?.id ? await prisma.buyer.findUnique({ where: { id: buyerSession.id } }) : null;
  if (buyer && pointsToUse) {
    pointsUsed = Math.max(0, Math.min(Math.floor(Number(pointsToUse)), buyer.points, Math.floor(subtotal / 100)));
  }
  const pointsValue = pointsUsed * 100;
  const total = subtotal - pointsValue;

  // satu pembeli = satu percakapan berjalan per outlet — lanjutkan yang sudah ada, jangan duplikat
  const existing = await prisma.conversation.findFirst({
    where: {
      outletId,
      status: { not: "CLOSED" },
      OR: [...(buyerSession?.id ? [{ buyerId: buyerSession.id }] : []), { buyerPhone: buyerPhoneClean }],
    },
    orderBy: { updatedAt: "desc" },
  });

  const conv = existing
    ? await prisma.conversation.update({
        where: { id: existing.id },
        data: {
          buyerId: buyerSession?.id ?? existing.buyerId,
          status: "OPEN",
          lastMessage: "Checkout dari menu",
          messages: {
            create: [
              { sender: "system", type: "system", content: `${buyerNameClean} checkout dari menu ${outlet.name}.` },
              { sender: "cashier", type: "text", content: `Halo ${buyerNameClean}! Terima kasih sudah order 🌸 Order kamu langsung kami proses ya, silakan review & lanjut ke pembayaran.` },
            ],
          },
        },
      })
    : await prisma.conversation.create({
        data: {
          outletId,
          buyerId: buyerSession?.id ?? null,
          buyerName: buyerNameClean,
          buyerPhone: buyerPhoneClean,
          status: "OPEN",
          lastMessage: "Checkout dari menu",
          messages: {
            create: [
              { sender: "system", type: "system", content: `${buyerNameClean} checkout dari menu ${outlet.name}.` },
              { sender: "cashier", type: "text", content: `Halo ${buyerNameClean}! Terima kasih sudah order 🌸 Order kamu langsung kami proses ya, silakan review & lanjut ke pembayaran.` },
            ],
          },
        },
      });

  const order = await prisma.order.create({
    data: {
      invoiceNumber: invoiceNumber(),
      conversationId: conv.id,
      outletId,
      buyerId: buyerSession?.id ?? null,
      buyerName: buyerNameClean,
      buyerPhone: buyerPhoneClean,
      orderType: "TAKEAWAY",
      subtotal,
      pointsUsed,
      total,
      status: "WAITING_CONFIRMATION",
      items: { create: orderItems },
      payment: { create: { method: "QRIS", amount: total, status: "UNPAID" } },
    },
  });

  if (buyer && pointsUsed > 0) {
    await prisma.buyer.update({ where: { id: buyer.id }, data: { points: { decrement: pointsUsed } } });
    await prisma.pointTransaction.create({
      data: { buyerId: buyer.id, orderId: order.id, delta: -pointsUsed, reason: `Ditukar untuk order ${order.invoiceNumber}` },
    });
  }

  await prisma.message.create({
    data: { conversationId: conv.id, sender: "system", type: "system", content: `Order ${order.invoiceNumber} dibuat dari keranjang. Silakan review & konfirmasi.` },
  });

  return ok({ orderId: order.id, conversationId: conv.id });
}
