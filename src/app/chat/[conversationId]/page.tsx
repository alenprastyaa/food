import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BuyerChat from "./BuyerChat";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { outlet: { select: { name: true, phone: true } } },
  });
  if (!conv) notFound();

  return <BuyerChat conversationId={conv.id} outletName={conv.outlet.name} buyerName={conv.buyerName} />;
}
