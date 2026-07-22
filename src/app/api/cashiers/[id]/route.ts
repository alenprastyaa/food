import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Hanya owner.", 403);
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (b.name !== undefined) data.name = b.name;
  if (b.outletId !== undefined) data.outletId = b.outletId;
  if (b.password) data.password = bcrypt.hashSync(String(b.password), 10);
  const cashier = await prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, outletId: true } });
  return ok({ cashier });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Hanya owner.", 403);
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return ok({ done: true });
}
