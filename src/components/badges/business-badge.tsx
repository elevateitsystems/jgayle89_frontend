"use client";

import { Award, Flag, Handshake, Medal, Percent, ShieldCheck, Siren, Star, type LucideIcon } from "lucide-react";
import { useBusinessBadges } from "@/features/badges/hooks";
import { cn } from "@/lib/utils";
import type { BadgeIconKey, BadgeTone, BusinessBadge } from "@/types";

export const BADGE_ICONS: Record<BadgeIconKey, LucideIcon> = {
  "shield-check": ShieldCheck,
  medal: Medal,
  handshake: Handshake,
  siren: Siren,
  percent: Percent,
  star: Star,
  flag: Flag,
  award: Award,
};
export const BADGE_ICON_KEYS = Object.keys(BADGE_ICONS) as BadgeIconKey[];

export const BADGE_TONES: Record<BadgeTone, string> = {
  olive: "bg-olive-100 text-olive-800 ring-olive-300",
  brass: "bg-brass-soft text-sand-700 ring-brass/50",
  sand: "bg-sand-100 text-olive-900 ring-sand-300",
  slate: "bg-olive-800 text-olive-50 ring-olive-900",
  red: "bg-destructive/10 text-destructive ring-destructive/30",
};
export const BADGE_TONE_KEYS = Object.keys(BADGE_TONES) as BadgeTone[];

/** One badge as a compact pill: icon + name (never colour alone). */
export function BadgePill({ badge, size = "sm", className }: { badge: Pick<BusinessBadge, "name" | "icon" | "tone">; size?: "sm" | "md"; className?: string }) {
  const Icon = BADGE_ICONS[badge.icon] ?? Award;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        BADGE_TONES[badge.tone],
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden />
      {badge.name}
    </span>
  );
}

/** A business's active badges as a wrapped row of pills; `max` collapses the rest into "+N". */
export function BadgeRow({ businessId, max, className, size = "sm", leading }: { businessId: string; max?: number; className?: string; size?: "sm" | "md"; leading?: React.ReactNode }) {
  const badges = useBusinessBadges(businessId);
  if (badges.length === 0 && !leading) return null;
  const shown = max ? badges.slice(0, max) : badges;
  const hidden = badges.length - shown.length;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Business badges and status">
      {leading && <li>{leading}</li>}
      {shown.map((b) => (
        <li key={b.id}><BadgePill badge={b} size={size} /></li>
      ))}
      {hidden > 0 && <li className="inline-flex items-center rounded-full bg-sand-100 px-2 py-0.5 text-[11px] font-semibold text-olive-900 ring-1 ring-inset ring-sand-300">+{hidden}</li>}
    </ul>
  );
}

/** Profile-page list: each badge with what it means. */
export function BadgeDetailList({ businessId }: { businessId: string }) {
  const badges = useBusinessBadges(businessId);
  if (badges.length === 0) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {badges.map((b) => {
        const Icon = BADGE_ICONS[b.icon] ?? Award;
        return (
          <li key={b.id} className="flex gap-3 rounded-md border bg-white p-3">
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full ring-1 ring-inset", BADGE_TONES[b.tone])}><Icon className="size-4" aria-hidden /></span>
            <div>
              <p className="text-sm font-semibold text-olive-950">{b.name}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{b.description}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
