import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";
import { getBuyerSession } from "@/lib/buyerAuth";

export async function POST(req: Request) {
  const { outletId, buyerName, buyerPhone } = await req.json().catch(() => ({}));
  if (!outletId || !buyerName || !buyerPhone) return bad("Nama, nomor HP, dan outlet wajib diisi.");

  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet || !outlet.isActive) return bad("Outlet tidak ditemukan atau sedang tutup.", 404);

  const buyerNameClean = String(buyerName).trim();
  const buyerPhoneClean = String(buyerPhone).trim();
  const buyerSession = await getBuyerSession();

  // satu pembeli = satu percakapan berjalan per outlet — lanjutkan yang sudah ada, jangan duplikat
  const existing = await prisma.conversation.findFirst({
    where: {
      outletId,
      status: { not: "CLOSED" },
      OR: [...(buyerSession?.id ? [{ buyerId: buyerSession.id }] : []), { buyerPhone: buyerPhoneClean }],
    },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) {
    if (buyerSession?.id && !existing.buyerId) {
      await prisma.conversation.update({ where: { id: existing.id }, data: { buyerId: buyerSession.id } });
    }
    return ok({ conversationId: existing.id });
  }

  const conv = await prisma.conversation.create({
    data: {
      outletId,
      buyerId: buyerSession?.id ?? null,
      buyerName: buyerNameClean,
      buyerPhone: buyerPhoneClean,
      status: "OPEN",
      lastMessage: "Percakapan dimulai",
      messages: {
        create: [
          { sender: "system", type: "system", content: `Percakapan dengan ${outlet.name} dimulai.` },
          { sender: "cashier", type: "text", content: `Halo ${buyerNameClean}! Selamat datang di ${outlet.name} 🌸 Mau pesan apa hari ini?` },
        ],
      },
    },
  });

  return ok({ conversationId: conv.id });
}
