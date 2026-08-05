import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OrdersManager from "./OrdersManager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = (await getSession())!;
  const outlets =
    user.role === "OWNER"
      ? await prisma.outlet.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      : user.outletId
        ? await prisma.outlet.findMany({ where: { id: user.outletId }, select: { id: true, name: true } })
        : [];
  return (
    <Suspense>
      <OrdersManager role={user.role} outlets={outlets} />
    </Suspense>
  );
}
