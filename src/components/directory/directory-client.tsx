"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, List, Map as MapIcon, Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import { BusinessCard, BusinessCardSkeleton } from "./business-card";
import { FilterPanel } from "./filter-panel";
import { DemoNotice } from "@/components/shared/demo-notice";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { MapView } from "@/components/shared/map-view";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { categoryById } from "@/data/categories";
import { usePublicBusinesses } from "@/hooks/use-businesses";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDirectoryFilters, type DirectoryView } from "@/hooks/use-directory-filters";
import { activeFilterCount, filterBusinesses } from "@/lib/business-filters";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

export function DirectoryClient() {
  const { businesses, loading } = usePublicBusinesses();
  const { filters, update, clear, view, setView, page, setPage } = useDirectoryFilters();
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Typing is debounced for the filtering pass so large lists stay snappy.
  const debouncedQ = useDebouncedValue(filters.q, 150);
  const debouncedLoc = useDebouncedValue(filters.location, 150);

  const results = useMemo(
    () => filterBusinesses(businesses, { ...filters, q: debouncedQ, location: debouncedLoc }),
    [businesses, filters, debouncedQ, debouncedLoc],
  );

  // Category counts reflect the other active filters (but not category itself).
  const counts = useMemo(() => {
    const base = filterBusinesses(businesses, { ...filters, q: debouncedQ, location: debouncedLoc, category: "" });
    return base.reduce<Record<string, number>>((acc, b) => {
      acc[b.category] = (acc[b.category] ?? 0) + 1;
      return acc;
    }, {});
  }, [businesses, filters, debouncedQ, debouncedLoc]);
  const totalForCounts = Object.values(counts).reduce((a, b) => a + b, 0);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = view === "map" ? results : results.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const filterCount = activeFilterCount(filters);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage, setPage]);

  const markers = useMemo(
    () =>
      results.map((b) => ({
        id: b.id,
        lat: b.lat,
        lng: b.lng,
        title: b.name,
        subtitle: `${categoryById(b.category)?.name} · ${b.city}, ${b.state}`,
        href: `/directory/${b.slug}`,
        image: b.coverImage,
      })),
    [results],
  );

  function goToPage(n: number) {
    setPage(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const activeChips = [
    filters.category && { key: "category", label: categoryById(filters.category)?.name ?? filters.category, clear: () => update({ category: "" }) },
    filters.branch && { key: "branch", label: filters.branch, clear: () => update({ branch: "" }) },
    filters.minRating > 0 && { key: "rating", label: `${filters.minRating}+ stars`, clear: () => update({ minRating: 0 }) },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const views: { id: DirectoryView; label: string; icon: typeof LayoutGrid }[] = [
    { id: "grid", label: "Grid", icon: LayoutGrid },
    { id: "list", label: "List", icon: List },
    { id: "map", label: "Map", icon: MapIcon },
  ];

  if (error) {
    return (
      <div className="container-page py-12">
        <ErrorState onRetry={() => setError(false)} />
      </div>
    );
  }

  return (
    <>
      {/* Search band */}
      <section className="border-b border-sand-200 bg-sand-100">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow">Directory</p>
          <h1 className="mt-2 text-4xl font-semibold text-olive-950 sm:text-5xl">Veteran-owned business directory</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Search by name or keyword, narrow by location and category, and explore on the map.
          </p>

          <div role="search" className="mt-7 grid gap-3 rounded-lg bg-white p-3 shadow-card ring-1 ring-black/5 sm:grid-cols-2 sm:p-4">
            <label className="relative flex items-center">
              <span className="sr-only">Search by business name or keyword</span>
              <Search className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
              <input
                type="search"
                value={filters.q}
                onChange={(e) => update({ q: e.target.value })}
                placeholder="Business name or keyword (e.g. coffee, welding)"
                className="h-11 w-full rounded-md border border-input bg-white pl-10 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              />
            </label>
            <label className="relative flex items-center">
              <span className="sr-only">Location</span>
              <MapPin className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
              <input
                type="search"
                value={filters.location}
                onChange={(e) => update({ location: e.target.value })}
                placeholder="City, state or ZIP"
                className="h-11 w-full rounded-md border border-input bg-white pl-10 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              />
            </label>
          </div>
        </div>
      </section>

      <div ref={topRef} className="container-page scroll-mt-24 py-8 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr]">
          {/* Sidebar filters (desktop) */}
          <aside aria-label="Filters" className="hidden lg:block">
            <div className="sticky top-36 rounded-lg border bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-sans text-sm font-semibold text-olive-950">Filters</h2>
                {filterCount > 0 && (
                  <button type="button" onClick={clear} className="text-xs font-semibold text-olive-700 underline underline-offset-2 hover:text-olive-900">
                    Clear all
                  </button>
                )}
              </div>
              <FilterPanel filters={filters} counts={counts} total={totalForCounts} onChange={update} idPrefix="side" />
            </div>
          </aside>

          <div className="min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {loading ? "Loading businesses…" : (
                  <>
                    <span className="font-semibold text-foreground">{results.length}</span> {results.length === 1 ? "business" : "businesses"} found
                  </>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                  <SheetTrigger render={<Button variant="outline" className="lg:hidden" />}>
                    <SlidersHorizontal /> Filters{filterCount > 0 && <span className="ml-0.5 rounded-full bg-olive-700 px-1.5 text-xs text-white">{filterCount}</span>}
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[88vw] max-w-sm gap-0 bg-sand-50 p-0">
                    <SheetHeader className="border-b border-sand-200 p-4">
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-4">
                      <FilterPanel filters={filters} counts={counts} total={totalForCounts} onChange={update} idPrefix="sheet" />
                    </div>
                    <SheetFooter className="flex-row gap-2 border-t border-sand-200 p-4">
                      <Button variant="outline" className="flex-1" onClick={clear}>
                        Clear all
                      </Button>
                      <Button className="flex-1" onClick={() => setSheetOpen(false)}>
                        Show {results.length}
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>

                <label className="flex items-center gap-2 text-sm">
                  <span className="sr-only sm:not-sr-only text-muted-foreground">Sort</span>
                  <NativeSelect
                    value={filters.sort}
                    onChange={(e) => update({ sort: e.target.value as typeof filters.sort })}
                    className="w-40"
                  >
                    <option value="featured">Featured first</option>
                    <option value="rating">Highest rated</option>
                    <option value="name">Name (A–Z)</option>
                    <option value="newest">Newest</option>
                  </NativeSelect>
                </label>

                <div role="group" aria-label="View" className="inline-flex rounded-md border border-input bg-white p-0.5">
                  {views.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={view === v.id}
                      onClick={() => setView(v.id)}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-[5px] px-3 text-sm font-medium transition-colors",
                        view === v.id ? "bg-olive-700 text-white" : "text-foreground hover:bg-sand-100",
                      )}
                    >
                      <v.icon className="size-4" aria-hidden />
                      <span className="hidden sm:inline">{v.label}</span>
                      <span className="sr-only sm:hidden">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeChips.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
                {activeChips.map((c) => (
                  <li key={c.key}>
                    <button
                      type="button"
                      onClick={c.clear}
                      className="inline-flex items-center gap-1.5 rounded-full bg-olive-100 px-3 py-1.5 text-xs font-medium text-olive-900 hover:bg-olive-200"
                    >
                      {c.label} <X className="size-3" aria-label="Remove filter" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5">
              <DemoNotice />
            </div>

            {/* Results */}
            <div className="mt-6">
              {loading ? (
                <div className={cn("grid gap-5", view === "list" ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-3")}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <BusinessCardSkeleton key={i} variant={view === "list" ? "list" : "grid"} />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <EmptyState
                  title="No businesses match your search"
                  description="Try a different keyword, widen the location, or clear your filters to see everything."
                  actionLabel="Clear all filters"
                  onAction={clear}
                />
              ) : view === "map" ? (
                <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
                  <ul className="order-2 max-h-none space-y-3 lg:order-1 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1">
                    {results.map((b) => (
                      <li key={b.id} onClick={() => setSelected(b.id)}>
                        <BusinessCard business={b} variant="grid" active={(selected ?? hovered) === b.id} onHover={setHovered} />
                      </li>
                    ))}
                  </ul>
                  <MapView
                    markers={markers}
                    selectedId={hovered ?? selected}
                    onSelect={setSelected}
                    className="order-1 h-[360px] sm:h-[480px] lg:sticky lg:top-36 lg:order-2 lg:h-[640px]"
                  />
                </div>
              ) : (
                <ul className={cn("grid gap-5", view === "list" ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-3")}>
                  {paged.map((b, i) => (
                    <li key={b.id}>
                      <BusinessCard business={b} variant={view === "list" ? "list" : "grid"} priority={i < 3} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pagination */}
            {!loading && view !== "map" && pageCount > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
                <Button variant="outline" size="icon" disabled={safePage === 1} onClick={() => goToPage(safePage - 1)} aria-label="Previous page">
                  <ChevronLeft />
                </Button>
                {Array.from({ length: pageCount }).map((_, i) => (
                  <Button
                    key={i}
                    variant={safePage === i + 1 ? "default" : "outline"}
                    size="icon"
                    aria-label={`Page ${i + 1}`}
                    aria-current={safePage === i + 1 ? "page" : undefined}
                    onClick={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button variant="outline" size="icon" disabled={safePage === pageCount} onClick={() => goToPage(safePage + 1)} aria-label="Next page">
                  <ChevronRight />
                </Button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
