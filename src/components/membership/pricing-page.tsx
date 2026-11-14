"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, FlaskConical } from "lucide-react";
import { MembershipManager } from "./membership-manager";
import { DemoNotice } from "@/components/shared/demo-notice";
import { personaOf } from "@/features/dashboard/nav";
import { useSession } from "@/hooks/use-session";
import { AUDIENCE_LABEL } from "@/lib/mock-data/membership";
import { cn } from "@/lib/utils";
import type { PlanAudience } from "@/types";

const AUDIENCES: PlanAudience[] = ["veteran", "civilian", "business"];
const BLURB: Record<PlanAudience, string> = {
  veteran: "For veterans and service members who want benefit alerts, discounts and advisor time.",
  civilian: "For supporters of the veteran community who want discounts and early event access.",
  business: "For veteran-owned and veteran-friendly businesses that want a richer listing and insights.",
};

/** Public membership pricing. Everything shown comes from the plan store (Admin → Membership Plans). */
export function PricingPage() {
  const user = useSession();
  const persona = personaOf(user);
  const own: PlanAudience | null = persona === "veteran" ? "veteran" : persona === "civilian" ? "civilian" : persona === "business_owner" ? "business" : null;
  const [picked, setPicked] = useState<PlanAudience | null>(null);
  const audience = picked ?? own ?? "veteran";
  const manageHref = audience === "business" ? "/dashboard/memberships" : "/dashboard/membership";

  return (
    <>
      <section className="border-b border-sand-200 bg-sand-100">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow">Membership</p>
          <h1 className="mt-2 text-4xl font-semibold text-olive-950 sm:text-5xl">Plans for every part of the community</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">Finding businesses and community resources is always free. Paid plans add extras on top.</p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-olive-900">
            {["Business directory search", "Community resources", "Public events"].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check className="size-4 text-olive-600" aria-hidden /> {t} — free for everyone</li>
            ))}
          </ul>
        </div>
      </section>

      <div className="container-page py-10 sm:py-12">
        <div role="radiogroup" aria-label="Who is this plan for?" className="mb-3 inline-flex flex-wrap rounded-md border border-input bg-white p-0.5">
          {AUDIENCES.map((a) => (
            <label key={a} className={cn("inline-flex h-10 cursor-pointer items-center rounded-[5px] px-4 text-sm font-medium transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50", audience === a ? "bg-olive-700 text-white" : "hover:bg-sand-100")}>
              <input type="radio" name="audience" className="sr-only" checked={audience === a} onChange={() => setPicked(a)} />
              {AUDIENCE_LABEL[a]}
            </label>
          ))}
        </div>
        <p className="mb-8 text-sm text-muted-foreground">{BLURB[audience]}</p>

        <MembershipManager
          key={audience}
          mode="public"
          audience={audience}
          ctaHref={(p) => (user ? manageHref : p.monthlyPrice === 0 ? "/register" : `/register?plan=${p.id}`)}
          ctaLabel={(p) => (user && own === audience ? "Manage in dashboard" : p.monthlyPrice === 0 ? "Join free" : `Get ${p.name}`)}
        />

        <section aria-labelledby="faq-h" className="mt-14 grid gap-6 border-t border-sand-200 pt-10 md:grid-cols-3">
          <h2 id="faq-h" className="sr-only">Common questions</h2>
          {[
            ["Does a paid plan make my business “Verified”?", "No. Verification and other badges are earned through a staff review of your documents — they're never part of a plan."],
            ["Is advertising included?", "Some business plans include a monthly allowance of placements. Anything beyond that is bought separately and always labelled “Sponsored” or “Advertisement”."],
            ["Can I cancel any time?", "Yes. You keep your paid features until the end of the period you've paid for, then move to the Free plan."],
          ].map(([q, a]) => (
            <div key={q}><h3 className="font-sans text-base font-semibold text-olive-950">{q}</h3><p className="mt-1.5 text-sm text-muted-foreground">{a}</p></div>
          ))}
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <DemoNotice />
          <p className="inline-flex items-start gap-2"><FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Payments aren&apos;t connected yet — choosing a paid plan won&apos;t charge you. <Link href="/directory" className="font-semibold text-olive-700 underline-offset-2 hover:underline">Browse the directory</Link></p>
        </div>
      </div>
    </>
  );
}
