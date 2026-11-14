"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Lock, Search } from "lucide-react";
import { SponsorStrip } from "@/components/sponsorship/placements";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cheapestPlanWith, hasFeature } from "@/features/membership/access";
import { useAllPlans, useResolvedPlan } from "@/features/membership/hooks";
import { resourceService } from "@/services/resource-service";
import { cn } from "@/lib/utils";
import type { CommunityResource, PlanAudience, ResourceKind } from "@/types";

interface Props {
  kinds: ResourceKind[];
  /** "public" = the signed-out /resources page: nothing is plan-gated and plan-only resources are left out. */
  audience: Exclude<PlanAudience, "business"> | "public";
  userId?: string;
  searchLabel: string;
  /** Show live "Sponsored" strips for resource sponsorships. */
  showSponsors?: boolean;
}

/** Searchable resource cards. Resources that need a plan feature show a lock and an upgrade link — everything else is free. */
export function ResourceCatalog({ kinds, audience, userId, searchLabel, showSponsors }: Props) {
  const isPublic = audience === "public";
  const memberAudience = isPublic ? "civilian" : audience;
  const plan = useResolvedPlan(memberAudience, userId);
  const plans = useAllPlans();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const all = useMemo(
    () => resourceService.byKinds(kinds, isPublic ? undefined : audience as "veteran" | "civilian").filter((r) => !isPublic || !r.requiresFeature),
    [kinds, audience, isPublic],
  );
  const tags = useMemo(() => [...new Set(all.flatMap((r) => r.tags))].sort(), [all]);
  const results = useMemo(() => {
    const s = q.toLowerCase().trim();
    return all.filter((r) => (!tag || r.tags.includes(tag)) && (!s || `${r.title} ${r.summary} ${r.provider} ${r.tags.join(" ")}`.toLowerCase().includes(s)));
  }, [all, q, tag]);

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-lg border bg-card p-4 shadow-card">
        <label className="relative flex items-center">
          <span className="sr-only">{searchLabel}</span>
          <Search className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchLabel} className="h-10 w-full rounded-md border border-input bg-white pl-10 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm" />
        </label>
        {tags.length > 0 && (
          <div role="group" aria-label="Filter by topic" className="flex flex-wrap gap-2">
            {["", ...tags].map((t) => (
              <button
                key={t || "all"}
                type="button"
                aria-pressed={tag === t}
                onClick={() => setTag(t)}
                className={cn("rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors", tag === t ? "bg-olive-700 text-white" : "bg-sand-100 text-olive-900 hover:bg-sand-200")}
              >
                {t || "All topics"}
              </button>
            ))}
          </div>
        )}
      </div>

      {showSponsors && <SponsorStrip kind="resource_sponsorship" resourceIds={results.map((r) => r.id)} />}

      {results.length === 0 ? (
        <EmptyState title="No resources match" description="Try a different keyword or topic." actionLabel="Clear filters" onAction={() => { setQ(""); setTag(""); }} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((r) => {
            const locked = !!r.requiresFeature && !hasFeature(plan, r.requiresFeature);
            const need = r.requiresFeature ? cheapestPlanWith(plans, memberAudience, r.requiresFeature) : undefined;
            return (
              <li key={r.id}>
                <ResourceCard resource={r} locked={locked} neededPlan={need?.name} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ResourceCard({ resource: r, locked, neededPlan }: { resource: CommunityResource; locked?: boolean; neededPlan?: string }) {
  const external = /^https?:\/\//.test(r.url);
  return (
    <article className="flex h-full flex-col rounded-lg border bg-card p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wider text-olive-700">{r.provider}</p>
      <h3 className="mt-1.5 text-lg font-semibold leading-snug text-olive-950">{r.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/80">{r.summary}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Topics">
        {r.tags.map((t) => <li key={t} className="rounded-full bg-sand-100 px-2.5 py-0.5 text-xs capitalize text-olive-900">{t}</li>)}
      </ul>
      <div className="mt-4">
        {locked ? (
          <Link href="/dashboard/membership" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            <Lock /> Included with {neededPlan ?? "a paid plan"}
          </Link>
        ) : external ? (
          <a href={r.url} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Visit site <ExternalLink className="size-3.5" aria-hidden /><span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <Link href={r.url} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>Open</Link>
        )}
      </div>
    </article>
  );
}

