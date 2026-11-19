"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { StatusPill, type Tone } from "@/components/dashboard/status-pill";
import { countdownTo, offerDisplayStatus, type OfferDisplayStatus } from "@/features/offers/rules";
import { useHydrated } from "@/hooks/use-store";
import { formatDate, todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { BusinessOffer } from "@/types";

const OFFER_STATUS: Record<OfferDisplayStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "warn" },
  approved: { label: "Approved", tone: "info" },
  published: { label: "Published", tone: "good" },
  rejected: { label: "Rejected", tone: "bad" },
  inactive: { label: "Deactivated", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
};

export function OfferStatusPill({ offer }: { offer: Pick<BusinessOffer, "status" | "startsOn" | "expiresOn"> }) {
  const s = OFFER_STATUS[offerDisplayStatus(offer, todayISO())];
  return <StatusPill tone={s.tone}>{s.label}</StatusPill>;
}

/**
 * Public countdown for temporary deals (client update §4C). Ticks every second in the browser; before hydration it
 * shows the end date so server and client markup match.
 */
export function OfferCountdown({ expiresOn, className }: { expiresOn: string; className?: string }) {
  const hydrated = useHydrated();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, []);

  if (!hydrated || !now) {
    return <span className={cn("inline-flex items-center gap-1 text-xs font-semibold text-sand-700", className)}><Timer className="size-3.5" aria-hidden /> Ends {formatDate(expiresOn)}</span>;
  }
  const c = countdownTo(expiresOn, now);
  if (c.ended) return <span className={cn("text-xs font-semibold text-muted-foreground", className)}>Offer ended</span>;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold text-destructive", className)} role="timer" aria-label={`Ends in ${c.days} days ${c.hours} hours ${c.minutes} minutes`}>
      <Timer className="size-3.5" aria-hidden />
      Ends in {c.days > 0 && <>{c.days}d </>}{pad(c.hours)}h {pad(c.minutes)}m <span className="tabular-nums">{pad(c.seconds)}s</span>
    </span>
  );
}
