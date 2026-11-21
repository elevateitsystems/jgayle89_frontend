"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, ExternalLink, MapPin } from "lucide-react";
import { AssistanceButton } from "@/components/membership/assistance-button";
import { stateName } from "@/data/us-states";
import { CategoryBadge, DataStatusBadge, ScopeBadge } from "./benefit-badges";
import { Skeleton } from "@/components/ui/skeleton";
import type { Benefit } from "@/types";

export function BenefitCard({ benefit: b }: { benefit: Benefit }) {
  return (
    <article className="flex h-full flex-col rounded-lg border bg-card p-5 shadow-card transition-all duration-200 hover:border-olive-300 hover:shadow-lift">
      {b.image && <div className="relative -mx-5 -mt-5 mb-4 aspect-[16/8] overflow-hidden bg-sand-200"><Image src={b.image} alt="" fill sizes="(min-width: 1024px) 360px, 100vw" className="object-cover" unoptimized={b.image.startsWith("data:")} /></div>}
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
      {b.eligibility[0] && (
        <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-foreground/75">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-olive-600" aria-hidden />
          <span><span className="font-semibold text-olive-900">Basic eligibility:</span> {b.eligibility[0]}</span>
        </p>
      )}
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5 shrink-0 text-olive-600" aria-hidden />
        {b.state ? `Available in ${stateName(b.state)}` : "Available nationwide (federal)"}
      </p>
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
          {b.applyUrl ? "Official site" : "Official source"} <ExternalLink className="size-3" aria-hidden />
          <span className="sr-only">for {b.title} (opens in a new tab)</span>
        </a>
      </div>
      {b.applyUrl && (
        <a href={b.applyUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-olive-700 hover:underline">
          Official application <ExternalLink className="size-3" aria-hidden /><span className="sr-only">for {b.title} (opens in a new tab)</span>
        </a>
      )}
      <AssistanceButton context={{ kind: "benefit", id: b.id, title: b.title }} className="mt-3" compact />
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
