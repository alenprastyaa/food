import { prisma } from "@/lib/prisma";
import { ok, bad, authed } from "@/lib/api";

const DEFAULTS = {
  announcement: null,
  isActive: false,
  themeName: "default",
  pointsEarnPercent: 1,
  bannerActive: false,
  bannerImage: null,
  bannerTag: null,
  bannerTitle: null,
  bannerSubtitle: null,
  bannerCtaText: null,
  bannerCtaHref: null,
};

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { id: "singleton" } });
  return ok({ setting: setting ?? DEFAULTS });
}

const THEMES = ["default", "sakura", "matcha", "malam"];

/** Trim to null so empty inputs don't persist as "". */
const str = (v: unknown, max: number) => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

/**
 * Images are hosted URLs now. Legacy rows may still hold a data: URL, so those
 * stay accepted — but only for real raster image types.
 *
 * svg+xml is deliberately excluded: an SVG can carry <script>, and this value
 * is owner-editable and rendered on a public page.
 */
const DATA_IMAGE = /^data:image\/(png|jpeg|jpg|gif|webp|avif);base64,[A-Za-z0-9+/=]+$/i;

function sanitiseImage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;

  if (v.startsWith("data:")) {
    return v.length <= 1_500_000 && DATA_IMAGE.test(v) ? v : null;
  }
  if (v.length > 2000) return null;
  // Same-origin path, or an https URL. Never http:, javascript:, or anything else.
  if (v.startsWith("/")) return v;
  if (v.startsWith("https://")) return v;
  return null;
}

export async function PATCH(req: Request) {
  const user = await authed();
  if (!user || user.role !== "OWNER") return bad("Tidak diizinkan.", 403);

  const body = await req.json().catch(() => ({}));
  const {
    announcement, isActive, themeName, pointsEarnPercent,
    bannerActive, bannerImage, bannerTag, bannerTitle, bannerSubtitle, bannerCtaText, bannerCtaHref,
  } = body;

  const theme = THEMES.includes(themeName) ? themeName : "default";
  const earnPercent = Math.max(0, Math.min(100, Number(pointsEarnPercent)));

  const image = sanitiseImage(bannerImage);

  const href = str(bannerCtaHref, 500);

  const data = {
    announcement: str(announcement, 500),
    isActive: !!isActive,
    themeName: theme,
    pointsEarnPercent: Number.isFinite(earnPercent) ? earnPercent : 1,
    bannerActive: !!bannerActive,
    bannerImage: image,
    bannerTag: str(bannerTag, 40),
    bannerTitle: str(bannerTitle, 90),
    bannerSubtitle: str(bannerSubtitle, 160),
    bannerCtaText: str(bannerCtaText, 40),
    // Only allow in-app paths — an external URL here would be an open redirect
    // surface on a field any owner can edit.
    bannerCtaHref: href && href.startsWith("/") ? href : null,
  };

  const setting = await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
  return ok({ setting });
}
