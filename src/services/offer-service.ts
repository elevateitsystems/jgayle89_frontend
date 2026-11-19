import { createCollectionStore, delay } from "@/lib/demo-store";
import { todayISO } from "@/lib/date";
import { businessOffers as seedOffers, freebies as seedFreebies } from "@/lib/mock-data/offers";
import { newId, uniqueSlug } from "@/lib/slug";
import { countsAgainstAllowance, requiredApprovals, statusAfterApprovals } from "@/features/offers/rules";
import { requirePermission, type Requester, type Reviewer } from "@/services/actor";
import { auditService } from "@/services/audit-service";
import { businessStore } from "@/services/business-service";
import { settingsService } from "@/services/settings-service";
import type { BusinessOffer, Freebie, OfferAudience, OfferHistoryEvent } from "@/types";

/**
 * Freebies & Discounts directory and business offers (demo implementation). Swap the bodies for API calls;
 * the API must re-check permissions, ownership, plan allowances and the approval rule on every write.
 */
export const freebieStore = createCollectionStore<Freebie>("freebies", seedFreebies);
export const offerStore = createCollectionStore<BusinessOffer>("business-offers", seedOffers);

export type FreebieInput = Omit<Freebie, "id" | "slug" | "createdAt" | "updatedAt">;

export const freebieService = {
  async create(input: FreebieInput, staff: Reviewer): Promise<Freebie> {
    await delay(400);
    requirePermission(staff, "offers.manage", "add freebies and discounts");
    const all = freebieStore.getSnapshot();
    const now = todayISO();
    const f: Freebie = { ...input, id: newId("fb"), slug: uniqueSlug(input.title, all.map((x) => x.slug)), expiresOn: input.expiresOn || undefined, createdAt: now, updatedAt: now };
    freebieStore.set([f, ...all]);
    auditService.record(staff, "freebies", "created", { id: f.id, name: f.title });
    return f;
  },
  async update(id: string, input: Partial<FreebieInput>, staff: Reviewer): Promise<void> {
    await delay(350);
    requirePermission(staff, "offers.manage", "edit freebies and discounts");
    const all = freebieStore.getSnapshot();
    const current = all.find((x) => x.id === id);
    if (!current) throw new Error("Listing not found.");
    freebieStore.set(all.map((x) => (x.id === id ? { ...x, ...input, expiresOn: (input.expiresOn ?? x.expiresOn) || undefined, updatedAt: todayISO() } : x)));
    const action = input.active === undefined || Object.keys(input).length > 1 ? "edited" : input.active ? "activated" : "deactivated";
    auditService.record(staff, "freebies", action, { id, name: current.title });
  },
  async remove(id: string, staff: Reviewer): Promise<void> {
    await delay(300);
    requirePermission(staff, "offers.manage", "remove freebies and discounts");
    const current = freebieStore.getSnapshot().find((x) => x.id === id);
    freebieStore.set(freebieStore.getSnapshot().filter((x) => x.id !== id));
    auditService.record(staff, "freebies", "removed", { id, name: current?.title ?? id });
  },
  reset() {
    freebieStore.reset();
  },
};

export interface OfferInput {
  title: string;
  discountText: string;
  description: string;
  audience: OfferAudience;
  startsOn: string;
  expiresOn?: string;
}

const nowIso = () => new Date().toISOString();

function save(o: BusinessOffer) {
  const all = offerStore.getSnapshot();
  offerStore.set(all.some((x) => x.id === o.id) ? all.map((x) => (x.id === o.id ? o : x)) : [o, ...all]);
  return o;
}

function find(id: string) {
  const o = offerStore.getSnapshot().find((x) => x.id === id);
  if (!o) throw new Error("Offer not found.");
  return o;
}

function event(by: string, action: OfferHistoryEvent["action"], note?: string): OfferHistoryEvent {
  return { at: nowIso(), by, action, ...(note ? { note } : {}) };
}

const businessName = (id: string) => businessStore.getSnapshot().find((b) => b.id === id)?.name ?? id;

function assertOwner(businessId: string, owner: Requester) {
  const b = businessStore.getSnapshot().find((x) => x.id === businessId);
  if (!b || b.ownerId !== owner.id) throw new Error("You can only manage offers for your own business.");
}

/** Fresh submission (or resubmission after an edit): the approval rule in Admin → Settings decides who must approve. */
function submit(base: Omit<BusinessOffer, "status" | "requires" | "approvedBy">, origin: "owner" | "staff", actorName: string): BusinessOffer {
  const rule = settingsService.get().offerApproval[origin === "owner" ? "ownerSubmitted" : "staffCreated"];
  const requires = requiredApprovals(rule, origin);
  const approvedBy = origin === "owner" ? { owner: actorName } : { staff: actorName };
  const draft = { ...base, requires, approvedBy, status: "pending" as const, rejectionReason: undefined, talkRequested: false };
  return { ...draft, status: statusAfterApprovals(draft, todayISO()) };
}

export const offerService = {
  /** Allowance check for the business plan's "Discounts & promotions" limit (null = unlimited). */
  activeCount(businessId: string, excludeId?: string) {
    const today = todayISO();
    return offerStore.getSnapshot().filter((o) => o.businessId === businessId && o.id !== excludeId && countsAgainstAllowance(o, today)).length;
  },

  /** A business owner submits a new offer for their own business. */
  async submitByOwner(businessId: string, input: OfferInput, owner: Requester, limit: number | null): Promise<BusinessOffer> {
    await delay(450);
    assertOwner(businessId, owner);
    if (limit !== null && offerService.activeCount(businessId) >= limit) throw new Error(`Your plan allows ${limit} active offer${limit === 1 ? "" : "s"}.`);
    const now = nowIso();
    return save(submit({
      id: newId("off"), businessId, ...input, expiresOn: input.expiresOn || undefined, origin: "owner", createdById: owner.id, createdByName: owner.name,
      history: [event(owner.name, "created")], createdAt: now, updatedAt: now,
    }, "owner", owner.name));
  },

  /** Staff create an offer on a business's behalf. */
  async createByStaff(businessId: string, input: OfferInput, staff: Reviewer): Promise<BusinessOffer> {
    await delay(450);
    requirePermission(staff, "offers.manage", "create business offers");
    const now = nowIso();
    const o = save(submit({
      id: newId("off"), businessId, ...input, expiresOn: input.expiresOn || undefined, origin: "staff", createdById: staff.id, createdByName: staff.name,
      history: [event(staff.name, "created")], createdAt: now, updatedAt: now,
    }, "staff", staff.name));
    auditService.record(staff, "offers", "created", { id: o.id, name: `${o.title} · ${businessName(businessId)}` });
    return o;
  },

  /** Editing an offer resubmits it — the changed version needs approval again before it's public. */
  async update(id: string, input: OfferInput, actor: Reviewer | Requester, side: "owner" | "staff"): Promise<BusinessOffer> {
    await delay(400);
    const current = find(id);
    if (side === "owner") assertOwner(current.businessId, actor);
    else requirePermission(actor as Reviewer, "offers.manage", "edit business offers");
    const o = save(submit({ ...current, ...input, expiresOn: input.expiresOn || undefined, updatedAt: nowIso(), history: [...current.history, event(actor.name, "updated")] }, side, actor.name));
    if (side === "staff") auditService.record(actor, "offers", "edited", { id, name: o.title });
    return o;
  },

  async approve(id: string, side: "owner" | "staff", actor: Reviewer | Requester, note?: string): Promise<BusinessOffer> {
    await delay(350);
    const current = find(id);
    if (side === "owner") assertOwner(current.businessId, actor);
    else requirePermission(actor as Reviewer, "offers.manage", "approve business offers");
    if (current.status !== "pending") throw new Error("Only pending offers can be approved.");
    const next = { ...current, approvedBy: { ...current.approvedBy, [side]: actor.name }, updatedAt: nowIso(), history: [...current.history, event(actor.name, "approved", note)] };
    const o = save({ ...next, status: statusAfterApprovals(next, todayISO()) });
    if (side === "staff") auditService.record(actor, "offers", "approved", { id, name: o.title });
    return o;
  },

  /** `reason` is shown to the business; `staffNotes` are internal and never shown to the owner. */
  async reject(id: string, side: "owner" | "staff", actor: Reviewer | Requester, reason: string, staffNotes?: string): Promise<BusinessOffer> {
    await delay(350);
    const current = find(id);
    if (side === "owner") assertOwner(current.businessId, actor);
    else requirePermission(actor as Reviewer, "offers.manage", "reject business offers");
    if (current.status !== "pending") throw new Error("Only pending offers can be rejected.");
    const o = save({
      ...current, status: "rejected", rejectionReason: reason.trim(), staffNotes: side === "staff" ? staffNotes?.trim() || current.staffNotes : current.staffNotes,
      updatedAt: nowIso(), history: [...current.history, event(actor.name, "rejected", reason.trim())],
    });
    if (side === "staff") auditService.record(actor, "offers", "rejected", { id, name: o.title }, reason);
    return o;
  },

  /** Owner asks to speak with staff about a rejected offer. */
  async requestTalk(id: string, owner: Requester): Promise<void> {
    await delay(300);
    const current = find(id);
    assertOwner(current.businessId, owner);
    save({ ...current, talkRequested: true, updatedAt: nowIso(), history: [...current.history, event(owner.name, "talk_requested")] });
  },

  async setStaffNotes(id: string, notes: string, staff: Reviewer): Promise<void> {
    await delay(250);
    requirePermission(staff, "offers.manage", "edit staff notes");
    const current = find(id);
    save({ ...current, staffNotes: notes.trim() || undefined, updatedAt: nowIso() });
  },

  async setActive(id: string, active: boolean, staff: Reviewer): Promise<void> {
    await delay(300);
    requirePermission(staff, "offers.manage", active ? "reactivate offers" : "deactivate offers");
    const current = find(id);
    const next = active
      ? { ...current, status: "pending" as const, history: [...current.history, event(staff.name, "reactivated")] }
      : { ...current, status: "inactive" as const, history: [...current.history, event(staff.name, "deactivated")] };
    save({ ...next, status: active ? statusAfterApprovals(next, todayISO()) : "inactive", updatedAt: nowIso() });
    auditService.record(staff, "offers", active ? "reactivated" : "deactivated", { id, name: current.title });
  },

  async remove(id: string, staff: Reviewer): Promise<void> {
    await delay(300);
    requirePermission(staff, "offers.manage", "remove offers");
    const current = find(id);
    offerStore.set(offerStore.getSnapshot().filter((o) => o.id !== id));
    auditService.record(staff, "offers", "removed", { id, name: current.title });
  },

  reset() {
    offerStore.reset();
  },
};
