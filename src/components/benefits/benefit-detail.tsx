import Link from "next/link";
import { ArrowLeft, ExternalLink, Info } from "lucide-react";
import { CategoryBadge, DataStatusBadge, ScopeBadge } from "./benefit-badges";
import { buttonVariants } from "@/components/ui/button";
import { stateName } from "@/data/us-states";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Benefit } from "@/types";

export function BenefitDetail({ benefit: b }: { benefit: Benefit }) {
  const backHref = b.state ? `/benefits?state=${b.state}` : "/benefits";
  return (
    <div className="container-page py-8 sm:py-12">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-olive-700 hover:text-olive-900">
        <ArrowLeft className="size-4" aria-hidden /> All benefits{b.state ? ` · ${stateName(b.state)}` : ""}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={b.category} />
            <ScopeBadge benefit={b} />
            <DataStatusBadge status={b.dataStatus} />
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-olive-950 sm:text-4xl">{b.title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Administered by {b.agency}</p>
          <p className="mt-5 text-lg leading-relaxed text-foreground/85">{b.summary}</p>

          {b.dataStatus === "demo" && (
            <p className="mt-5 flex items-start gap-2 rounded-md border border-sand-300 bg-sand-100 px-3 py-2.5 text-sm text-sand-700">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                This summary is prototype content and has not been reviewed against the official source. Confirm all details on the official page before relying on them.
              </span>
            </p>
          )}

          <section aria-labelledby="about-h" className="mt-10">
            <h2 id="about-h" className="text-2xl font-semibold text-olive-950">About this benefit</h2>
            <p className="mt-3 leading-relaxed text-foreground/85">{b.description}</p>
          </section>

          <section aria-labelledby="elig-h" className="mt-10">
            <h2 id="elig-h" className="text-2xl font-semibold text-olive-950">Eligibility</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-foreground/85 marker:text-olive-600">
              {b.eligibility.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="apply-h" className="mt-10">
            <h2 id="apply-h" className="text-2xl font-semibold text-olive-950">How to apply</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed text-foreground/85 marker:font-semibold marker:text-olive-700">
              {b.howToApply.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-lg border bg-card p-5 shadow-card lg:sticky lg:top-36">
            <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-olive-700">Official links</h2>
            <div className="mt-4 flex flex-col gap-2">
              <a href={b.sourceUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "lg" }))}>
                Official program page <ExternalLink />
              </a>
              {b.applyUrl && (
                <a href={b.applyUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  Apply / get started <ExternalLink />
                </a>
              )}
            </div>
            <dl className="mt-5 space-y-3 border-t border-sand-200 pt-4 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Availability</dt>
                <dd className="mt-0.5">{b.state ? `${stateName(b.state)} only` : "Nationwide (federal)"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Details last verified</dt>
                <dd className="mt-0.5">{b.lastVerified ? formatDate(b.lastVerified) : "Not yet verified"}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
