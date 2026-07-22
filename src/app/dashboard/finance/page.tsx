import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FinanceView from "./FinanceView";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = (await getSession())!;
  const outlets = user.role === "OWNER" ? await prisma.outlet.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : [];
  return <FinanceView role={user.role} outlets={outlets} />;
}
