/**
 * Pure advertising rules: derived campaign status, inventory, targeting validation and where a live
 * campaign should appear publicly. Advertising is bought separately from membership — nothing here
 * reads plans or subscriptions except the included-allowance lookup, which is passed in.
 */
import type {
  AdCampaign, AdProduct, CampaignDisplayStatus, CampaignStatus, CampaignTargeting, PromoCredit,
} from "../../types/index.ts";

export const STATUS_LABEL: Record<CampaignDisplayStatus, string> = {
  draft: "Draft",
  pending_review: "In review",
  changes_requested: "Changes requested",
  rejected: "Rejected",
  approved: "Approved · awaiting payment",
  scheduled: "Scheduled",
  active: "Active",
  completed: "Completed",
  expired: "Expired",
};

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** A campaign only runs once staff scheduled it AND it is paid (or covered by credit). */
export const isPaid = (c: Pick<AdCampaign, "paymentStatus">) => c.paymentStatus === "paid" || c.paymentStatus === "credit";

/** The status a person should see "today". `active` is derived, never stored. */
export function displayStatus(c: AdCampaign, today: string): CampaignDisplayStatus {
  if (c.status === "scheduled") {
    if (!isPaid(c)) return "approved"; // scheduled by staff but payment hasn't completed
    if (!c.startDate || !c.endDate) return "scheduled";
    if (today < c.startDate) return "scheduled";
    if (today > c.endDate) return "completed";
    return "active";
  }
  const unlaunched: CampaignStatus[] = ["draft", "pending_review", "changes_requested", "approved"];
  if (unlaunched.includes(c.status) && addDaysISO(c.requestedStart, c.durationDays) < today) return "expired";
  return c.status;
}

export const isLive = (c: AdCampaign, today: string) => displayStatus(c, today) === "active";

export type CampaignGroup = "active" | "pending" | "completed" | "expired" | "rejected";

export function groupOf(s: CampaignDisplayStatus): CampaignGroup {
  if (s === "active") return "active";
  if (s === "completed") return "completed";
  if (s === "expired") return "expired";
  if (s === "rejected") return "rejected";
  return "pending";
}

export const GROUP_LABEL: Record<CampaignGroup, string> = {
  active: "Active", pending: "Pending", completed: "Completed", expired: "Expired", rejected: "Rejected",
};

/** Needs the owner to pay before it can run. */
export const awaitingPayment = (c: AdCampaign) => (c.status === "approved" || c.status === "scheduled") && !isPaid(c);

/** Campaigns that hold one of the product's slots during [start, end]. */
export function slotsUsedDuring(product: AdProduct, campaigns: AdCampaign[], start: string, end: string, excludeId?: string): number {
  return campaigns.filter(
    (c) =>
      c.productId === product.id && c.id !== excludeId && c.status === "scheduled" && c.startDate && c.endDate && c.startDate <= end && c.endDate >= start,
  ).length;
}

export function slotsAvailableOn(product: AdProduct, campaigns: AdCampaign[], date: string, days: number): number {
  return Math.max(0, product.totalSlots - slotsUsedDuring(product, campaigns, date, addDaysISO(date, days)));
}

/** Product-specific targeting rules. Returns an error message, or null when valid. */
export function validateTargeting(product: AdProduct, t: CampaignTargeting): string | null {
  switch (product.targeting) {
    case "category":
      return t.categoryIds.length === 0 ? "Choose at least one category." : null;
    case "geo":
      return t.states.length === 0 ? "Choose at least one state." : null;
    case "event":
      return t.eventId ? null : "Choose the event to sponsor.";
    case "resource":
      return t.resourceId ? null : "Choose the resource to sponsor.";
    default:
      return null;
  }
}

export const credits = {
  /** Unexpired credit balance for a business. */
  balance(list: PromoCredit[], businessId: string, today: string) {
    return list.filter((c) => c.businessId === businessId && c.expiresOn >= today).reduce((n, c) => n + c.remaining, 0);
  },
};

export interface LiveCampaign {
  campaign: AdCampaign;
  product: AdProduct;
}

export function liveCampaigns(campaigns: AdCampaign[], products: AdProduct[], today: string): LiveCampaign[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return campaigns.flatMap((campaign) => {
    const product = byId.get(campaign.productId);
    return product && isLive(campaign, today) ? [{ campaign, product }] : [];
  });
}

export const ofKind = (live: LiveCampaign[], kind: AdProduct["kind"]) => live.filter((l) => l.product.kind === kind);

const norm = (s: string) => s.toLowerCase().trim();

/** Does the typed directory location mention one of the sponsored states / the sponsored city? */
export function geoMatches(location: string, t: CampaignTargeting, stateNames: Record<string, string>): boolean {
  const loc = norm(location);
  if (!loc) return false;
  const tokens = loc.split(/[\s,]+/).filter(Boolean);
  const stateHit = t.states.some((code) => tokens.includes(code.toLowerCase()) || (stateNames[code] && loc.includes(norm(stateNames[code]))));
  const cityHit = !!t.city && loc.includes(norm(t.city));
  return stateHit || cityHit;
}

export interface SearchContext {
  category: string; // "" = all
}

/**
 * Pins sponsored businesses to the top of already-filtered directory results. A sponsor can only
 * appear when the business already matches the visitor's filters, so sponsorship never injects
 * irrelevant listings. Returns the reordered list plus the set of ids that must carry a "Sponsored" label.
 */
export function pinSponsored<T extends { id: string; category: string; state: string }>(
  results: T[],
  live: LiveCampaign[],
  ctx: SearchContext,
): { list: T[]; sponsoredIds: Set<string> } {
  const sponsoredIds = new Set<string>();
  const order: string[] = [];
  const consider = (kind: AdProduct["kind"], extra: (c: AdCampaign) => boolean) => {
    for (const { campaign } of ofKind(live, kind)) {
      const b = results.find((r) => r.id === campaign.businessId);
      if (!b) continue;
      const t = campaign.targeting;
      if (t.categoryIds.length && !t.categoryIds.includes(b.category)) continue;
      if (t.states.length && !t.states.includes(b.state)) continue;
      if (!extra(campaign)) continue;
      if (!sponsoredIds.has(b.id)) order.push(b.id);
      sponsoredIds.add(b.id);
    }
  };
  // Category placements outrank search placements, but only when the visitor is browsing that category.
  consider("featured_category", (c) => !!ctx.category && c.targeting.categoryIds.includes(ctx.category));
  consider("featured_search", () => true);
  if (order.length === 0) return { list: results, sponsoredIds };
  const pinned = order.map((id) => results.find((r) => r.id === id)!);
  return { list: [...pinned, ...results.filter((r) => !sponsoredIds.has(r.id))], sponsoredIds };
}
