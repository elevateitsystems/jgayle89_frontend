/** Freebies & Discounts directory entries, and per-business offers with an approval workflow. */

export type FreebieCategory =
  | "veteran_freebies"
  | "military_discounts"
  | "first_responder_discounts"
  | "corporate_discounts"
  | "complimentary"
  | "promotional"
  | "other";

/** A national/corporate offer in the public Freebies & Discounts directory (staff-managed). */
export interface Freebie {
  id: string;
  slug: string;
  title: string;
  company: string;
  category: FreebieCategory;
  summary: string;
  eligibility: string;
  offerDetails: string; // "15% off", "Free entrée on Veterans Day"
  url: string;
  expiresOn?: string; // ISO date
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OfferAudience = "veterans" | "first_responders" | "veterans_and_first_responders" | "military_families" | "everyone";

/** Who has to approve an offer before it can go live. */
export type ApprovalRule = "staff" | "owner" | "both";

export interface OfferApprovalSettings {
  /** Offers a business owner submits themselves. */
  ownerSubmitted: ApprovalRule;
  /** Offers staff create on a business's behalf. */
  staffCreated: ApprovalRule;
}

/**
 * Pending   — waiting for one or more required approvals.
 * Approved  — every approval is in, but the start date hasn't arrived.
 * Published — approved and live on the public profile.
 * Rejected  — declined by staff or the owner.
 * Inactive  — switched off by staff (kept for history).
 */
export type OfferStatus = "pending" | "approved" | "published" | "rejected" | "inactive";

export interface OfferHistoryEvent {
  at: string; // ISO datetime
  by: string; // display name
  action: "created" | "updated" | "approved" | "rejected" | "deactivated" | "reactivated" | "talk_requested";
  note?: string;
}

export interface BusinessOffer {
  id: string;
  businessId: string;
  title: string;
  discountText: string; // "15% off"
  description: string;
  audience: OfferAudience;
  startsOn: string; // ISO date
  /** Temporary deals show a public countdown until this date (end of day). */
  expiresOn?: string;
  status: OfferStatus;
  origin: "owner" | "staff";
  createdById: string;
  createdByName: string;
  /** Approvals this offer still needs, frozen from the admin rule at submission time. */
  requires: ("staff" | "owner")[];
  approvedBy: { staff?: string; owner?: string };
  /** Shown to the business owner when rejected. */
  rejectionReason?: string;
  /** Internal staff-only notes — never shown to the business. */
  staffNotes?: string;
  /** Owner asked to talk to staff about a rejection. */
  talkRequested?: boolean;
  history: OfferHistoryEvent[];
  createdAt: string;
  updatedAt: string;
}
