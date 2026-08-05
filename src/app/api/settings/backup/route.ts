import { prisma } from "@/lib/prisma";
import { bad, authed } from "@/lib/api";

/**
 * Full JSON dump, offered right before a reset so the wipe is recoverable.
 * Owner only — this contains every order, buyer and staff record.
 */
export async function GET() {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Tidak diizinkan.", 403);

  const [
    outlets, outletPayments, outletRatings, reservations,
    users, buyers, pointTransactions, siteSetting,
    menus, menuOptionGroups, menuOptions,
    conversations, messages,
    orders, orderItems, orderItemOptions, payments,
  ] = await Promise.all([
    prisma.outlet.findMany(),
    prisma.outletPayment.findMany(),
    prisma.outletRating.findMany(),
    prisma.reservation.findMany(),
    prisma.user.findMany(),
    prisma.buyer.findMany(),
    prisma.pointTransaction.findMany(),
    prisma.siteSetting.findUnique({ where: { id: "singleton" } }),
    prisma.menu.findMany(),
    prisma.menuOptionGroup.findMany(),
    prisma.menuOption.findMany(),
    prisma.conversation.findMany(),
    prisma.message.findMany(),
    prisma.order.findMany(),
    prisma.orderItem.findMany(),
    prisma.orderItemOption.findMany(),
    prisma.payment.findMany(),
  ]);

  const dump = {
    exportedAt: new Date().toISOString(),
    exportedBy: user.email,
    data: {
      outlets, outletPayments, outletRatings, reservations,
      users, buyers, pointTransactions, siteSetting,
      menus, menuOptionGroups, menuOptions,
      conversations, messages,
      orders, orderItems, orderItemOptions, payments,
    },
  };

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return new Response(JSON.stringify(dump, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="nashi-katsu-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
