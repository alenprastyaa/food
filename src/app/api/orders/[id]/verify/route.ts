import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";
import { canAccessOutlet } from "@/lib/scope";

// Cashier approves/rejects payment
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);
  const { id } = await params;
  const { action, notes } = await req.json().catch(() => ({}));

  const order = await prisma.order.findUnique({ where: { id }, include: { payment: true } });
  if (!order) return bad("Order tidak ditemukan.", 404);
  if (!canAccessOutlet(user, order.outletId)) return bad("Bukan outletmu.", 403);
  if (order.status !== "WAITING_PAYMENT_VERIFICATION") return bad("Tidak ada pembayaran untuk diverifikasi.", 409);

  if (action === "approve") {
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "QUEUED",
        payment: { update: { status: "PAID", verifiedBy: user.id, verifiedAt: new Date(), notes: notes || null } },
      },
    });
    if (order.conversationId) {
      await prisma.message.create({
        data: { conversationId: order.conversationId, sender: "cashier", type: "text", content: `Pembayaran ${order.invoiceNumber} sudah kami terima ✅ Pesananmu masuk antrian dapur ya!` },
      });
    }
    return ok({ order: updated });
  }

  if (action === "reject") {
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "WAITING_PAYMENT",
        payment: { update: { status: "REJECTED", verifiedBy: user.id, verifiedAt: new Date(), notes: notes || "Bukti tidak valid" } },
      },
    });
    if (order.conversationId) {
      await prisma.message.create({
        data: { conversationId: order.conversationId, sender: "cashier", type: "text", content: `Maaf, bukti pembayaran ${order.invoiceNumber} belum bisa kami verifikasi 🙏 ${notes ? "(" + notes + ") " : ""}Boleh dikirim ulang ya.` },
      });
    }
    return ok({ order: updated });
  }

  return bad("Aksi tidak dikenal.");
}
