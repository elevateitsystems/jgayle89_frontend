"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EventCard, EventCardSkeleton } from "./event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { DemoNotice } from "@/components/shared/demo-notice";
import { eventCategories } from "@/data/events";
import { usePublishedEvents } from "@/hooks/use-events";
import { filterEvents } from "@/lib/business-filters";
import { isUpcoming } from "@/lib/date";
import { cn } from "@/lib/utils";

export function EventsClient() {
  const { events, loading } = usePublishedEvents();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const upcoming = useMemo(() => events.filter((e) => isUpcoming(e.date)), [events]);
  const results = useMemo(() => filterEvents(upcoming, { q, category }), [upcoming, q, category]);

  const reset = () => {
    setQ("");
    setCategory("");
  };

  return (
    <>
      <section className="border-b border-sand-200 bg-sand-100">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow">Events</p>
          <h1 className="mt-2 text-4xl font-semibold text-olive-950 sm:text-5xl">Community events</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Meet fellow veterans, founders and supporters. Everything here is sample content for the Phase 1 preview.
          </p>
          <label className="relative mt-7 flex max-w-xl items-center">
            <span className="sr-only">Search events</span>
            <Search className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events by title, city or organizer"
              className="h-12 w-full rounded-md border border-input bg-white pl-10 pr-3 text-base shadow-card outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
          </label>
        </div>
      </section>

      <div className="container-page py-8 sm:py-12">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
          {["", ...eventCategories].map((c) => (
            <button
              key={c || "all"}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "h-10 rounded-full border px-4 text-sm font-medium transition-colors",
                category === c ? "border-olive-700 bg-olive-700 text-white" : "border-input bg-white hover:bg-sand-100",
              )}
            >
              {c || "All events"}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {loading ? "Loading events…" : `${results.length} upcoming ${results.length === 1 ? "event" : "events"}`}
          </p>
          <DemoNotice />
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              title="No upcoming events found"
              description="Try another category or clear your search. New events are added regularly."
              actionLabel="Clear filters"
              onAction={reset}
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {results.map((e, i) => (
                <li key={e.id}>
                  <EventCard event={e} priority={i < 3} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
