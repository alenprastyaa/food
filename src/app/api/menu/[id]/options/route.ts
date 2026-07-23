import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";
import { canAccessOutlet } from "@/lib/scope";

type GroupInput = { name: string; required?: boolean; multiple?: boolean; options: { name: string; priceDelta?: number }[] };

// Replace all option groups for a menu (owner-only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Hanya owner.", 403);
  const { id } = await params;
  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) return bad("Menu tidak ditemukan.", 404);
  if (!canAccessOutlet(user, menu.outletId)) return bad("Bukan outletmu.", 403);

  const body = await req.json().catch(() => ({}));
  const groups = (body.groups ?? []) as GroupInput[];

  await prisma.menuOptionGroup.deleteMany({ where: { menuId: id } });
  for (const g of groups) {
    if (!g.name?.trim() || !Array.isArray(g.options) || g.options.length === 0) continue;
    await prisma.menuOptionGroup.create({
      data: {
        menuId: id,
        name: g.name.trim(),
        required: !!g.required,
        multiple: !!g.multiple,
        options: {
          create: g.options
            .filter((o) => o.name?.trim())
            .map((o) => ({ name: o.name.trim(), priceDelta: Math.round(Number(o.priceDelta || 0)) })),
        },
      },
    });
  }

  const updated = await prisma.menu.findUnique({ where: { id }, include: { optionGroups: { include: { options: true } } } });
  return ok({ menu: updated });
}
