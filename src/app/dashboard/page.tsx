import { getSession } from "@/lib/auth";
import { cashierStats, ownerStats } from "@/lib/stats";
import DashboardHome from "./DashboardHome";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = (await getSession())!;
  const cashier = await cashierStats(user);
  const owner = user.role === "OWNER" ? await ownerStats() : null;
  return <DashboardHome user={{ name: user.name, role: user.role }} initialCashier={cashier} initialOwner={owner} />;
}
