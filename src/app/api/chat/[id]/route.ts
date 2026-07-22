import { prisma } from "@/lib/prisma";
import { ok, bad } from "@/lib/api";

// Buyer polls this for messages + order links
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: {
      outlet: { select: { id: true, name: true, phone: true, address: true } },
      messages: { orderBy: { createdAt: "asc" } },
      orders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, invoiceNumber: true, status: true, total: true, orderType: true },
      },
    },
  });
  if (!conv) return bad("Percakapan tidak ditemukan.", 404);
  return ok({ conversation: conv });
}
