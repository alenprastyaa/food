import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";

/**
 * Wipes operational data. Staff accounts (User) and SiteSetting survive so the
 * owner can still log in and keep their branding.
 *
 * Deletion is explicit and ordered child-first rather than leaning on cascades,
 * so the intent is readable and a schema change can't silently widen the blast
 * radius. Runs in one transaction: a failure halfway leaves nothing deleted.
 */
export async function POST(req: Request) {
  const session = await authed();
  if (!session || session.role !== "OWNER") return bad("Tidak diizinkan.", 403);

  const { password } = await req.json().catch(() => ({}));
  if (!password || typeof password !== "string") return bad("Password wajib diisi.");

  // Re-verify against the live record — the session cookie alone is not enough
  // authorisation for a destructive, irreversible action.
  const owner = await prisma.user.findUnique({ where: { id: session.id } });
  if (!owner || owner.role !== "OWNER") return bad("Tidak diizinkan.", 403);
  if (!bcrypt.compareSync(password, owner.password)) return bad("Password salah.", 401);

  const deleted = await prisma.$transaction(async (tx) => {
    const counts: Record<string, number> = {};
    const run = async (name: string, fn: () => Promise<{ count: number }>) => {
      counts[name] = (await fn()).count;
    };

    await run("orderItemOptions", () => tx.orderItemOption.deleteMany());
    await run("orderItems", () => tx.orderItem.deleteMany());
    await run("payments", () => tx.payment.deleteMany());
    await run("orders", () => tx.order.deleteMany());

    await run("messages", () => tx.message.deleteMany());
    await run("conversations", () => tx.conversation.deleteMany());

    await run("reservations", () => tx.reservation.deleteMany());
    await run("ratings", () => tx.outletRating.deleteMany());

    await run("pointTransactions", () => tx.pointTransaction.deleteMany());
    await run("buyers", () => tx.buyer.deleteMany());

    await run("menuOptions", () => tx.menuOption.deleteMany());
    await run("menuOptionGroups", () => tx.menuOptionGroup.deleteMany());
    await run("menus", () => tx.menu.deleteMany());

    await run("outletPayments", () => tx.outletPayment.deleteMany());

    // Detach staff before removing outlets. User.outlet is optional with no
    // cascade, so this keeps the accounts intact instead of relying on the
    // database's default referential action.
    await tx.user.updateMany({ where: { outletId: { not: null } }, data: { outletId: null } });
    await run("outlets", () => tx.outlet.deleteMany());

    return counts;
  });

  return ok({ deleted, keptUsers: await prisma.user.count() });
}
