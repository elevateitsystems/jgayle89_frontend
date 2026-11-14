import { benefits } from "@/data/benefits";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { daysFromToday } from "@/lib/date";
import { requirePermission, type Reviewer } from "@/services/actor";
import type { Benefit } from "@/types";

/**
 * Benefits management (demo implementation). The base catalogue (data/benefits) is read-only; staff changes are stored
 * as per-benefit overrides so the original record is never lost. Replace with the benefits admin API.
 */
export interface BenefitOverride {
  id: string; // Benefit.id
  published: boolean;
  title?: string;
  summary?: string;
  sourceUrl?: string;
  dataStatus?: Benefit["dataStatus"];
  lastVerified?: string;
}

export const benefitOverrideStore = createCollectionStore<BenefitOverride>("benefit-overrides", []);

export interface ManagedBenefit {
  benefit: Benefit;
  published: boolean;
  edited: boolean;
}

/** Pure merge of the base catalogue with overrides. */
export function mergeBenefits(base: Benefit[], overrides: BenefitOverride[]): ManagedBenefit[] {
  const byId = new Map(overrides.map((o) => [o.id, o]));
  return base.map((b) => {
    const o = byId.get(b.id);
    if (!o) return { benefit: b, published: true, edited: false };
    const { id: _id, published, ...rest } = o;
    void _id;
    const changes = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    return { benefit: { ...b, ...changes }, published, edited: Object.keys(changes).length > 0 };
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
  },

  /** Records that a person checked the entry against the official source today. */
  async markVerified(id: string, staff: Reviewer) {
    await delay(300);
    requirePermission(staff, "benefits.manage", "verify benefits");
    upsert(id, { dataStatus: "verified", lastVerified: daysFromToday(0) });
  },

  async edit(id: string, patch: { title: string; summary: string; sourceUrl: string }, staff: Reviewer) {
    await delay(400);
    requirePermission(staff, "benefits.manage", "edit benefits");
    // An edited entry has changed since it was last checked, so it goes back to "demo / unverified".
    upsert(id, { ...patch, dataStatus: "demo", lastVerified: undefined });
  },

  async resetEntry(id: string, staff: Reviewer) {
    await delay(250);
    requirePermission(staff, "benefits.manage", "manage benefits");
    benefitOverrideStore.set(benefitOverrideStore.getSnapshot().filter((o) => o.id !== id));
  },
};
