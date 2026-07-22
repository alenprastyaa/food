import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  return ok({ setting: setting ?? { announcement: null, isActive: false } });
}

export async function PATCH(req: Request) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Tidak diizinkan.", 403);

  const { announcement, isActive } = await req.json().catch(() => ({}));
  const setting = await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", announcement: announcement ?? null, isActive: !!isActive },
    update: { announcement: announcement ?? null, isActive: !!isActive },
  });
  return ok({ setting });
}
