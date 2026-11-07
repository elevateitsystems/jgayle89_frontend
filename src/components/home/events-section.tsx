"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EventCard, EventCardSkeleton } from "@/components/events/event-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { usePublishedEvents } from "@/hooks/use-events";
import { isUpcoming } from "@/lib/date";

export function EventsSection() {
  const { events, loading } = usePublishedEvents();
  const upcoming = events.filter((e) => isUpcoming(e.date)).slice(0, 3);

  return (
    <section className="section-y bg-sand-100" aria-labelledby="events-heading">
      <div className="container-page">
        <SectionHeading
          id="events-heading"
          eyebrow="Community"
          title="Upcoming community events"
          description="Networking mixers, career fairs, workshops and outings — find a way to connect."
          action={
            <Link href="/events" className={buttonVariants({ variant: "outline" })}>
              All events <ArrowRight />
            </Link>
          }
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)
            : upcoming.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </div>
    </section>
  );
}
