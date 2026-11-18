"use client";

import { Building2, CheckCircle2, ExternalLink, Gift } from "lucide-react";
import { AssistanceButton } from "@/components/membership/assistance-button";
import { FREEBIE_CATEGORY_LABEL } from "@/features/offers/rules";
import { formatDate } from "@/lib/date";
import type { Freebie } from "@/types";
import { OfferCountdown } from "./offer-ui";

/** One Freebies & Discounts listing with every field the client asked for. */
export function FreebieCard({ freebie: f }: { freebie: Freebie }) {
  return (
    <article className="flex h-full flex-col rounded-lg border bg-card p-5 shadow-card transition-all duration-200 hover:border-olive-300 hover:shadow-lift">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-olive-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-olive-800">
          <Gift className="size-3.5" aria-hidden /> {FREEBIE_CATEGORY_LABEL[f.category]}
        </span>
        {f.expiresOn && <OfferCountdown expiresOn={f.expiresOn} />}
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug text-olive-950">{f.title}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Building2 className="size-3.5" aria-hidden /> {f.company}</p>
      <p className="mt-3 inline-flex w-fit items-center rounded-md border border-brass/40 bg-brass-soft/60 px-2.5 py-1 text-sm font-semibold text-sand-700">{f.offerDetails}</p>
      <p className="mt-3 text-sm leading-relaxed text-foreground/80">{f.summary}</p>
      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-foreground/75">
        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-olive-600" aria-hidden />
        <span><span className="font-semibold text-olive-900">Eligibility:</span> {f.eligibility}</span>
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{f.expiresOn ? `Expires ${formatDate(f.expiresOn)}` : "No expiration date"}</p>
      <div className="mt-auto flex flex-col items-start gap-3 pt-4">
        <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-olive-700 hover:text-olive-900 hover:underline">
          View offer <ExternalLink className="size-3.5" aria-hidden /><span className="sr-only"> from {f.company} (opens in a new tab)</span>
        </a>
        <AssistanceButton context={{ kind: "freebie", id: f.id, title: f.title }} compact />
      </div>
    </article>
  );
}
