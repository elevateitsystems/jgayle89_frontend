"use client";

import { useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { isBenefitCurrent } from "@/lib/benefit-filters";
import { todayISO } from "@/lib/date";
import { baseBenefits, benefitOverrideStore, customBenefitStore, mergeBenefits } from "@/services/benefit-admin-service";

/** Every program staff can manage (base catalogue + staff-added), with publish state. */
export function useManagedBenefits() {
  const overrides = useStore(benefitOverrideStore);
  const custom = useStore(customBenefitStore);
  return useMemo(() => mergeBenefits(baseBenefits, overrides, custom), [overrides, custom]);
}

/** What visitors and members see: published, not removed, and not past its end date. */
export function usePublicBenefits() {
  const managed = useManagedBenefits();
  return useMemo(() => {
    const today = todayISO();
    return managed.filter((m) => m.published && isBenefitCurrent(m.benefit, today)).map((m) => m.benefit);
  }, [managed]);
}
