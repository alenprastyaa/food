import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";

export async function POST(req: Request) {
  const { outletId, buyerName, buyerPhone } = await req.json().catch(() => ({}));
  if (!outletId || !buyerName || !buyerPhone) return bad("Nama, nomor HP, dan outlet wajib diisi.");

  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet || !outlet.isActive) return bad("Outlet tidak ditemukan atau sedang tutup.", 404);

  const conv = await prisma.conversation.create({
    data: {
      outletId,
      buyerName: String(buyerName).trim(),
      buyerPhone: String(buyerPhone).trim(),
      status: "OPEN",
      lastMessage: "Percakapan dimulai",
      messages: {
        create: [
          { sender: "system", type: "system", content: `Percakapan dengan ${outlet.name} dimulai.` },
          { sender: "cashier", type: "text", content: `Halo ${String(buyerName).trim()}! Selamat datang di ${outlet.name} 🌸 Mau pesan apa hari ini?` },
        ],
      },
    },
  });

  return ok({ conversationId: conv.id });
}
