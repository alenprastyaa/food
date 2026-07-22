export function PageHeader({
  title,
  jp,
  subtitle,
  children,
}: {
  title: string;
  jp?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 lg:top-0 z-20 bg-washi/85 backdrop-blur border-b border-sumi/10 px-5 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-extrabold text-sumi truncate">{title}</h1>
            {jp && <span className="font-round text-shu/60 text-sm shrink-0">{jp}</span>}
          </div>
          {subtitle && <p className="text-sm text-sumi/50 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </header>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="grid place-items-center py-20 text-center">
      <div className="hanko h-16 w-16 text-3xl mb-4 opacity-80">{icon}</div>
      <p className="font-display text-lg font-bold text-sumi/70">{title}</p>
      {subtitle && <p className="text-sm text-sumi/40 mt-1 max-w-xs">{subtitle}</p>}
    </div>
  );
}
