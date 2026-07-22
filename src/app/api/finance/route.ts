import { ok, bad, authed } from "@/lib/api";
import { financeReport } from "@/lib/stats";

export async function GET(req: Request) {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);
  const { searchParams } = new URL(req.url);
  const range = (searchParams.get("range") as "day" | "week" | "month") || "week";
  const outletId = searchParams.get("outletId") || undefined;
  const report = await financeReport(user, range, outletId);
  return ok(report);
}
