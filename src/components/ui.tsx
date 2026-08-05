import Link from "next/link";
import clsx from "clsx";
import { toneClass } from "@/lib/format";

export function StatusBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1", toneClass[tone] ?? toneClass.slate)}>
      {label}
    </span>
  );
}

/**
 * Company logo. The artwork already contains the "NASHI KATSU" wordmark, so no
 * text is rendered beside it — that would duplicate the brand name.
 *
 * It sits on a white tile: the source art has a white background, so this makes
 * it read as a deliberate chip on the dark login panel instead of a stray square.
 */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Link href="/" aria-label="Nashi Katsu — Beranda" className="group inline-flex shrink-0">
      <span
        className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-gray-4 transition group-hover:ring-primary"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="Nashi Katsu" className="h-full w-full object-contain" />
      </span>
    </Link>
  );
}

export function MenuImage({ image, category, className, big }: { image?: string | null; category?: string; className?: string; big?: boolean }) {
  const isReal = image && (image.startsWith("http") || image.startsWith("/") || image.startsWith("data:"));
  if (isReal) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image!} alt="" className={clsx("object-cover", className)} />;
  }
  return (
    <div className={clsx("grid place-items-center bg-gray-3", className)} aria-label={category}>
      <span style={{ fontSize: big ? 52 : 30 }} className="select-none opacity-80">
        {image || "🍱"}
      </span>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "outlinePrimary" | "dark" | "matcha";
}) {
  const variants = {
    primary: "bg-primary text-white shadow-sm hover:bg-primary-hover",
    dark: "bg-dark-1 text-white shadow-sm hover:bg-dark-2",
    matcha: "bg-success text-white shadow-sm hover:brightness-110",
    outline: "bg-white text-dark-2 border border-gray-4 hover:bg-gray-3",
    outlinePrimary: "bg-white text-primary border border-primary shadow-sm hover:bg-primary hover:text-white",
    ghost: "bg-transparent text-dark-2 hover:bg-gray-3",
  };
  return (
    <button
      className={clsx(
        "btn-press inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold",
        "disabled:pointer-events-none disabled:bg-gray-4 disabled:text-gray-2 disabled:border-gray-4 disabled:shadow-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("flex items-baseline gap-3", className)}>
      <h2 className="text-2xl font-semibold text-dark-1 tracking-tight">{children}</h2>
    </div>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="paper-card rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-5">{label}</p>
      <p className={clsx("mt-1 text-2xl font-semibold tracking-tight", accent ?? "text-dark-1")}>{value}</p>
      {sub && <p className="text-xs text-gray-5 mt-0.5">{sub}</p>}
    </div>
  );
}
