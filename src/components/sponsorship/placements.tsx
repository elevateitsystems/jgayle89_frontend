"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { useLiveCampaignsOfKind } from "@/features/advertising/hooks";
import { geoMatches } from "@/features/advertising/rules";
import { US_STATES } from "@/data/us-states";
import { cn } from "@/lib/utils";
import type { AdCampaign, AdLabel } from "@/types";

/**
 * PUBLIC PLACEMENTS. Every paid placement on the public site is rendered through this file so that the
 * required "Sponsored" / "Advertisement" label can never be forgotten.
 */
const stateNames = Object.fromEntries(US_STATES.map((s) => [s.code, s.name]));

export function SponsoredLabel({ label = "Sponsored", className }: { label?: AdLabel; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-sm bg-sand-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sand-700", className)}>
      {label}
    </span>
  );
}

export function AdImage({ src, alt, className, sizes = "(min-width: 1024px) 400px, 100vw" }: { src: string; alt: string; className?: string; sizes?: string }) {
  return <Image src={src} alt={alt} fill sizes={sizes} unoptimized={src.startsWith("data:")} className={cn("object-cover", className)} />;
}

const adRel = "sponsored noopener noreferrer";

type CreativeLike = Pick<AdCampaign, "businessName" | "creative">;

export function SponsorCard({ campaign, label, prefix }: { campaign: CreativeLike; label: AdLabel; prefix?: string }) {
  const { creative } = campaign;
  const external = /^https?:\/\//.test(creative.ctaUrl);
  return (
    <aside aria-label={`${label}: ${campaign.businessName}`} className="flex items-center gap-4 rounded-lg border border-sand-300 bg-white p-3 shadow-card sm:p-4">
      <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-sand-200 sm:size-16">
        {creative.logo ? <AdImage src={creative.logo} alt={`${campaign.businessName} logo`} sizes="64px" /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <SponsoredLabel label={label} />
        <p className="mt-1 text-sm font-semibold leading-snug text-olive-950 sm:text-base">{prefix ? `${prefix} ${campaign.businessName}` : creative.headline}</p>
        {creative.body && <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">{creative.body}</p>}
      </div>
      {creative.ctaUrl && creative.ctaLabel && (
        <a
          href={creative.ctaUrl}
          {...(external ? { target: "_blank", rel: adRel } : {})}
          className="hidden shrink-0 items-center gap-1 rounded-md border border-input px-3 py-2 text-sm font-medium text-olive-900 hover:bg-sand-100 sm:inline-flex"
        >
          {creative.ctaLabel} <ExternalLink className="size-3.5" aria-hidden />
        </a>
      )}
    </aside>
  );
}

/** The banner artwork itself — shared by the live directory banner and the advertiser's preview. */
export function BannerCreative({ campaign, label }: { campaign: CreativeLike; label: AdLabel }) {
  const external = /^https?:\/\//.test(campaign.creative.ctaUrl);
  return (
    <aside aria-label={`${label}: ${campaign.businessName}`} className="overflow-hidden rounded-lg border border-sand-300 bg-white shadow-card">
      <a href={campaign.creative.ctaUrl || "#"} {...(external ? { target: "_blank", rel: adRel } : {})} className="group relative block aspect-[4/1] min-h-28 w-full bg-olive-900">
        {campaign.creative.image && <AdImage src={campaign.creative.image} alt="" sizes="(min-width: 1280px) 1200px, 100vw" className="transition-transform duration-500 group-hover:scale-[1.02]" />}
        <span className="absolute inset-0 bg-gradient-to-r from-olive-950/75 via-olive-950/30 to-transparent" />
        <span className="absolute inset-y-0 left-0 flex max-w-[85%] flex-col justify-center gap-1 p-4 sm:p-6">
          <SponsoredLabel label={label} className="w-fit bg-white/90" />
          <span className="font-heading text-lg font-semibold text-white sm:text-2xl">{campaign.creative.headline}</span>
          {campaign.creative.body && <span className="line-clamp-2 text-xs text-olive-100 sm:text-sm">{campaign.creative.body}</span>}
          <span className="sr-only">{campaign.businessName}</span>
        </span>
      </a>
    </aside>
  );
}

/** Wide image banner at the top of the directory. Always labelled "Advertisement". */
export function DirectoryBanner() {
  const live = useLiveCampaignsOfKind("premium_banner");
  const first = live[0];
  if (!first) return null;
  return <BannerCreative campaign={first.campaign} label={first.product.label} />;
}

/** City/State sponsor banner — only when the visitor's location search matches the sponsored place. */
export function GeoSponsorBanner({ location }: { location: string }) {
  const live = useLiveCampaignsOfKind("geo_sponsorship");
  const match = live.find(({ campaign }) => geoMatches(location, campaign.targeting, stateNames));
  if (!match) return null;
  const places = match.campaign.targeting.states.map((s) => stateNames[s] ?? s).join(", ");
  return <SponsorCard campaign={match.campaign} label={match.product.label} prefix={`${places} directory sponsored by`} />;
}

/** Sponsors of the community resources currently on screen. */
export function SponsorStrip({ kind, resourceIds }: { kind: "resource_sponsorship"; resourceIds: string[] }) {
  const live = useLiveCampaignsOfKind(kind);
  const matches = live.filter(({ campaign }) => resourceIds.includes(campaign.targeting.resourceId));
  if (matches.length === 0) return null;
  return (
    <div className="space-y-3">
      {matches.map(({ campaign, product }) => (
        <SponsorCard key={campaign.id} campaign={campaign} label={product.label} prefix="Resource sponsored by" />
      ))}
    </div>
  );
}

/** "Sponsored by …" chip for an event. */
export function EventSponsor({ eventId, className }: { eventId: string; className?: string }) {
  const live = useLiveCampaignsOfKind("event_sponsorship");
  const match = live.find(({ campaign }) => campaign.targeting.eventId === eventId);
  if (!match) return null;
  return (
    <p className={cn("flex flex-wrap items-center gap-2 text-xs text-muted-foreground", className)}>
      <SponsoredLabel label={match.product.label} />
      <span>Event sponsored by <strong className="font-semibold text-olive-900">{match.campaign.businessName}</strong></span>
    </p>
  );
}
