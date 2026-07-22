import { prisma } from "@/lib/prisma";
import CashiersManager from "./CashiersManager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const outlets = await prisma.outlet.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return <CashiersManager outlets={outlets} />;
}
