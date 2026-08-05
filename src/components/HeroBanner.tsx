import Link from "next/link";

export type Banner = {
  bannerActive: boolean;
  bannerImage: string | null;
  bannerTag: string | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  bannerCtaText: string | null;
  bannerCtaHref: string | null;
};

/**
 * Landing-page hero banner. Content is owner-managed from the CMS
 * (Dashboard → Pengaturan), typically to announce a new menu item.
 *
 * `preview` renders the same markup at panel scale for the CMS editor,
 * so what the owner sees while editing is what ships.
 */
export function HeroBanner({ setting, preview }: { setting: Banner; preview?: boolean }) {
  const { bannerImage, bannerTag, bannerTitle, bannerSubtitle, bannerCtaText, bannerCtaHref } = setting;
  const hasImage = !!bannerImage;
  const cta = bannerCtaText && bannerCtaHref ? { text: bannerCtaText, href: bannerCtaHref } : null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-6 bg-white shadow-sm ${
        preview ? "" : "w-full"
      }`}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bannerImage!}
          alt={bannerTitle ?? "Banner"}
          className={`w-full object-cover ${preview ? "h-40" : "h-56 sm:h-72 lg:h-80"}`}
        />
      ) : (
        <div
          className={`grid w-full place-items-center bg-gray-3 text-gray-2 ${
            preview ? "h-40" : "h-56 sm:h-72 lg:h-80"
          }`}
        >
          <span className={preview ? "text-3xl" : "text-6xl"}>🍱</span>
        </div>
      )}

      <div className={preview ? "p-4" : "p-5 sm:p-6"}>
        {bannerTag && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {bannerTag}
          </span>
        )}

        {bannerTitle && (
          <h3
            className={`mt-2 font-semibold tracking-tight text-dark-1 ${
              preview ? "text-base" : "text-xl sm:text-2xl"
            }`}
          >
            {bannerTitle}
          </h3>
        )}

        {bannerSubtitle && (
          <p className={`mt-1 text-gray-5 ${preview ? "text-xs" : "text-sm"}`}>{bannerSubtitle}</p>
        )}

        {cta && (
          <Link
            href={cta.href}
            className={`btn-press mt-4 inline-flex items-center justify-center rounded-lg bg-primary font-semibold text-white shadow-sm transition hover:bg-primary-hover ${
              preview ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm"
            }`}
          >
            {cta.text}
          </Link>
        )}
      </div>
    </div>
  );
}
