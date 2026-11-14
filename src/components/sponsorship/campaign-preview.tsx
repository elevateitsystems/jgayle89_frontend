"use client";

import { MapPin } from "lucide-react";
import { AdImage, BannerCreative, SponsorCard, SponsoredLabel } from "./placements";
import { BusinessAvatar } from "@/components/shared/monogram";
import { cn } from "@/lib/utils";
import type { AdProduct, Business, CampaignCreative } from "@/types";

/**
 * "This is how it will look" preview for an advertiser. It reuses the real public placement components
 * (and so the required Sponsored / Advertisement label) rather than re-drawing them.
 */
export function CampaignPreview({ product, business, creative, className }: { product: AdProduct; business: Business | undefined; creative: CampaignCreative; className?: string }) {
  const name = business?.name ?? "Your business";
  const campaign = { businessName: name, creative };

  let body: React.ReactNode;
  switch (product.kind) {
    case "premium_banner":
      body = <BannerCreative campaign={campaign} label={product.label} />;
      break;
    case "geo_sponsorship":
      body = <SponsorCard campaign={campaign} label={product.label} prefix="Texas directory sponsored by" />;
      break;
    case "resource_sponsorship":
      body = <SponsorCard campaign={campaign} label={product.label} prefix="Resource sponsored by" />;
      break;
    case "event_sponsorship":
      body = (
        <p className="flex flex-wrap items-center gap-2 rounded-md border bg-white p-3 text-sm text-muted-foreground">
          <SponsoredLabel label={product.label} /> Event sponsored by <strong className="text-olive-900">{name}</strong>
        </p>
      );
      break;
    case "newsletter_sponsorship":
      body = (
        <div className="rounded-lg border bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Mission: SITREP community newsletter</p>
          <div className="mt-3 rounded-md border border-sand-300 p-3">
            <SponsoredLabel label={product.label} />
            {creative.image && <span className="relative mt-2 block aspect-[2/1] overflow-hidden rounded bg-sand-200"><AdImage src={creative.image} alt="" sizes="360px" /></span>}
            <p className="mt-2 font-semibold text-olive-950">{creative.headline || "Your headline"}</p>
            {creative.body && <p className="text-sm text-muted-foreground">{creative.body}</p>}
            {creative.ctaLabel && <span className="mt-2 inline-block rounded-md bg-olive-700 px-3 py-1.5 text-sm font-medium text-white">{creative.ctaLabel}</span>}
          </div>
        </div>
      );
      break;
    default:
      // featured search / category / homepage — a directory-style card.
      body = (
        <article className="overflow-hidden rounded-lg border bg-card shadow-card">
          <div className="relative aspect-[4/3] bg-sand-200">
            {(product.needsImage ? creative.image : business?.coverImage) ? <AdImage src={(product.needsImage ? creative.image : business?.coverImage) as string} alt="" sizes="360px" /> : null}
            <span className="absolute right-3 top-3"><SponsoredLabel label={product.label} className="bg-white/95" /></span>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2"><BusinessAvatar name={name} src={business?.profileImage} className="size-8 rounded-md" textClassName="text-xs" /><h3 className="font-sans text-base font-semibold text-olive-950">{name}</h3></div>
            {business && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5 text-olive-600" aria-hidden /> {business.city}, {business.state}</p>}
            <p className={cn("mt-2 text-sm text-foreground/80", !creative.headline && "text-muted-foreground")}>{creative.headline || "Your headline appears here."}</p>
          </div>
        </article>
      );
  }

  return (
    <div className={className} aria-label="Campaign preview">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-olive-700">Preview · {product.placement}</p>
      {body}
    </div>
  );
}
