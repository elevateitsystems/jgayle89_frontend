import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { EventSponsor } from "@/components/sponsorship/placements";
import { dayNum, formatTime, monthShort } from "@/lib/date";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CommunityEvent } from "@/types";

export function DateBadge({ date, className }: { date: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex w-14 flex-col items-center rounded-md bg-white px-2 py-1.5 text-center shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-brass">{monthShort(date)}</span>
      <span className="font-heading text-2xl font-semibold leading-none text-olive-950">{dayNum(date)}</span>
    </div>
  );
}

export function EventCard({ event: e, priority }: { event: CommunityEvent; priority?: boolean }) {
  return (
    <Link
      href={`/events/${e.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-olive-300 hover:shadow-lift"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sand-200">
        <Image
          src={e.image}
          alt={e.title}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-olive-950/40 via-transparent to-transparent" />
        <DateBadge date={e.date} className="absolute left-3 top-3" />
        <span className="absolute right-3 top-3 rounded-sm bg-olive-900/85 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
          {e.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-lg font-semibold leading-snug text-olive-950 transition-colors group-hover:text-olive-700 sm:text-xl">
          {e.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/80">{e.summary}</p>
        <EventSponsor eventId={e.id} className="mt-3" />
        <dl className="mt-auto space-y-1.5 pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Time</dt>
            <Clock className="size-3.5 shrink-0 text-olive-600" aria-hidden />
            <dd>
              {formatTime(e.startTime)} – {formatTime(e.endTime)}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Location</dt>
            <MapPin className="size-3.5 shrink-0 text-olive-600" aria-hidden />
            <dd className="truncate">
              {e.venue.startsWith("Online") ? "Online" : `${e.city}, ${e.state}`}
            </dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
