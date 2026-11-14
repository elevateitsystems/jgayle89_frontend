"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { BadgeRow } from "@/components/badges/business-badge";
import { HiringChip } from "@/components/business/hiring-toggle";
import { SponsoredLabel } from "@/components/sponsorship/placements";
import { RatingStars } from "@/components/shared/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Business } from "@/types";

interface Props {
  business: Business;
  variant?: "grid" | "list";
  active?: boolean;
  priority?: boolean;
  /** Paid placement — must carry the "Sponsored" label. */
  sponsored?: boolean;
  onHover?: (id: string | null) => void;
}

export function BusinessCard({ business: b, variant = "grid", active, priority, sponsored, onHover }: Props) {
  const { categoryById } = useCategories();
  const category = categoryById(b.category);
  const list = variant === "list";

  return (
    <Link
      href={`/directory/${b.slug}`}
      onMouseEnter={() => onHover?.(b.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(b.id)}
      onBlur={() => onHover?.(null)}
      className={cn(
        "group flex h-full overflow-hidden rounded-lg border bg-card shadow-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-olive-300 hover:shadow-lift focus-visible:-translate-y-0.5",
        active && "border-olive-500 shadow-lift ring-1 ring-olive-500",
        list ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-sand-200",
          list ? "aspect-[16/10] sm:aspect-auto sm:w-64 md:w-72" : "aspect-[4/3]",
        )}
      >
        <Image
          src={b.coverImage}
          alt={`${b.name} — ${category?.name ?? "business"}`}
          fill
          priority={priority}
          sizes={list ? "(min-width: 640px) 288px, 100vw" : "(min-width: 1280px) 380px, (min-width: 640px) 45vw, 100vw"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-olive-950/35 via-transparent to-transparent" />
        {category && (
          <span className="absolute left-3 top-3 rounded-sm bg-white/95 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-olive-800 shadow-sm">
            {category.name}
          </span>
        )}
        {sponsored ? (
          <span className="absolute right-3 top-3"><SponsoredLabel className="bg-white/95 shadow-sm" /></span>
        ) : b.featured && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-sm bg-brass px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
            Featured
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold leading-snug text-olive-950 transition-colors group-hover:text-olive-700 sm:text-xl">
            {b.name}
          </h3>
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-olive-600" aria-hidden />
          <span className="truncate">
            {b.city}, {b.state}
          </span>
        </p>
        <BadgeRow businessId={b.id} max={3} className="mt-2.5" leading={b.hiring ? <HiringChip hiring /> : undefined} />
        <p className={cn("mt-3 text-sm leading-relaxed text-foreground/80", list ? "line-clamp-3" : "line-clamp-2")}>
          {b.tagline} {list && b.description.split("\n")[0].slice(0, 140)}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <RatingStars rating={b.rating} reviewCount={b.reviewCount} />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-olive-700">
            <BadgeCheck className="size-3.5" aria-hidden />
            {b.branch}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function BusinessCardSkeleton({ variant = "grid" }: { variant?: "grid" | "list" }) {
  const list = variant === "list";
  return (
    <div className={cn("flex overflow-hidden rounded-lg border bg-card", list ? "flex-col sm:flex-row" : "flex-col")}>
      <Skeleton className={cn("rounded-none", list ? "aspect-[16/10] sm:aspect-auto sm:w-72" : "aspect-[4/3]")} />
      <div className="flex-1 space-y-3 p-5">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}
