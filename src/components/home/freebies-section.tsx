"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { FreebieCard } from "@/components/offers/freebie-card";
import { buttonVariants } from "@/components/ui/button";
import { FREEBIE_CATEGORIES, FREEBIE_CATEGORY_LABEL, filterFreebies } from "@/features/offers/rules";
import { useFreebies } from "@/features/offers/hooks";
import { todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";

/** Homepage "Freebies & Discounts" section (client update §2B) — leads to the searchable directory. */
export function FreebiesSection() {
  const all = useFreebies();
  const today = todayISO();
  const featured = useMemo(() => filterFreebies(all, { q: "", category: "" }, today).slice(0, 3), [all, today]);
  return (
    <section className="section-y" aria-labelledby="freebies-heading">
      <div className="container-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="freebies-heading"
            eyebrow="Save with us"
            title="Freebies & Discounts"
            description="Veteran freebies, military and first responder discounts, and corporate offers — all in one place."
          />
          <Link href="/freebies" className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}>
            Browse all offers <ArrowRight />
          </Link>
        </div>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Offer categories">
          {FREEBIE_CATEGORIES.map((c) => (
            <li key={c}>
              <Link href={`/freebies?category=${c}`} className="inline-flex h-9 items-center rounded-full border border-input bg-white px-3.5 text-sm font-medium hover:bg-sand-100">
                {FREEBIE_CATEGORY_LABEL[c]}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((f) => <li key={f.id}><FreebieCard freebie={f} /></li>)}
        </ul>
      </div>
    </section>
  );
}
