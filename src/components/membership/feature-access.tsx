import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { cheapestPlanWith, hasFeature, usageState } from "@/features/membership/access";
import { cn } from "@/lib/utils";
import type { MembershipPlan, PlanAudience } from "@/types";

/** ✓ Included / 🔒 Upgrade indicator for one feature on the member's current plan. */
export function FeatureAccessIndicator({ plan, plans, audience, featureId, label }: { plan: MembershipPlan | undefined; plans: MembershipPlan[]; audience: PlanAudience; featureId: string; label: string }) {
  const included = hasFeature(plan, featureId);
  const needs = included ? undefined : cheapestPlanWith(plans, audience, featureId);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", included ? "text-olive-800" : "text-muted-foreground")}>
      {included ? <Check className="size-4 text-olive-600" aria-hidden /> : <Lock className="size-4" aria-hidden />}
      <span>{label}</span>
      <span className="sr-only">{included ? " — included in your plan" : needs ? ` — available on ${needs.name}` : " — not included"}</span>
      {!included && needs && <span className="rounded-full bg-sand-200 px-2 py-0.5 text-[11px] font-semibold text-sand-700">{needs.name}+</span>}
    </span>
  );
}

/** Banner shown where a feature is locked, pointing at the page where the plan can be changed. */
export function UpgradePrompt({ featureLabel, requiredPlan, href, className }: { featureLabel: string; requiredPlan?: string; href: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-lg border border-brass/40 bg-brass-soft p-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <p className="flex items-start gap-2 text-sm text-sand-700">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span><strong>{featureLabel}</strong> isn&apos;t part of your current plan{requiredPlan ? ` — it's included from ${requiredPlan}` : ""}.</span>
      </p>
      <Link href={href} className={cn(buttonVariants({ size: "sm" }), "shrink-0")}>See plans</Link>
    </div>
  );
}

/** Usage meter for a limit feature ("3 of 10 photos"). */
export function UsageMeter({ plan, featureId, used, label }: { plan: MembershipPlan | undefined; featureId: string; used: number; label: string }) {
  const u = usageState(plan, featureId, used);
  if (!u.included) return <p className="text-sm text-muted-foreground">{label}: not included in your plan.</p>;
  if (u.unlimited) return <p className="text-sm">{label}: <strong>{used}</strong> used · Unlimited</p>;
  return (
    <Progress value={Math.min(100, (used / (u.limit as number)) * 100)} className="gap-1.5">
      <div className="flex w-full items-center justify-between text-sm">
        <ProgressLabel>{label}</ProgressLabel>
        <ProgressValue>{() => `${used} of ${u.limit}`}</ProgressValue>
      </div>
    </Progress>
  );
}
