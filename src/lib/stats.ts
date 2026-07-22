import { prisma } from "@/lib/prisma";
import { SessionUser } from "./auth";
import { outletScope } from "./scope";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export async function cashierStats(user: SessionUser) {
  const where = outletScope(user);
  const today = startOfToday();

  const [activeChats, waitingPayment, waitingVerif, queued, cooking, ready, todayOrders, revenueAgg, newOrders] =
    await Promise.all([
      prisma.conversation.count({ where: outletScope(user, { status: { in: ["OPEN", "WAITING"] } }) }),
      prisma.order.count({ where: outletScope(user, { status: "WAITING_PAYMENT" }) }),
      prisma.order.count({ where: outletScope(user, { status: "WAITING_PAYMENT_VERIFICATION" }) }),
      prisma.order.count({ where: outletScope(user, { status: "QUEUED" }) }),
      prisma.order.count({ where: outletScope(user, { status: "COOKING" }) }),
      prisma.order.count({ where: outletScope(user, { status: "READY" }) }),
      prisma.order.count({ where: { ...where, createdAt: { gte: today } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { ...where, status: { in: ["PAID", "QUEUED", "COOKING", "READY", "COMPLETED"] }, createdAt: { gte: today } },
      }),
      prisma.order.count({ where: outletScope(user, { status: "WAITING_CONFIRMATION" }) }),
    ]);

  return {
    activeChats,
    newOrders,
    waitingPayment,
    waitingVerif,
    queued,
    cooking,
    ready,
    todayOrders,
    revenueToday: revenueAgg._sum.total ?? 0,
  };
}

const PAID_STATUSES = ["PAID", "QUEUED", "COOKING", "READY", "COMPLETED"];

export async function ownerStats() {
  const today = startOfToday();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 29);

  const outlets = await prisma.outlet.findMany({ orderBy: { name: "asc" } });

  const [revenueAll, totalOrders, totalChats, todayOrders, todayRevenue] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: PAID_STATUSES } } }),
    prisma.order.count(),
    prisma.conversation.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: PAID_STATUSES }, createdAt: { gte: today } } }),
  ]);

  // revenue per outlet
  const perOutlet = await Promise.all(
    outlets.map(async (o) => {
      const agg = await prisma.order.aggregate({ _sum: { total: true }, _count: true, where: { outletId: o.id, status: { in: PAID_STATUSES } } });
      const chatCount = await prisma.conversation.count({ where: { outletId: o.id } });
      return { id: o.id, name: o.name, revenue: agg._sum.total ?? 0, orders: agg._count, chats: chatCount };
    })
  );

  // best selling menus
  const items = await prisma.orderItem.groupBy({
    by: ["menuName"],
    _sum: { qty: true, subtotal: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 6,
  });

  // monthly revenue (last 30 days by day)
  const orders = await prisma.order.findMany({
    where: { status: { in: PAID_STATUSES }, createdAt: { gte: monthAgo } },
    select: { total: true, createdAt: true },
  });
  const byDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(monthAgo);
    d.setDate(monthAgo.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + o.total);
  }
  const monthly = Array.from(byDay.entries()).map(([date, total]) => ({ date, total }));

  return {
    revenueAll: revenueAll._sum.total ?? 0,
    totalOrders,
    totalChats,
    todayOrders,
    todayRevenue: todayRevenue._sum.total ?? 0,
    perOutlet: perOutlet.sort((a, b) => b.revenue - a.revenue),
    bestMenus: items.map((i) => ({ name: i.menuName, qty: i._sum.qty ?? 0, revenue: i._sum.subtotal ?? 0 })),
    monthly,
    outletCount: outlets.length,
  };
}

export async function financeReport(user: SessionUser, range: "day" | "week" | "month", outletId?: string) {
  const now = new Date();
  const from = new Date();
  if (range === "day") from.setHours(0, 0, 0, 0);
  else if (range === "week") from.setDate(now.getDate() - 6);
  else from.setDate(now.getDate() - 29);
  if (range !== "day") from.setHours(0, 0, 0, 0);

  const base = outletScope(user, {});
  const scoped: Record<string, unknown> = { ...base, createdAt: { gte: from } };
  if (outletId && (user.role === "OWNER")) scoped.outletId = outletId;

  const [revenue, orderCount, cancelled, paidCount, avg] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { ...scoped, status: { in: PAID_STATUSES } } }),
    prisma.order.count({ where: scoped }),
    prisma.order.count({ where: { ...scoped, status: "CANCELLED" } }),
    prisma.payment.count({ where: { status: "PAID", order: scoped as never } }),
    prisma.order.aggregate({ _avg: { total: true }, where: { ...scoped, status: { in: PAID_STATUSES } } }),
  ]);

  const orders = await prisma.order.findMany({
    where: scoped,
    include: { outlet: { select: { name: true } }, payment: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    revenue: revenue._sum.total ?? 0,
    orderCount,
    cancelled,
    paidCount,
    avgOrder: Math.round(avg._avg.total ?? 0),
    orders,
  };
}
