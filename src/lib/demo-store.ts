/**
 * Tiny localStorage-backed collection store used by the Phase 1 demo.
 *
 * It is the ONLY place that knows data lives in the browser. Components never
 * import it directly — they go through hooks (src/hooks) and services
 * (src/services). To integrate the Django REST API later, replace the service
 * implementations and the hooks' data source; the UI does not change.
 */

export interface CollectionStore<T> {
  getSnapshot: () => T[];
  getServerSnapshot: () => T[];
  subscribe: (listener: () => void) => () => void;
  set: (next: T[]) => void;
  reset: () => void;
}

/** Bump when seed data changes shape so stale browser copies are discarded (v3: removed the reviewer demo account). */
const STORAGE_VERSION = "v3";

export function createCollectionStore<T>(name: string, seed: T[]): CollectionStore<T> {
  const key = `sitrep:${name}:${STORAGE_VERSION}`;
  const listeners = new Set<() => void>();
  let cache: T[] | null = null;

  function read(): T[] {
    if (typeof window === "undefined") return seed;
    if (cache) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T[]) : seed;
    } catch {
      cache = seed;
    }
    return cache;
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  function persist(next: T[] | null) {
    try {
      if (next === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage may be unavailable (private mode / quota); state still lives in memory.
    }
  }

  return {
    getSnapshot: read,
    getServerSnapshot: () => seed,
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          cache = null;
          emit();
        }
      };
      if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },
    set(next) {
      cache = next;
      persist(next);
      emit();
    },
    reset() {
      cache = seed;
      persist(null);
      emit();
    },
  };
}

/** Simulates network latency so loading states are visible and realistic. */
export const delay = (ms = 450) => new Promise<void>((r) => setTimeout(r, ms));
