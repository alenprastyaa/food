import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";

export async function GET() {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);
  const outlets = await prisma.outlet.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { menus: true, users: true, orders: true } }, payment: true },
  });
  return ok({ outlets });
}

export async function POST(req: Request) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Hanya owner.", 403);
  const b = await req.json().catch(() => ({}));
  if (!b.name || !b.phone || !b.address) return bad("Nama, telepon, alamat wajib.");
  const outlet = await prisma.outlet.create({
    data: {
      name: String(b.name).trim(),
      phone: String(b.phone).trim(),
      address: String(b.address).trim(),
      latitude: b.latitude ? Number(b.latitude) : null,
      longitude: b.longitude ? Number(b.longitude) : null,
      isActive: b.isActive ?? true,
      payment: { create: { ownerName: b.ownerName || "NASHI KATSU FOOD", qrisImage: null } },
    },
  });
  return ok({ outlet });
}
