import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center">
      <Icon className="mb-4 size-8 text-muted-foreground" aria-hidden strokeWidth={1.5} />
      <h2 className="text-base font-medium">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
