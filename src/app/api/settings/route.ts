import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  return ok({ setting: setting ?? { announcement: null, isActive: false, themeName: "default", pointsEarnPercent: 1 } });
}

const THEMES = ["default", "sakura", "matcha", "malam"];

export async function PATCH(req: Request) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Tidak diizinkan.", 403);

  const { announcement, isActive, themeName, pointsEarnPercent } = await req.json().catch(() => ({}));
  const theme = THEMES.includes(themeName) ? themeName : "default";
  const earnPercent = Math.max(0, Math.min(100, Number(pointsEarnPercent)));
  const data = {
    announcement: announcement ?? null,
    isActive: !!isActive,
    themeName: theme,
    pointsEarnPercent: Number.isFinite(earnPercent) ? earnPercent : 1,
  };
  const setting = await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
  return ok({ setting });
}
