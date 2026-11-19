"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cheapestPlanWith, hasFeature } from "@/features/membership/access";
import { useAllPlans, useResolvedPlan } from "@/features/membership/hooks";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import type { AppointmentContext } from "@/types";

/** Plan feature that unlocks the button for each kind of listing (set per plan in Admin → Membership Plans). */
const FEATURE: Record<AppointmentContext["kind"], string> = {
  benefit: "benefit_assistance",
  freebie: "offer_assistance",
  offer: "offer_assistance",
  service: "offer_assistance",
};
const TOPIC: Record<AppointmentContext["kind"], string> = {
  benefit: "Benefit assistance",
  freebie: "Freebies & discounts assistance",
  offer: "Freebies & discounts assistance",
  service: "Service follow-up",
};

/**
 * "Schedule an Appointment for Assistance" (client update §2). Shown only to members whose plan includes the
 * feature — paid Veterans for benefits; paid Veterans and Civilians for freebies & discounts. Free members see
 * an upgrade hint; visitors, business owners and staff see nothing. It opens the existing appointment booking page.
 */
export function AssistanceButton({ context, className, compact }: { context: AppointmentContext; className?: string; compact?: boolean }) {
  const user = useSession();
  const plans = useAllPlans();
  const audience = user?.role === "user" && (user.userType === "veteran" || user.userType === "civilian") ? user.userType : null;
  const plan = useResolvedPlan(audience ?? "veteran", audience ? user?.id : undefined);
  if (!audience) return null;

  const featureId = FEATURE[context.kind];
  // Benefit assistance is a Veteran plan feature; civilians simply don't have it.
  if (!hasFeature(plan, featureId)) {
    const needs = cheapestPlanWith(plans, audience, featureId);
    if (!needs) return null;
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        <Link href="/dashboard/membership" className="font-semibold text-olive-700 underline-offset-2 hover:underline">Upgrade to {needs.name}</Link> to schedule an appointment for help with this.
      </p>
    );
  }

  const qs = new URLSearchParams({ topic: TOPIC[context.kind], ref: `${context.kind}:${context.id}`, about: context.title });
  return (
    <Link href={`/dashboard/appointments?${qs}`} className={cn(buttonVariants({ variant: "default", size: compact ? "sm" : "default" }), "h-auto min-h-8 whitespace-normal py-1.5 text-left", className)}>
      <CalendarClock /> Schedule an Appointment for Assistance
    </Link>
  );
}
