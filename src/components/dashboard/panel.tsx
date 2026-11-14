import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Panel({
  title, subtitle, action, children, className, id,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={id ? `${id}-h` : undefined} className={cn("min-w-0 rounded-lg border bg-card p-5 shadow-card", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id={id ? `${id}-h` : undefined} className="font-sans text-base font-semibold text-olive-950">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="text-sm font-semibold text-olive-700 hover:underline">{children}</Link>;
}

export function StatCard({
  label, value, hint, icon: Icon, delta, loading, href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  /** Percent change vs the previous period. */
  delta?: number;
  loading?: boolean;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-olive-600" aria-hidden />}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        {loading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <p className="font-heading text-3xl font-semibold tabular-nums text-olive-950 sm:text-4xl">{value}</p>
        )}
        {delta !== undefined && !loading && (
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
              delta >= 0 ? "bg-olive-100 text-olive-800" : "bg-destructive/10 text-destructive",
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  const cls = "min-w-0 rounded-lg border bg-card p-5 shadow-card";
  return href ? (
    <Link href={href} className={cn(cls, "block transition-colors hover:border-olive-300")}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
