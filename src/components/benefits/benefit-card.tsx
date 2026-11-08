import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { CategoryBadge, DataStatusBadge, ScopeBadge } from "./benefit-badges";
import { Skeleton } from "@/components/ui/skeleton";
import type { Benefit } from "@/types";

export function BenefitCard({ benefit: b }: { benefit: Benefit }) {
  return (
    <article className="flex h-full flex-col rounded-lg border bg-card p-5 shadow-card transition-all duration-200 hover:border-olive-300 hover:shadow-lift">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={b.category} />
        <ScopeBadge benefit={b} />
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-olive-950 sm:text-xl">
        <Link
          href={`/benefits/${b.slug}`}
          className="hover:text-olive-700 hover:underline focus-visible:underline"
        >
          {b.title}
        </Link>
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{b.agency}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/80">{b.summary}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-4">
        <Link href={`/benefits/${b.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-olive-700 hover:text-olive-900">
          View details <ArrowRight className="size-4" aria-hidden />
        </Link>
        <a
          href={b.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          Official source <ExternalLink className="size-3" aria-hidden />
          <span className="sr-only">for {b.title} (opens in a new tab)</span>
        </a>
      </div>
      {b.dataStatus === "demo" && (
        <div className="mt-3">
          <DataStatusBadge status={b.dataStatus} />
        </div>
      )}
    </article>
  );
}

export function BenefitCardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-5">
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
