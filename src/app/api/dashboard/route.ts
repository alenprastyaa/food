import { ok, bad, authed } from "@/lib/api";
import { cashierStats, ownerStats } from "@/lib/stats";

export async function GET() {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);
  if (user.role === "OWNER") {
    const [owner, cashier] = await Promise.all([ownerStats(), cashierStats(user)]);
    return ok({ role: "OWNER", owner, cashier });
  }
  const cashier = await cashierStats(user);
  return ok({ role: "CASHIER", cashier });
}
