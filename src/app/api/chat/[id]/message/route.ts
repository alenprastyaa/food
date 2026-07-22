import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";

// sender=buyer is public; sender=cashier requires auth
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sender, type, content } = await req.json().catch(() => ({}));
  if (!content || !sender) return bad("Pesan kosong.");

  const conv = await prisma.conversation.findUnique({ where: { id } });
  if (!conv) return bad("Percakapan tidak ditemukan.", 404);

  if (sender === "cashier") {
    const user = await authed();
    if (!user) return bad("Tidak diizinkan.", 401);
  }

  const message = await prisma.message.create({
    data: { conversationId: id, sender, type: type || "text", content },
  });

  await prisma.conversation.update({
    where: { id },
    data: {
      lastMessage: type === "image" ? "📷 Gambar" : String(content).slice(0, 120),
      status: sender === "buyer" ? "WAITING" : "OPEN",
      updatedAt: new Date(),
    },
  });

  return ok({ message });
}
