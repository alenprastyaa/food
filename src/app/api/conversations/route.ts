import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";
import { outletScope } from "@/lib/scope";

export async function GET(req: Request) {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase();

  let conversations = await prisma.conversation.findMany({
    where: outletScope(user),
    include: {
      outlet: { select: { name: true } },
      _count: { select: { messages: true } },
      orders: { select: { id: true, status: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  if (q) {
    conversations = conversations.filter(
      (c) => c.buyerName.toLowerCase().includes(q) || c.buyerPhone.includes(q) || (c.lastMessage ?? "").toLowerCase().includes(q)
    );
  }

  return ok({ conversations });
}
