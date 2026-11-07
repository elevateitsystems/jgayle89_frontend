"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CollectionStore } from "@/lib/demo-store";

/** Subscribe to a collection store (server snapshot = seed data, so SSR works). */
export function useStore<T>(store: CollectionStore<T>): T[] {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

/** Simulated first-load latency so skeletons/loading states are exercised. */
export function useSimulatedLoading(ms = 450) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

const noopSubscribe = () => () => {};
const loadedAt = typeof window !== "undefined" ? Date.now() : null;

/** Current time on the client, `null` during SSR/hydration (keeps markup identical). */
export function useClientNow(): number | null {
  return useSyncExternalStore(noopSubscribe, () => loadedAt, () => null);
}
