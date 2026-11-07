"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { MapMarker } from "./leaflet-map";

export type { MapMarker };

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

interface MapViewProps {
  markers: MapMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onPick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  singleZoom?: number;
  className?: string;
}

/** Client-only Leaflet map with a sized wrapper so layout never jumps. */
export function MapView({ className, ...props }: MapViewProps) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-lg border bg-sand-100", className)}>
      <LeafletMap {...props} className="h-full w-full" />
    </div>
  );
}
