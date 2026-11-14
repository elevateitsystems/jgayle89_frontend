"use client";

import { EventSponsor } from "@/components/sponsorship/placements";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Clock, Link2, MapPin, Ticket, User, Users } from "lucide-react";
import { EventCard } from "./event-card";
import { DateBadge } from "./event-card";
import { DemoNotice } from "@/components/shared/demo-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { MapView } from "@/components/shared/map-view";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvent, usePublishedEvents } from "@/hooks/use-events";
import { formatLongDate, formatTime, isUpcoming } from "@/lib/date";
import { cn } from "@/lib/utils";

export function EventDetail({ slug }: { slug: string }) {
  const { event: e, loading } = useEvent({ slug });
  const { events } = usePublishedEvents();
  const [registered, setRegistered] = useState(false);

  const others = useMemo(
    () => events.filter((x) => x.id !== e?.id && isUpcoming(x.date)).slice(0, 3),
    [events, e?.id],
  );

  if (loading && !e) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-72 w-full sm:h-96" />
        <Skeleton className="mt-8 h-10 w-2/3" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    );
  }

  if (!e) {
    return (
      <div className="container-page py-20">
        <EmptyState title="Event not found" description="This event may have been removed or the link is incorrect.">
          <Link href="/events" className={cn(buttonVariants(), "mt-6")}>
            Back to events
          </Link>
        </EmptyState>
      </div>
    );
  }

  const spotsLeft = Math.max(0, e.capacity - e.registered - (registered ? 1 : 0));
  const pct = Math.min(100, Math.round(((e.registered + (registered ? 1 : 0)) / e.capacity) * 100));
  const virtual = e.venue.startsWith("Online");

  function register() {
    setRegistered(true);
    toast.success("You're on the list! (demo)", { description: `We'd send confirmation for "${e!.title}" to your email.` });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Event link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  return (
    <>
      <div className="relative h-60 bg-olive-900 sm:h-80 lg:h-[26rem]">
        <Image src={e.image} alt={e.title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-olive-950/80 via-olive-950/20 to-olive-950/30" />
        <div className="container-page relative flex h-full flex-col justify-between py-5">
          <Link
            href="/events"
            className="inline-flex w-fit items-center gap-1.5 rounded-md bg-white/90 px-3 py-2 text-sm font-medium text-olive-900 shadow-sm backdrop-blur hover:bg-white"
          >
            <ArrowLeft className="size-4" aria-hidden /> All events
          </Link>
          <div className="flex items-end gap-4 pb-2">
            <DateBadge date={e.date} className="hidden sm:flex" />
            <div>
              <span className="rounded-sm bg-brass px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">{e.category}</span>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-5xl">{e.title}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-12 lg:py-14">
        <div className="space-y-10 lg:col-span-8">
          {e.status === "draft" && (
            <p className="rounded-md border border-brass/40 bg-brass-soft px-4 py-2.5 text-sm text-sand-700">
              <strong className="font-semibold">Draft</strong> — this event is not published and is only visible to admins.
            </p>
          )}
          <EventSponsor eventId={e.id} className="rounded-md border bg-white px-4 py-3 text-sm" />
          <section aria-labelledby="ev-about">
            <h2 id="ev-about" className="text-2xl font-semibold text-olive-950">About this event</h2>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/85">
              {e.description.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>

          {e.agenda.length > 0 && (
            <section aria-labelledby="ev-agenda">
              <h2 id="ev-agenda" className="text-2xl font-semibold text-olive-950">Agenda</h2>
              <ol className="mt-4 divide-y divide-sand-200 rounded-lg border bg-white">
                {e.agenda.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-3.5 text-sm">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-olive-100 text-xs font-semibold text-olive-700">{i + 1}</span>
                    {a}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {!virtual && (
            <section aria-labelledby="ev-loc">
              <h2 id="ev-loc" className="text-2xl font-semibold text-olive-950">Location</h2>
              <p className="mt-2 text-muted-foreground">{e.venue} · {e.address}, {e.city}, {e.state}</p>
              <MapView
                markers={[{ id: e.id, lat: e.lat, lng: e.lng, title: e.venue, subtitle: `${e.city}, ${e.state}` }]}
                selectedId={e.id}
                className="mt-4 h-72 sm:h-80"
                singleZoom={14}
              />
            </section>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-lg border bg-card p-5 shadow-card lg:sticky lg:top-36">
            <p className="font-heading text-3xl font-semibold text-olive-950">{e.price}</p>
            <ul className="mt-5 space-y-4 text-sm">
              <Row icon={CalendarDays} label="Date">{formatLongDate(e.date)}</Row>
              <Row icon={Clock} label="Time">{formatTime(e.startTime)} – {formatTime(e.endTime)}</Row>
              <Row icon={MapPin} label="Where">{e.venue}<br /><span className="text-muted-foreground">{virtual ? "Virtual" : `${e.city}, ${e.state}`}</span></Row>
              <Row icon={User} label="Organizer">{e.organizer}</Row>
              <Row icon={Ticket} label="Admission">{e.price}</Row>
            </ul>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" aria-hidden /> {e.registered + (registered ? 1 : 0)} registered</span>
                <span>{spotsLeft} spots left</span>
              </div>
              <Progress value={pct} />
            </div>

            <Button size="lg" className="mt-6 w-full" disabled={registered || spotsLeft === 0} onClick={register}>
              {registered ? "Registered ✓" : spotsLeft === 0 ? "Sold out" : "Register (demo)"}
            </Button>
            <Button variant="outline" className="mt-2 w-full" onClick={copyLink}>
              <Link2 /> Copy event link
            </Button>
            <DemoNotice className="mt-5" />
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="border-t border-sand-200 bg-sand-100 py-14" aria-labelledby="more-events">
          <div className="container-page">
            <h2 id="more-events" className="text-2xl font-semibold text-olive-950 sm:text-3xl">More upcoming events</h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <li key={o.id}><EventCard event={o} /></li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-olive-100 text-olive-700">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-0.5 leading-relaxed">{children}</div>
      </div>
    </li>
  );
}
