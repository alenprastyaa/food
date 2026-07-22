import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Hanya owner.", 403);
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const data = {
    qrisImage: b.qrisImage ?? undefined,
    ownerName: b.ownerName ?? undefined,
    notes: b.notes ?? undefined,
  };

  const payment = await prisma.outletPayment.upsert({
    where: { outletId: id },
    update: data,
    create: { outletId: id, qrisImage: b.qrisImage ?? null, ownerName: b.ownerName ?? "NASHI KATSU FOOD", notes: b.notes ?? null },
  });
  return ok({ payment });
}
