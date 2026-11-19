"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Landmark, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryBadge, DataStatusBadge, ScopeBadge } from "@/components/benefits/benefit-badges";
import { EmptyState } from "@/components/shared/empty-state";
import { AssistanceButton } from "@/components/membership/assistance-button";
import { FeatureAccessIndicator } from "@/components/membership/feature-access";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { benefitAudiences, benefitCategories } from "@/data/benefit-categories";
import { usePublicBenefits } from "@/features/benefits/hooks";
import { US_STATES, stateName } from "@/data/us-states";
import { useAllPlans, useResolvedPlan } from "@/features/membership/hooks";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSession } from "@/hooks/use-session";
import { buildBenefitIndex, filterBenefits, paginate } from "@/lib/benefit-filters";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

/**
 * Veteran dashboard → Benefits Directory. Searching benefits is free on every plan. It reads the published,
 * staff-managed catalogue (see Admin → Benefits Management) and links out to the official source for each program.
 */
export function MemberBenefits() {
  const user = useSession();
  const plan = useResolvedPlan("veteran", user?.id);
  const plans = useAllPlans();
  const catalogue = usePublicBenefits();
  const homeState = user?.location?.state ?? "";
  const [q, setQ] = useState("");
  // Defaults to the state saved in the member's profile; federal programs are always included.
  const [state, setState] = useState(homeState);
  const [audience, setAudience] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQ = useDebouncedValue(q, 150);

  const index = useMemo(() => buildBenefitIndex(catalogue, stateName), [catalogue]);
  // filterBenefits ranks the selected state's own programs ahead of federal ones.
  const results = useMemo(() => filterBenefits(index, { q: debouncedQ, state, category, audience }), [index, debouncedQ, state, category, audience]);
  const paged = paginate(results, page, PAGE_SIZE);
  const reset = () => { setQ(""); setState(homeState); setCategory(""); setAudience(""); setPage(1); };
  const viewingHome = !!homeState && state === homeState;

  return (
    <>
      <PageHeader
        title={viewingHome ? `Benefits Available in Your State` : "Benefits directory"}
        description={
          viewingHome
            ? `${stateName(homeState)} programs first, followed by federal programs available nationwide. Choose another state to search elsewhere.`
            : "Federal programs nationwide plus state programs. Always confirm eligibility on the official source before you apply."
        }
      />
      {!homeState && (
        <p className="mb-4 rounded-md border border-sand-300 bg-sand-100 px-3 py-2 text-sm text-sand-700">
          Add your state in <a href="/dashboard/settings" className="font-semibold underline">Account Settings</a> to see benefits available in your state first.
        </p>
      )}

      <div className="mb-6 grid gap-3 rounded-lg border bg-card p-4 shadow-card md:grid-cols-2 xl:grid-cols-[1fr_200px_200px_200px]">
        <label className="relative flex items-center">
          <span className="sr-only">Search benefits</span>
          <Search className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by keyword (e.g. GI Bill, home loan)" className="h-10 w-full rounded-md border border-input bg-white pl-10 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm" />
        </label>
        <NativeSelect aria-label="State" value={state} onChange={(e) => { setState(e.target.value); setPage(1); }}>
          <option value="">All states</option>
          {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}{s.code === homeState ? " (your state)" : ""}</option>)}
        </NativeSelect>
        <NativeSelect aria-label="Military background" value={audience} onChange={(e) => { setAudience(e.target.value); setPage(1); }}>
          <option value="">Any background</option>
          {benefitAudiences.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </NativeSelect>
        <NativeSelect aria-label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {benefitCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </NativeSelect>
      </div>

      <p className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-live="polite">
        <span><strong className="text-foreground">{results.length}</strong> programs</span>
        <FeatureAccessIndicator plan={plan} plans={plans} audience="veteran" featureId="benefits_alerts" label="Change alerts" />
      </p>

      {results.length === 0 ? (
        <EmptyState icon={Landmark} title="No programs match" description="Try a different keyword, or search all states." actionLabel="Clear filters" onAction={reset} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {paged.items.map((b) => (
            <li key={b.id}>
              <article className="flex h-full flex-col rounded-lg border bg-card p-5 shadow-card">
                <div className="flex flex-wrap items-center gap-2"><CategoryBadge category={b.category} /><ScopeBadge benefit={b} /><DataStatusBadge status={b.dataStatus} /></div>
                <h2 className="mt-3 font-sans text-lg font-semibold leading-snug text-olive-950">{b.title}</h2>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{b.agency}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/80">{b.summary}</p>
                {b.eligibility[0] && <p className="mt-2 text-xs text-foreground/75"><span className="font-semibold text-olive-900">Basic eligibility:</span> {b.eligibility[0]}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <a href={b.applyUrl ?? b.sourceUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
                    Official source <ExternalLink className="size-3.5" aria-hidden /><span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  <AssistanceButton context={{ kind: "benefit", id: b.id, title: b.title }} />
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {paged.pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" disabled={paged.page === 1} onClick={() => setPage(paged.page - 1)}>Previous</Button>
          <span className="tabular-nums text-muted-foreground">Page {paged.page} of {paged.pageCount}</span>
          <Button variant="outline" disabled={paged.page === paged.pageCount} onClick={() => setPage(paged.page + 1)}>Next</Button>
        </nav>
      )}
    </>
  );
}
