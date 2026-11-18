"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Gift, Info, Search } from "lucide-react";
import { FreebieCard } from "./freebie-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FREEBIE_CATEGORIES, FREEBIE_CATEGORY_LABEL, filterFreebies } from "@/features/offers/rules";
import { useFreebies } from "@/features/offers/hooks";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSimulatedLoading } from "@/hooks/use-store";
import { todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";

/** Public Freebies & Discounts directory (client update §2B) — no account needed. */
export function FreebiesClient() {
  const params = useSearchParams();
  const loading = useSimulatedLoading();
  const all = useFreebies();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(() => {
    const c = params.get("category") ?? "";
    return (FREEBIE_CATEGORIES as string[]).includes(c) ? c : "";
  });
  const debouncedQ = useDebouncedValue(q, 150);
  const today = todayISO();
  const live = useMemo(() => filterFreebies(all, { q: "", category: "" }, today), [all, today]);
  const results = useMemo(() => filterFreebies(all, { q: debouncedQ, category }, today), [all, debouncedQ, category, today]);
  const counts = useMemo(() => live.reduce<Record<string, number>>((acc, f) => ({ ...acc, [f.category]: (acc[f.category] ?? 0) + 1 }), {}), [live]);

  return (
    <>
      <section className="border-b border-sand-200 bg-sand-100">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow">Freebies &amp; Discounts</p>
          <h1 className="mt-2 text-4xl font-semibold text-olive-950 sm:text-5xl">Freebies &amp; Discounts</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Veteran freebies, military and first responder discounts, corporate offers and more — browse freely, no registration needed. Always confirm the details with the company before you go.
          </p>
          <label role="search" className="relative mt-7 flex max-w-xl items-center">
            <span className="sr-only">Search freebies and discounts</span>
            <Search className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search offers, companies or eligibility"
              className="h-12 w-full rounded-md border border-input bg-white pl-10 pr-3 text-base shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
          </label>
        </div>
      </section>

      <div className="container-page py-8 sm:py-12">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
          {["", ...FREEBIE_CATEGORIES].map((c) => (
            <button
              key={c || "all"}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
                category === c ? "border-olive-700 bg-olive-700 text-white" : "border-input bg-white hover:bg-sand-100",
              )}
            >
              {c ? FREEBIE_CATEGORY_LABEL[c as keyof typeof FREEBIE_CATEGORY_LABEL] : "All offers"}
              <span className={cn("text-xs tabular-nums", category === c ? "text-olive-100" : "text-muted-foreground")}>{c ? counts[c] ?? 0 : live.length}</span>
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">
          {loading ? "Loading offers…" : <><span className="font-semibold text-foreground">{results.length}</span> {results.length === 1 ? "offer" : "offers"}</>}
        </p>
        <p className="mt-3 flex items-start gap-2 rounded-md border border-sand-300 bg-sand-100 px-3 py-2 text-xs leading-relaxed text-sand-700">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>Sample offers from fictional companies for the preview. Offers are set by each company and can change — check eligibility and terms on the company&apos;s site.</span>
        </p>

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
          ) : results.length === 0 ? (
            <EmptyState icon={Gift} title="No offers match" description="Try another category or clear your search." actionLabel="Clear filters" onAction={() => { setQ(""); setCategory(""); }} />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((f) => <li key={f.id}><FreebieCard freebie={f} /></li>)}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
