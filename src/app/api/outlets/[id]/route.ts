import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Hanya owner.", 403);
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["name", "phone", "address"]) if (b[k] !== undefined) data[k] = b[k];
  if (b.latitude !== undefined) data.latitude = b.latitude === null || b.latitude === "" ? null : Number(b.latitude);
  if (b.longitude !== undefined) data.longitude = b.longitude === null || b.longitude === "" ? null : Number(b.longitude);
  if (b.isActive !== undefined) data.isActive = Boolean(b.isActive);
  const outlet = await prisma.outlet.update({ where: { id }, data });
  return ok({ outlet });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Hanya owner.", 403);
  const { id } = await params;
  const orders = await prisma.order.count({ where: { outletId: id } });
  if (orders > 0) return bad("Outlet punya riwayat order — nonaktifkan saja.", 409);
  await prisma.outlet.delete({ where: { id } });
  return ok({ done: true });
}
