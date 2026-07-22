import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";
import { canAccessOutlet } from "@/lib/scope";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Hanya owner.", 403);
  const { id } = await params;
  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) return bad("Menu tidak ditemukan.", 404);
  if (!canAccessOutlet(user, menu.outletId)) return bad("Bukan outletmu.", 403);

  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["name", "category", "description", "image"]) if (b[k] !== undefined) data[k] = b[k];
  if (b.price !== undefined) data.price = Math.round(Number(b.price));
  if (b.isAvailable !== undefined) data.isAvailable = Boolean(b.isAvailable);

  const updated = await prisma.menu.update({ where: { id }, data });
  return ok({ menu: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Hanya owner.", 403);
  const { id } = await params;
  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) return bad("Menu tidak ditemukan.", 404);
  if (!canAccessOutlet(user, menu.outletId)) return bad("Bukan outletmu.", 403);
  await prisma.menu.delete({ where: { id } });
  return ok({ done: true });
}
