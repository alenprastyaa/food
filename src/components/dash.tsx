import clsx from "clsx";

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-4 px-5 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-semibold text-dark-1 tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-gray-5 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </header>
  );
}

/** Standard page body padding, so every CMS screen lines up. */
export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("p-5 lg:p-8", className)}>{children}</div>;
}

/** Neutral surface used for every panel in the CMS. */
export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={clsx("rounded-xl border border-gray-6 bg-white", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-4">
          {title && <h3 className="text-base font-semibold text-dark-1">{title}</h3>}
          {action}
        </div>
      )}
      <div className={clsx("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="grid place-items-center py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-gray-3 text-gray-2 mb-4">{icon}</div>
      <p className="text-base font-semibold text-dark-2">{title}</p>
      {subtitle && <p className="text-sm text-gray-5 mt-1 max-w-xs">{subtitle}</p>}
    </div>
  );
}
