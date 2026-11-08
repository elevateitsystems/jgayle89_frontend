"use client";

import { useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Info, Search, X } from "lucide-react";
import { BenefitCard, BenefitCardSkeleton } from "./benefit-card";
import { benefitCategoryIcon } from "./benefit-badges";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { benefitCategories } from "@/data/benefit-categories";
import { US_STATES, stateName } from "@/data/us-states";
import { useBenefitFilters } from "@/hooks/use-benefit-filters";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSimulatedLoading } from "@/hooks/use-store";
import { searchBenefits, statesWithPrograms } from "@/services/benefit-service";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

export function BenefitsClient() {
  const loading = useSimulatedLoading();
  const { filters, update, clear, page, setPage } = useBenefitFilters();
  const topRef = useRef<HTMLDivElement>(null);

  // Typing is debounced for the search pass; selects/pills apply immediately.
  const debouncedQ = useDebouncedValue(filters.q, 150);
  const result = useMemo(
    () => searchBenefits({ ...filters, q: debouncedQ }, page, PAGE_SIZE),
    [filters, debouncedQ, page],
  );

  // Keep the URL/page state valid if filters shrink the result set.
  useEffect(() => {
    if (page !== result.page) setPage(result.page);
  }, [page, result.page, setPage]);

  const hasFilters = !!(filters.q || filters.state || filters.category);
  const totalForCounts = Object.values(result.categoryCounts).reduce((a, b) => a + b, 0);
  const stateWithoutOwnPrograms = !!filters.state && !statesWithPrograms.has(filters.state);

  function goToPage(n: number) {
    setPage(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section className="border-b border-sand-200 bg-sand-100">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow">Veteran benefits</p>
          <h1 className="mt-2 text-4xl font-semibold text-olive-950 sm:text-5xl">Find veteran benefits</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Search federal programs available nationwide and state programs by state, then follow the official link to confirm eligibility and apply.
          </p>

          <div role="search" className="mt-7 grid gap-3 rounded-lg bg-white p-3 shadow-card ring-1 ring-black/5 sm:p-4 md:grid-cols-[1fr_260px]">
            <label className="relative flex items-center">
              <span className="sr-only">Search benefits by keyword</span>
              <Search className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
              <input
                type="search"
                value={filters.q}
                onChange={(e) => update({ q: e.target.value })}
                placeholder="Search (e.g. GI Bill, home loan)"
                className="h-11 w-full rounded-md border border-input bg-white pl-10 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              />
            </label>
            <label className="block">
              <span className="sr-only">State</span>
              <NativeSelect value={filters.state} onChange={(e) => update({ state: e.target.value })} className="h-11">
                <option value="">All states</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
          </div>
        </div>
      </section>

      <div ref={topRef} className="container-page scroll-mt-24 py-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
          <CategoryPill label="All categories" count={totalForCounts} active={!filters.category} onClick={() => update({ category: "" })} />
          {benefitCategories.map((c) => {
            const Icon = benefitCategoryIcon[c.id];
            return (
              <CategoryPill
                key={c.id}
                label={c.name}
                icon={<Icon className="size-4" aria-hidden />}
                count={result.categoryCounts[c.id] ?? 0}
                active={filters.category === c.id}
                onClick={() => update({ category: filters.category === c.id ? "" : c.id })}
              />
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {loading ? (
              "Loading benefits…"
            ) : (
              <>
                <span className="font-semibold text-foreground">{result.total}</span>{" "}
                {result.total === 1 ? "program" : "programs"} found
                {filters.state && <> for {stateName(filters.state)} (including federal)</>}
              </>
            )}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1 text-sm font-semibold text-olive-700 underline underline-offset-2 hover:text-olive-900"
            >
              <X className="size-3.5" aria-hidden /> Clear all filters
            </button>
          )}
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-md border border-sand-300 bg-sand-100 px-3 py-2 text-xs leading-relaxed text-sand-700">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            Program summaries are prototype content and may be incomplete or out of date. Always confirm eligibility, amounts and deadlines on the linked official source before applying.
          </span>
        </p>

        {!loading && stateWithoutOwnPrograms && (
          <p role="status" className="mt-3 flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              We haven&apos;t added {stateName(filters.state)}-specific programs yet. Showing federal programs, which are available in every state.
            </span>
          </p>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <BenefitCardSkeleton key={i} />
              ))}
            </div>
          ) : result.total === 0 ? (
            <EmptyState
              title="No benefits match your search"
              description="Try a different keyword, choose another category, or clear your filters."
              actionLabel="Clear all filters"
              onAction={clear}
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((b) => (
                <li key={b.id}>
                  <BenefitCard benefit={b} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {!loading && result.pageCount > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
            <Button variant="outline" size="icon" disabled={result.page === 1} onClick={() => goToPage(result.page - 1)} aria-label="Previous page">
              <ChevronLeft />
            </Button>
            {result.pageCount <= 7 ? (
              Array.from({ length: result.pageCount }).map((_, i) => (
                <Button
                  key={i}
                  variant={result.page === i + 1 ? "default" : "outline"}
                  size="icon"
                  aria-label={`Page ${i + 1}`}
                  aria-current={result.page === i + 1 ? "page" : undefined}
                  onClick={() => goToPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))
            ) : (
              <span className="px-3 text-sm text-muted-foreground" aria-current="page">
                Page {result.page} of {result.pageCount}
              </span>
            )}
            <Button
              variant="outline"
              size="icon"
              disabled={result.page === result.pageCount}
              onClick={() => goToPage(result.page + 1)}
              aria-label="Next page"
            >
              <ChevronRight />
            </Button>
          </nav>
        )}
      </div>
    </>
  );
}

function CategoryPill({
  label,
  count,
  active,
  icon,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
        active ? "border-olive-700 bg-olive-700 text-white" : "border-input bg-white hover:bg-sand-100",
      )}
    >
      {icon}
      {label}
      <span className={cn("text-xs tabular-nums", active ? "text-olive-100" : "text-muted-foreground")}>{count}</span>
    </button>
  );
}
