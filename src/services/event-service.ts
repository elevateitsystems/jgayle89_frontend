import { events as seed } from "@/data/events";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { newId, uniqueSlug } from "@/lib/slug";
import type { CommunityEvent } from "@/types";

export const eventStore = createCollectionStore<CommunityEvent>("events", seed);

export type EventInput = Omit<CommunityEvent, "id" | "createdAt" | "slug"> & { slug?: string };

export const eventService = {
  async list(): Promise<CommunityEvent[]> {
    await delay(200);
    return eventStore.getSnapshot();
  },

  async getBySlug(slug: string) {
    await delay(150);
    return eventStore.getSnapshot().find((e) => e.slug === slug);
  },

  async create(input: EventInput): Promise<CommunityEvent> {
    await delay(500);
    const all = eventStore.getSnapshot();
    const event: CommunityEvent = {
      ...input,
      id: newId("evt"),
      slug: uniqueSlug(input.slug || input.title, all.map((e) => e.slug)),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    eventStore.set([event, ...all]);
    return event;
  },

  async update(id: string, patch: Partial<EventInput>): Promise<CommunityEvent> {
    await delay(500);
    const all = eventStore.getSnapshot();
    const current = all.find((e) => e.id === id);
    if (!current) throw new Error("Event not found");
    const next: CommunityEvent = { ...current, ...patch, slug: current.slug };
    eventStore.set(all.map((e) => (e.id === id ? next : e)));
    return next;
  },

  async remove(id: string): Promise<void> {
    await delay(350);
    eventStore.set(eventStore.getSnapshot().filter((e) => e.id !== id));
  },

  reset() {
    eventStore.reset();
  },
};
