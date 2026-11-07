"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { defaultFilters, type BusinessFilters } from "@/lib/business-filters";

export type DirectoryView = "grid" | "list" | "map";

const SORTS = ["featured", "rating", "name", "newest"] as const;

/**
 * Filter state for the directory. State lives in React (instant UI) and is
 * mirrored into the URL so searches are shareable and the homepage search can
 * deep-link into it.
 */
export function useDirectoryFilters() {
  const params = useSearchParams();

  const [filters, setFilters] = useState<BusinessFilters>(() => {
    const sort = params.get("sort") as BusinessFilters["sort"] | null;
    return {
      q: params.get("q") ?? "",
      location: params.get("location") ?? "",
      category: params.get("category") ?? "",
      branch: params.get("branch") ?? "",
      minRating: Number(params.get("rating") ?? 0) || 0,
      sort: sort && SORTS.includes(sort) ? sort : defaultFilters.sort,
    };
  });
  const [view, setViewState] = useState<DirectoryView>(() => {
    const v = params.get("view");
    return v === "list" || v === "map" ? v : "grid";
  });
  const [page, setPage] = useState(() => Math.max(1, Number(params.get("page") ?? 1) || 1));

  const update = useCallback((patch: Partial<BusinessFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  const clear = useCallback(() => {
    setFilters(defaultFilters);
    setPage(1);
  }, []);

  // Mirror state into the URL (no navigation, no scroll jump).
  useEffect(() => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.location) sp.set("location", filters.location);
    if (filters.category) sp.set("category", filters.category);
    if (filters.branch) sp.set("branch", filters.branch);
    if (filters.minRating) sp.set("rating", String(filters.minRating));
    if (filters.sort !== "featured") sp.set("sort", filters.sort);
    if (view !== "grid") sp.set("view", view);
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filters, view, page]);

  return { filters, update, clear, view, setView: setViewState, page, setPage };
}
