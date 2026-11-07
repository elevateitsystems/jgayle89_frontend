"use client";

import { useMemo } from "react";
import { eventStore } from "@/services/event-service";
import { useSimulatedLoading, useStore } from "./use-store";
import type { CommunityEvent } from "@/types";

export function useEvents() {
  const all = useStore(eventStore);
  const loading = useSimulatedLoading();
  return { events: all, loading };
}

export function usePublishedEvents() {
  const { events, loading } = useEvents();
  const published = useMemo(
    () => events.filter((e) => e.status === "published").sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );
  return { events: published, loading };
}

export function useEvent(match: { slug?: string; id?: string }) {
  const { events, loading } = useEvents();
  const event: CommunityEvent | undefined = useMemo(
    () => events.find((e) => (match.slug ? e.slug === match.slug : e.id === match.id)),
    [events, match.slug, match.id],
  );
  return { event, loading };
}
