import Link from "next/link";
import clsx from "clsx";
import { toneClass } from "@/lib/format";

export function StatusBadge({ label, jp, tone }: { label: string; jp?: string; tone: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1", toneClass[tone] ?? toneClass.slate)}>
      {jp && <span className="font-display opacity-60">{jp}</span>}
      {label}
    </span>
  );
}

export function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <span
        className="hanko shrink-0 leading-none group-hover:rotate-6 transition-transform"
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        梨
      </span>
      {withText && (
        <span className="leading-tight">
          <span className="block font-display font-extrabold text-sumi tracking-tight" style={{ fontSize: size * 0.42 }}>
            NASHI KATSU
          </span>
          <span className="block font-round text-shu text-[10px] tracking-[0.25em] -mt-0.5">サクサク・カツ！</span>
        </span>
      )}
    </Link>
  );
}

const menuGradients: Record<string, string> = {
  Katsu: "from-shu/15 to-kin/20",
  Donburi: "from-matcha/15 to-kin/15",
  Snack: "from-sakura/25 to-shu/10",
  Drink: "from-ai/15 to-matcha/15",
  Extra: "from-kin/20 to-sakura/15",
};

export function MenuImage({ image, category, className, big }: { image?: string | null; category?: string; className?: string; big?: boolean }) {
  const isReal = image && (image.startsWith("http") || image.startsWith("/") || image.startsWith("data:"));
  if (isReal) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image!} alt="" className={clsx("object-cover", className)} />;
  }
  return (
    <div
      className={clsx(
        "grid place-items-center bg-gradient-to-br",
        menuGradients[category ?? "Katsu"] ?? menuGradients.Katsu,
        className
      )}
    >
      <span style={{ fontSize: big ? 52 : 30 }} className="drop-shadow-sm select-none">
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
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" | "dark" | "matcha" }) {
  const variants = {
    primary: "bg-shu text-white shadow-[0_4px_0_var(--color-shu-dark)] hover:bg-shu-light",
    dark: "bg-sumi text-washi shadow-[0_4px_0_#0b1518] hover:bg-sumi-soft",
    matcha: "bg-matcha text-white shadow-[0_4px_0_var(--color-matcha-dark)] hover:brightness-110",
    outline: "bg-transparent text-sumi ring-1.5 ring-sumi/20 hover:bg-sumi/5",
    ghost: "bg-transparent text-sumi hover:bg-sumi/5",
  };
  return (
    <button
      className={clsx(
        "btn-press inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-round font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SectionTitle({ jp, children, className }: { jp?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx("flex items-baseline gap-3", className)}>
      <h2 className="font-display text-2xl font-extrabold text-sumi tracking-tight">{children}</h2>
      {jp && <span className="font-round text-shu/70 text-sm">{jp}</span>}
    </div>
  );
}

export function Stat({ label, value, sub, jp, accent }: { label: string; value: string; sub?: string; jp?: string; accent?: string }) {
  return (
    <div className="paper-card rounded-2xl p-4 relative overflow-hidden">
      <div className="absolute -right-3 -top-4 font-display text-6xl opacity-[0.06] select-none">{jp}</div>
      <p className="text-xs font-semibold uppercase tracking-wide text-sumi/50">{label}</p>
      <p className={clsx("mt-1 font-display text-2xl font-extrabold", accent ?? "text-sumi")}>{value}</p>
      {sub && <p className="text-xs text-sumi/50 mt-0.5">{sub}</p>}
    </div>
  );
}
