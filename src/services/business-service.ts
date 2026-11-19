import { businesses as seed } from "@/data/businesses";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { newId, uniqueSlug } from "@/lib/slug";
import { auditService } from "@/services/audit-service";
import type { AppUser, Business } from "@/types";

/** The employee making the change — feeds the "added / updated by each employee" admin reports. */
type Actor = Pick<AppUser, "id" | "name">;
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Business data-access layer (demo implementation).
 * Swap the bodies for `fetch("/api/businesses…")` calls when the Django REST
 * API is ready — signatures are already async and return plain objects.
 */
export const businessStore = createCollectionStore<Business>("businesses", seed);

export type BusinessInput = Omit<Business, "id" | "createdAt" | "slug"> & { slug?: string };

export const businessService = {
  async list(): Promise<Business[]> {
    await delay(200);
    return businessStore.getSnapshot();
  },

  async getBySlug(slug: string): Promise<Business | undefined> {
    await delay(150);
    return businessStore.getSnapshot().find((b) => b.slug === slug);
  },

  async getById(id: string): Promise<Business | undefined> {
    await delay(150);
    return businessStore.getSnapshot().find((b) => b.id === id);
  },

  async create(input: BusinessInput, actor?: Actor): Promise<Business> {
    await delay(500);
    const all = businessStore.getSnapshot();
    const business: Business = {
      ...input,
      id: newId("biz"),
      slug: uniqueSlug(input.slug || input.name, all.map((b) => b.slug)),
      createdAt: today(),
      ...(actor ? { createdBy: actor.id } : {}),
    };
    businessStore.set([business, ...all]);
    if (actor) auditService.record(actor, "businesses", "added listing", { id: business.id, name: business.name });
    return business;
  },

  async createMany(inputs: BusinessInput[], actor?: Actor): Promise<Business[]> {
    await delay(700);
    const all = businessStore.getSnapshot();
    const taken = all.map((b) => b.slug);
    const created = inputs.map((input) => {
      const slug = uniqueSlug(input.slug || input.name, taken);
      taken.push(slug);
      return {
        ...input,
        slug,
        id: newId("biz"),
        createdAt: today(),
        ...(actor ? { createdBy: actor.id } : {}),
      } satisfies Business;
    });
    businessStore.set([...created, ...all]);
    if (actor) created.forEach((b) => auditService.record(actor, "businesses", "added listing", { id: b.id, name: b.name }, "CSV import"));
    return created;
  },

  async update(id: string, patch: Partial<BusinessInput>, actor?: Actor): Promise<Business> {
    await delay(500);
    const all = businessStore.getSnapshot();
    const current = all.find((b) => b.id === id);
    if (!current) throw new Error("Business not found");
    const others = all.filter((b) => b.id !== id).map((b) => b.slug);
    const slug = patch.slug ? uniqueSlug(patch.slug, others) : current.slug;
    const next: Business = { ...current, ...patch, slug, ...(actor ? { updatedBy: actor.id, updatedAt: today() } : {}) };
    businessStore.set(all.map((b) => (b.id === id ? next : b)));
    if (actor) auditService.record(actor, "businesses", "updated listing", { id, name: next.name });
    return next;
  },

  /**
   * Hiring status is the ONE listing field an owner may change directly (it needs no review).
   * Everything else goes through the edit-request workflow.
   */
  async setHiring(id: string, ownerId: string, hiring: boolean): Promise<Business> {
    await delay(250);
    const all = businessStore.getSnapshot();
    const current = all.find((b) => b.id === id);
    if (!current) throw new Error("Business not found");
    if (current.ownerId !== ownerId) throw new Error("You can only change hiring status for businesses you own.");
    const next: Business = { ...current, hiring };
    businessStore.set(all.map((b) => (b.id === id ? next : b)));
    return next;
  },

  async remove(id: string): Promise<void> {
    await delay(350);
    businessStore.set(businessStore.getSnapshot().filter((b) => b.id !== id));
  },

  reset() {
    businessStore.reset();
  },
};
