"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { benefitCategories } from "@/data/benefit-categories";
import { US_STATES } from "@/data/us-states";
import { defaultBenefitFilters, type BenefitFilters } from "@/lib/benefit-filters";

/**
 * Filter + page state for the benefits search. Lives in React for instant UI and
 * is mirrored into the URL (no navigation) so searches are shareable.
 * Unknown `state` / `category` values in the URL are ignored.
 */
export function useBenefitFilters() {
  const params = useSearchParams();

  const [filters, setFilters] = useState<BenefitFilters>(() => {
    const state = (params.get("state") ?? "").toUpperCase();
    const category = params.get("category") ?? "";
    return {
      q: params.get("q") ?? "",
      state: US_STATES.some((s) => s.code === state) ? state : "",
      category: benefitCategories.some((c) => c.id === category) ? category : "",
    };
  });
  const [page, setPage] = useState(() => Math.max(1, Number(params.get("page") ?? 1) || 1));

  const update = useCallback((patch: Partial<BenefitFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  const clear = useCallback(() => {
    setFilters(defaultBenefitFilters);
    setPage(1);
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.state) sp.set("state", filters.state);
    if (filters.category) sp.set("category", filters.category);
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filters, page]);

  return { filters, update, clear, page, setPage };
}
