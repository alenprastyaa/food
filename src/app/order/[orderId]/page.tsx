import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderFlow from "./OrderFlow";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) notFound();
  return <OrderFlow orderId={order.id} conversationId={order.conversationId} />;
}
