import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";
import bcrypt from "bcryptjs";

export async function GET() {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Hanya owner.", 403);
  const cashiers = await prisma.user.findMany({
    where: { role: "CASHIER" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, outletId: true, createdAt: true, outlet: { select: { name: true } } },
  });
  return ok({ cashiers });
}

export async function POST(req: Request) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Hanya owner.", 403);
  const b = await req.json().catch(() => ({}));
  if (!b.name || !b.email || !b.password || !b.outletId) return bad("Nama, email, password, outlet wajib.");
  const email = String(b.email).toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return bad("Email sudah dipakai.", 409);

  const cashier = await prisma.user.create({
    data: {
      name: String(b.name).trim(),
      email,
      password: bcrypt.hashSync(String(b.password), 10),
      role: "CASHIER",
      outletId: b.outletId,
    },
    select: { id: true, name: true, email: true, outletId: true },
  });
  return ok({ cashier });
}
