"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { MapView } from "@/components/shared/map-view";
import { SectionHeading } from "@/components/shared/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { usePublicBusinesses } from "@/hooks/use-businesses";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";

export function MapSection() {
  const { businesses } = usePublicBusinesses();
  const { categoryName } = useCategories();
  const [selected, setSelected] = useState<string | null>(null);

  const markers = useMemo(
    () =>
      businesses.map((b) => ({
        id: b.id,
        lat: b.lat,
        lng: b.lng,
        title: b.name,
        subtitle: `${categoryName(b.category)} · ${b.city}, ${b.state}`,
        href: `/directory/${b.slug}`,
        image: b.coverImage,
      })),
    [businesses, categoryName],
  );

  const spotlight = businesses.slice(0, 5);

  return (
    <section className="section-y" aria-labelledby="map-heading">
      <div className="container-page grid gap-10 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col lg:col-span-4">
          <SectionHeading
          id="map-heading"
            eyebrow="Near you"
            title="Discover veteran-owned businesses on the map"
            description="Explore listings across the country. Select a pin to preview a business, or open the full map in the directory."
          />
          <ul className="mt-8 divide-y divide-sand-200 rounded-lg border bg-white">
            {spotlight.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => setSelected(b.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-olive-50",
                    selected === b.id && "bg-olive-50",
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-olive-100 text-olive-700">
                    <MapPin className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-olive-950">{b.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {b.city}, {b.state}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Link href="/directory?view=map" className={cn(buttonVariants({ size: "lg" }), "mt-6 self-start")}>
            Open full map <ArrowRight />
          </Link>
        </div>
        <MapView
          markers={markers}
          selectedId={selected}
          onSelect={setSelected}
          className="h-[380px] sm:h-[460px] lg:col-span-8 lg:h-auto lg:min-h-[520px]"
        />
      </div>
    </section>
  );
}
