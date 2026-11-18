/**
 * Freebies & Discounts and business-offer rules (client update §2B, §4C). Pure — no React or storage.
 * The API must apply the same approval and visibility rules; this only drives the UI and the demo services.
 */
import type {
  ApprovalRule, BusinessOffer, Freebie, FreebieCategory, OfferAudience, OfferStatus,
} from "../../types/index.ts";

export const FREEBIE_CATEGORY_LABEL: Record<FreebieCategory, string> = {
  veteran_freebies: "Veteran freebies",
  military_discounts: "Military discounts",
  first_responder_discounts: "First responder discounts",
  corporate_discounts: "Corporate discounts",
  complimentary: "Complimentary products & services",
  promotional: "Promotional offers",
  other: "Other programs",
};
export const FREEBIE_CATEGORIES = Object.keys(FREEBIE_CATEGORY_LABEL) as FreebieCategory[];

export const OFFER_AUDIENCE_LABEL: Record<OfferAudience, string> = {
  veterans: "For veterans & military",
  first_responders: "For first responders",
  veterans_and_first_responders: "For veterans & first responders",
  military_families: "For military families",
  everyone: "For everyone",
};

// ───────────── Freebies directory ─────────────

/** Live publicly: switched on and not past its expiration date (`today` is an ISO date). */
export const isFreebieLive = (f: Freebie, today: string) => f.active && (!f.expiresOn || f.expiresOn >= today);

export function filterFreebies(list: Freebie[], f: { q: string; category: string }, today: string): Freebie[] {
  const tokens = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  return list
    .filter((x) => isFreebieLive(x, today))
    .filter((x) => !f.category || x.category === f.category)
    .filter((x) => {
      if (tokens.length === 0) return true;
      const hay = `${x.title} ${x.company} ${x.summary} ${x.eligibility} ${x.offerDetails} ${FREEBIE_CATEGORY_LABEL[x.category]}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    })
    // Ending soonest first (so time-limited deals aren't missed), then alphabetical.
    .sort((a, b) => (a.expiresOn ?? "9999").localeCompare(b.expiresOn ?? "9999") || a.title.localeCompare(b.title));
}

// ───────────── Business offers & approvals ─────────────

/**
 * Approvals an offer still needs. Whoever submits it counts as approving their own side:
 * an owner submitting under "staff" needs staff; staff creating under "owner" needs the owner; "both" needs the other side.
 */
export function requiredApprovals(rule: ApprovalRule, origin: "owner" | "staff"): ("staff" | "owner")[] {
  const needed: ("staff" | "owner")[] = rule === "both" ? ["staff", "owner"] : [rule];
  return needed.filter((side) => side !== origin);
}

/** The status an offer should have once its approvals change. */
export function statusAfterApprovals(o: Pick<BusinessOffer, "requires" | "approvedBy" | "startsOn" | "status">, today: string): OfferStatus {
  if (o.status === "rejected" || o.status === "inactive") return o.status;
  const outstanding = o.requires.filter((side) => !o.approvedBy[side]);
  if (outstanding.length > 0) return "pending";
  return o.startsOn > today ? "approved" : "published";
}

export type OfferDisplayStatus = OfferStatus | "expired";

/** What to show right now: approved offers go live on their start date; finished deals show as expired. */
export function offerDisplayStatus(o: Pick<BusinessOffer, "status" | "startsOn" | "expiresOn">, today: string): OfferDisplayStatus {
  if (o.status === "rejected" || o.status === "inactive" || o.status === "pending") return o.status;
  if (o.expiresOn && o.expiresOn < today) return "expired";
  if (o.status === "approved" && o.startsOn <= today) return "published";
  return o.status;
}

export const isOfferLive = (o: BusinessOffer, today: string) => offerDisplayStatus(o, today) === "published";

/** Offers that count against the business plan's "Discounts & promotions" allowance. */
export const countsAgainstAllowance = (o: BusinessOffer, today: string) => {
  const s = offerDisplayStatus(o, today);
  return s === "pending" || s === "approved" || s === "published";
};

/** Which side still has to act, for "Awaiting staff / owner approval" labels. */
export const awaitingFrom = (o: Pick<BusinessOffer, "requires" | "approvedBy" | "status">) =>
  o.status === "pending" ? o.requires.filter((side) => !o.approvedBy[side]) : [];

// ───────────── Countdown for temporary deals ─────────────

export interface Countdown {
  ended: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Time left until the end of the offer's last day (local time). */
export function countdownTo(expiresOn: string, now: Date): Countdown {
  const [y, m, d] = expiresOn.split("-").map(Number);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  const ms = end - now.getTime();
  if (ms <= 0) return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const s = Math.floor(ms / 1000);
  return { ended: false, days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}
