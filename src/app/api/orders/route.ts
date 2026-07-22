import { prisma } from "@/lib/prisma";
import { ok, bad, authed, invoiceNumber } from "@/lib/api";
import { canAccessOutlet, outletScope } from "@/lib/scope";

// List orders (scoped by role)
export async function GET(req: Request) {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const statuses = status ? status.split(",") : undefined;

  const orders = await prisma.order.findMany({
    where: outletScope(user, statuses ? { status: { in: statuses } } : {}),
    include: {
      items: true,
      payment: true,
      outlet: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return ok({ orders });
}

// Create order from a conversation
export async function POST(req: Request) {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);

  const body = await req.json().catch(() => ({}));
  const { conversationId, items, discount = 0, tax = 0, note } = body as {
    conversationId: string;
    items: { menuId: string; qty: number; notes?: string }[];
    discount?: number;
    tax?: number;
    note?: string;
  };

  if (!conversationId || !Array.isArray(items) || items.length === 0) return bad("Pilih minimal satu menu.");

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return bad("Percakapan tidak ditemukan.", 404);
  if (!canAccessOutlet(user, conv.outletId)) return bad("Outlet bukan milikmu.", 403);

  // resolve menu prices from DB
  const menuIds = items.map((i) => i.menuId);
  const menus = await prisma.menu.findMany({ where: { id: { in: menuIds }, outletId: conv.outletId } });
  const menuMap = new Map(menus.map((m) => [m.id, m]));

  const orderItems = items
    .filter((i) => menuMap.has(i.menuId) && i.qty > 0)
    .map((i) => {
      const m = menuMap.get(i.menuId)!;
      const sub = m.price * i.qty;
      return { menuId: m.id, menuName: m.name, qty: i.qty, price: m.price, subtotal: sub, notes: i.notes || null };
    });

  if (orderItems.length === 0) return bad("Menu tidak valid.");

  const subtotal = orderItems.reduce((s, i) => s + i.subtotal, 0);
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(tax || 0));

  const order = await prisma.order.create({
    data: {
      invoiceNumber: invoiceNumber(),
      conversationId: conv.id,
      outletId: conv.outletId,
      cashierId: user.id,
      buyerName: conv.buyerName,
      buyerPhone: conv.buyerPhone,
      orderType: "TAKEAWAY",
      subtotal,
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      deliveryFee: 0,
      total,
      status: "WAITING_CONFIRMATION",
      items: { create: orderItems },
      payment: { create: { method: "QRIS", amount: total, status: "UNPAID" } },
    },
    include: { items: true },
  });

  // drop an order link into the conversation
  await prisma.message.create({
    data: {
      conversationId: conv.id,
      sender: "system",
      type: "system",
      content: `Kasir membuat order ${order.invoiceNumber}. ${note ? "Catatan: " + note : "Silakan review & konfirmasi."}`,
    },
  });
  await prisma.message.create({
    data: {
      conversationId: conv.id,
      sender: "cashier",
      type: "text",
      content: `Order kamu sudah kubuat ya 🙏 Total ${"Rp" + total.toLocaleString("id-ID")}. Tap kartu order di atas untuk pilih Take Away / Delivery lalu bayar QRIS.`,
    },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { lastMessage: `Order ${order.invoiceNumber} dibuat`, status: "OPEN", updatedAt: new Date() },
  });

  return ok({ order });
}
