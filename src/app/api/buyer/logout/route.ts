import { clearBuyerSession } from "@/lib/buyerAuth";
import { ok } from "@/lib/api";

export async function POST() {
  await clearBuyerSession();
  return ok({ done: true });
}
