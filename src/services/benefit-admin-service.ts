import { benefits } from "@/data/benefits";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { daysFromToday } from "@/lib/date";
import { newId, uniqueSlug } from "@/lib/slug";
import { requirePermission, type Reviewer } from "@/services/actor";
import { auditService } from "@/services/audit-service";
import type { Benefit, BenefitAudience, BenefitCategory } from "@/types";

/**
 * Benefits management (demo implementation). The base catalogue (data/benefits) is read-only; staff changes are stored
 * as per-benefit overrides so the original record is never lost. Replace with the benefits admin API.
 */
export interface BenefitOverride {
  id: string; // Benefit.id
  published: boolean;
  /** Removed entries disappear everywhere (base records are kept underneath and can be restored by a demo reset). */
  removed?: boolean;
  title?: string;
  summary?: string;
  description?: string;
  eligibility?: string[];
  sourceUrl?: string;
  applyUrl?: string;
  category?: BenefitCategory;
  audiences?: BenefitAudience[];
  expiresOn?: string;
  dataStatus?: Benefit["dataStatus"];
  lastVerified?: string;
}

export const benefitOverrideStore = createCollectionStore<BenefitOverride>("benefit-overrides", []);

/** Programs staff added themselves (not in the base catalogue). */
export const customBenefitStore = createCollectionStore<Benefit>("benefits-custom", []);

/** Everything staff can set when adding or editing a program. */
export interface BenefitInput {
  title: string;
  summary: string;
  description: string;
  eligibility: string[];
  sourceUrl: string;
  applyUrl?: string;
  category: BenefitCategory;
  audiences: BenefitAudience[];
  /** "" = federal / nationwide. */
  state: string;
  agency: string;
  expiresOn?: string;
}

export interface ManagedBenefit {
  benefit: Benefit;
  published: boolean;
  edited: boolean;
  /** Added by staff rather than part of the base catalogue. */
  custom?: boolean;
}

/** Pure merge of the base catalogue (+ staff-added programs) with overrides. Removed entries are dropped. */
export function mergeBenefits(base: Benefit[], overrides: BenefitOverride[], custom: Benefit[] = []): ManagedBenefit[] {
  const byId = new Map(overrides.map((o) => [o.id, o]));
  return [...base, ...custom].flatMap((b) => {
    const o = byId.get(b.id);
    if (!o) return [{ benefit: b, published: true, edited: false, custom: custom.includes(b) }];
    if (o.removed) return [];
    const { id: _id, published, removed: _r, ...rest } = o;
    void _id;
    void _r;
    const changes = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    return [{ benefit: { ...b, ...changes }, published, edited: Object.keys(changes).length > 0, custom: custom.includes(b) }];
  });
}

export const baseBenefits = benefits;

function upsert(id: string, patch: Partial<BenefitOverride>) {
  const all = benefitOverrideStore.getSnapshot();
  const current = all.find((o) => o.id === id) ?? { id, published: true };
  const next = { ...current, ...patch };
  benefitOverrideStore.set(all.some((o) => o.id === id) ? all.map((o) => (o.id === id ? next : o)) : [...all, next]);
}

export const benefitAdminService = {
  async setPublished(id: string, published: boolean, staff: Reviewer) {
    await delay(250);
    requirePermission(staff, "benefits.manage", "manage benefits");
    upsert(id, { published });
    auditService.record(staff, "benefits", published ? "activated" : "deactivated", { id, name: id });
  },

  /** Records that a person checked the entry against the official source today. */
  async markVerified(id: string, staff: Reviewer) {
    await delay(300);
    requirePermission(staff, "benefits.manage", "verify benefits");
    upsert(id, { dataStatus: "verified", lastVerified: daysFromToday(0) });
  },

  async edit(id: string, patch: Partial<BenefitInput>, staff: Reviewer) {
    await delay(400);
    requirePermission(staff, "benefits.manage", "edit benefits");
    const { state, agency, ...rest } = patch;
    void state;
    void agency;
    // An edited entry has changed since it was last checked, so it goes back to "demo / unverified".
    upsert(id, { ...rest, applyUrl: rest.applyUrl || undefined, expiresOn: rest.expiresOn || undefined, dataStatus: "demo", lastVerified: undefined });
    auditService.record(staff, "benefits", "edited", { id, name: patch.title ?? id });
  },

  async create(input: BenefitInput, staff: Reviewer): Promise<Benefit> {
    await delay(400);
    requirePermission(staff, "benefits.manage", "add benefits");
    const taken = [...baseBenefits, ...customBenefitStore.getSnapshot()].map((b) => b.slug);
    const benefit: Benefit = {
      id: newId("ben"),
      slug: uniqueSlug(input.title, taken),
      title: input.title.trim(),
      category: input.category,
      scope: input.state ? "state" : "federal",
      state: input.state || null,
      agency: input.agency.trim(),
      summary: input.summary.trim(),
      description: input.description.trim(),
      eligibility: input.eligibility,
      howToApply: ["Follow the application instructions on the official page."],
      sourceUrl: input.sourceUrl,
      applyUrl: input.applyUrl || undefined,
      tags: [],
      audiences: input.audiences,
      expiresOn: input.expiresOn || undefined,
      dataStatus: "demo",
    };
    customBenefitStore.set([...customBenefitStore.getSnapshot(), benefit]);
    auditService.record(staff, "benefits", "created", { id: benefit.id, name: benefit.title });
    return benefit;
  },

  /** Remove an outdated program. Staff-added entries are deleted; base entries are hidden from every list. */
  async remove(id: string, staff: Reviewer) {
    await delay(300);
    requirePermission(staff, "benefits.manage", "remove benefits");
    const custom = customBenefitStore.getSnapshot();
    const name = [...baseBenefits, ...custom].find((b) => b.id === id)?.title ?? id;
    if (custom.some((b) => b.id === id)) customBenefitStore.set(custom.filter((b) => b.id !== id));
    else upsert(id, { removed: true, published: false });
    auditService.record(staff, "benefits", "removed", { id, name });
  },

  async resetEntry(id: string, staff: Reviewer) {
    await delay(250);
    requirePermission(staff, "benefits.manage", "manage benefits");
    benefitOverrideStore.set(benefitOverrideStore.getSnapshot().filter((o) => o.id !== id));
  },
};
