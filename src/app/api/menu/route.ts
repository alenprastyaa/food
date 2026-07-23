import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";
import { canAccessOutlet } from "@/lib/scope";

export async function GET(req: Request) {
  const user = await authed();
  if (!user) return bad("Tidak diizinkan.", 401);
  const { searchParams } = new URL(req.url);
  const outletId = searchParams.get("outletId") ?? user.outletId ?? undefined;

  const where = user.role === "OWNER" ? (outletId ? { outletId } : {}) : { outletId: user.outletId ?? "__none__" };
  const menus = await prisma.menu.findMany({
    where,
    orderBy: [{ category: "asc" }, { price: "asc" }],
    include: { optionGroups: { include: { options: true } } },
  });
  return ok({ menus });
}

export async function POST(req: Request) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Hanya owner.", 403);
  const b = await req.json().catch(() => ({}));
  const { outletId, name, category, description, price, image, isAvailable, isPromo, promoPrice } = b;
  if (!outletId || !name || !category || price == null) return bad("Nama, kategori, harga, outlet wajib.");
  if (!canAccessOutlet(user, outletId)) return bad("Bukan outletmu.", 403);

  const menu = await prisma.menu.create({
    data: {
      outletId,
      name: String(name).trim(),
      category: String(category).trim(),
      description: description || null,
      price: Math.round(Number(price)),
      image: image || "🍱",
      isAvailable: isAvailable ?? true,
      isPromo: Boolean(isPromo),
      promoPrice: promoPrice ? Math.round(Number(promoPrice)) : null,
    },
  });
  return ok({ menu });
}
