/** Business badges and the verification workflow. Membership never grants a badge. */

export type BadgeIconKey = "shield-check" | "medal" | "handshake" | "siren" | "percent" | "star" | "flag" | "award";
export type BadgeTone = "olive" | "brass" | "sand" | "slate" | "red";

export interface BusinessBadge {
  id: string;
  name: string;
  description: string;
  /** What staff look for before approving. */
  criteria: string;
  icon: BadgeIconKey;
  tone: BadgeTone;
  active: boolean;
  requiresDocuments: boolean;
  sortOrder: number;
}

export type BadgeAssignmentStatus = "active" | "revoked";

/** A badge a business currently holds (or held). Only staff/admin create these. */
export interface BadgeAssignment {
  id: string;
  businessId: string;
  badgeId: string;
  status: BadgeAssignmentStatus;
  verifiedOn: string; // ISO date
  verifiedBy: string;
  revokedOn?: string;
  revokedBy?: string;
  revokedReason?: string;
}

export type BadgeRequestStatus = "pending" | "approved" | "rejected";

export interface BadgeDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Data URL in the demo; an uploaded file URL once the API exists. */
  url: string;
}

export interface BadgeRequest {
  id: string;
  businessId: string;
  businessName: string;
  badgeId: string;
  requesterId: string;
  requesterName: string;
  status: BadgeRequestStatus;
  note: string;
  documents: BadgeDocument[];
  createdAt: string; // ISO datetime
  reviewerName?: string;
  reviewNote?: string;
  reviewedOn?: string; // ISO date
  /** Date staff recorded the verification (may differ from the review date). */
  verifiedOn?: string;
}
