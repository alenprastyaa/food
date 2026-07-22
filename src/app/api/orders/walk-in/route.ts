import { prisma } from "@/lib/prisma";
import { ok, bad, authed, invoiceNumber } from "@/lib/api";
import { canAccessOutlet } from "@/lib/scope";

// Kasir membuat order untuk pembeli yang datang langsung ke outlet (bukan dari chat).
export async function POST(req: Request) {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);

  const body = await req.json().catch(() => ({}));
  const {
    outletId: bodyOutletId,
    buyerName,
    buyerPhone,
    items,
    paymentMethod,
  } = body as {
    outletId?: string;
    buyerName: string;
    buyerPhone?: string;
    items: { menuId: string; qty: number; notes?: string }[];
    paymentMethod: "CASH" | "QRIS";
  };

  const outletId = user.role === "OWNER" ? bodyOutletId : user.outletId;
  if (!outletId) return bad("Pilih outlet dulu.");
  if (!canAccessOutlet(user, outletId)) return bad("Bukan outletmu.", 403);
  if (!buyerName?.trim()) return bad("Nama pembeli wajib diisi.");
  if (!Array.isArray(items) || items.length === 0) return bad("Pilih minimal satu menu.");
  if (paymentMethod !== "CASH" && paymentMethod !== "QRIS") return bad("Metode pembayaran tidak valid.");

  const menus = await prisma.menu.findMany({ where: { id: { in: items.map((i) => i.menuId) }, outletId } });
  const menuMap = new Map(menus.map((m) => [m.id, m]));

  const orderItems = items
    .filter((i) => menuMap.has(i.menuId) && i.qty > 0)
    .map((i) => {
      const m = menuMap.get(i.menuId)!;
      const sub = m.price * i.qty;
      return { menuId: m.id, menuName: m.name, qty: i.qty, price: m.price, subtotal: sub, notes: i.notes?.trim() || null };
    });
  if (orderItems.length === 0) return bad("Menu tidak valid atau sudah habis.");

  const subtotal = orderItems.reduce((s, i) => s + i.subtotal, 0);
  const isCash = paymentMethod === "CASH";
  const now = new Date();

  const order = await prisma.order.create({
    data: {
      invoiceNumber: invoiceNumber(),
      conversationId: null,
      outletId,
      cashierId: user.id,
      buyerId: null,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone?.trim() || "-",
      orderType: "TAKEAWAY",
      subtotal,
      total: subtotal,
      status: isCash ? "QUEUED" : "WAITING_PAYMENT",
      items: { create: orderItems },
      payment: {
        create: isCash
          ? { method: "CASH", amount: subtotal, status: "PAID", verifiedBy: user.id, verifiedAt: now }
          : { method: "QRIS", amount: subtotal, status: "UNPAID" },
      },
    },
    include: { items: true },
  });

  return ok({ order });
}
