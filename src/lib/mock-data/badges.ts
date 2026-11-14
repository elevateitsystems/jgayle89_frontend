import type { BadgeAssignment, BadgeRequest, BusinessBadge } from "../../types/index.ts";

/** DEMO DATA — the five badge types, a handful of assignments and a verification queue. */
export const badges: BusinessBadge[] = [
  { id: "badge_verified", name: "Verified Business", description: "Mission: SITREP confirmed this business is real, active and operated by the listed owner.", criteria: "Valid business registration or license, plus a matching owner identity.", icon: "shield-check", tone: "olive", active: true, requiresDocuments: true, sortOrder: 1 },
  { id: "badge_vet_owned", name: "Vet Owned", description: "At least 51% owned by a veteran or service member.", criteria: "Proof of veteran status (e.g. redacted DD-214 or VA letter) and ownership records.", icon: "medal", tone: "brass", active: true, requiresDocuments: true, sortOrder: 2 },
  { id: "badge_vet_friendly", name: "Vet Friendly", description: "Not veteran-owned, but committed to hiring, serving or supporting veterans.", criteria: "A written statement of the veteran-support practices the business follows.", icon: "handshake", tone: "sand", active: true, requiresDocuments: false, sortOrder: 3 },
  { id: "badge_fr_owned", name: "First Responder Owned", description: "At least 51% owned by a police officer, firefighter, EMS professional or dispatcher.", criteria: "Proof of first-responder service and ownership records.", icon: "siren", tone: "red", active: true, requiresDocuments: true, sortOrder: 4 },
  { id: "badge_discount", name: "Vet / First Responder Discount", description: "Offers a standing discount to veterans and first responders.", criteria: "A description of the discount and how customers redeem it.", icon: "percent", tone: "slate", active: true, requiresDocuments: false, sortOrder: 5 },
];

const A = (n: number, businessId: string, badgeId: string, verifiedOn: string): BadgeAssignment => ({
  id: `ba_${String(n).padStart(3, "0")}`, businessId, badgeId, status: "active", verifiedOn, verifiedBy: "Sam Rivera",
});

export const badgeAssignments: BadgeAssignment[] = [
  A(1, "biz_001", "badge_verified", "2026-02-14"), A(2, "biz_001", "badge_vet_owned", "2026-02-14"),
  A(3, "biz_002", "badge_verified", "2026-03-01"), A(4, "biz_002", "badge_vet_owned", "2026-03-01"), A(5, "biz_002", "badge_discount", "2026-04-09"),
  A(6, "biz_003", "badge_verified", "2026-03-18"),
  A(7, "biz_004", "badge_vet_friendly", "2026-04-02"),
  A(8, "biz_005", "badge_verified", "2026-02-20"), A(9, "biz_005", "badge_vet_owned", "2026-02-20"), A(10, "biz_005", "badge_discount", "2026-05-11"),
  A(11, "biz_006", "badge_verified", "2026-03-30"), A(12, "biz_006", "badge_vet_owned", "2026-03-30"),
  A(13, "biz_007", "badge_vet_owned", "2026-04-17"), A(14, "biz_007", "badge_fr_owned", "2026-04-17"),
  A(15, "biz_008", "badge_verified", "2026-05-02"),
  A(16, "biz_009", "badge_verified", "2026-05-09"), A(17, "biz_009", "badge_vet_owned", "2026-05-09"),
  A(18, "biz_010", "badge_verified", "2026-05-21"), A(19, "biz_010", "badge_vet_owned", "2026-05-21"),
  A(20, "biz_011", "badge_vet_owned", "2026-06-03"),
  A(21, "biz_013", "badge_verified", "2026-06-12"), A(22, "biz_013", "badge_fr_owned", "2026-06-12"),
  A(23, "biz_014", "badge_vet_friendly", "2026-06-25"),
  A(24, "biz_016", "badge_fr_owned", "2026-07-08"), A(25, "biz_016", "badge_verified", "2026-07-08"),
  A(26, "biz_018", "badge_discount", "2026-08-14"), A(27, "biz_018", "badge_vet_owned", "2026-08-14"),
  A(28, "biz_020", "badge_verified", "2026-09-05"), A(29, "biz_020", "badge_discount", "2026-09-05"),
];

/** A revoked assignment, so the history/revoked states are visible. */
badgeAssignments.push({
  id: "ba_030", businessId: "biz_017", badgeId: "badge_vet_owned", status: "revoked", verifiedOn: "2026-03-10", verifiedBy: "Sam Rivera",
  revokedOn: "2026-09-22", revokedBy: "Sam Rivera", revokedReason: "Ownership transferred; new owner has not provided documents.",
});

export const badgeRequests: BadgeRequest[] = [
  {
    id: "bq_001", businessId: "biz_003", businessName: "Fieldstone Bakehouse", badgeId: "badge_vet_owned", requesterId: "usr_014", requesterName: "Jordan Blake",
    status: "pending", note: "Owner is a retired Army cook. Attached a redacted DD-214 and the LLC operating agreement.", createdAt: "2026-11-08T15:12:00Z",
    documents: [
      { id: "d1", name: "dd214-redacted.jpg", size: 412000, type: "image/jpeg", url: "/images/flag.jpg" },
      { id: "d2", name: "llc-operating-agreement.pdf", size: 238000, type: "application/pdf", url: "" },
    ],
  },
  {
    id: "bq_002", businessId: "biz_001", businessName: "Ironwood Coffee Roasters", badgeId: "badge_discount", requesterId: "usr_014", requesterName: "Jordan Blake",
    status: "pending", note: "10% off every drink for veterans and first responders with ID.", createdAt: "2026-11-10T09:40:00Z", documents: [],
  },
  {
    id: "bq_003", businessId: "biz_004", businessName: "Oak & Anchor Kitchen", badgeId: "badge_verified", requesterId: "usr_015", requesterName: "Avery Stone",
    status: "pending", note: "Business license and a utility bill for the restaurant address attached.", createdAt: "2026-11-11T18:05:00Z",
    documents: [
      { id: "d3", name: "business-license.jpg", size: 301000, type: "image/jpeg", url: "/images/legal-desk.jpg" },
      { id: "d4", name: "utility-bill.pdf", size: 120000, type: "application/pdf", url: "" },
    ],
  },
  {
    id: "bq_004", businessId: "biz_005", businessName: "Bravo Company Builders", badgeId: "badge_discount", requesterId: "usr_016", requesterName: "Dana Cruz",
    status: "approved", note: "Free design consult for veterans and first responders.", createdAt: "2026-05-08T12:00:00Z", documents: [],
    reviewerName: "Sam Rivera", reviewedOn: "2026-05-11", verifiedOn: "2026-05-11", reviewNote: "Confirmed by phone with the owner.",
  },
  {
    id: "bq_005", businessId: "biz_012", businessName: "Northstar Web & Software", badgeId: "badge_fr_owned", requesterId: "usr_017", requesterName: "Marcus Reed",
    status: "rejected", note: "Owner is a former paramedic.", createdAt: "2026-09-14T10:30:00Z",
    documents: [{ id: "d5", name: "certificate.pdf", size: 98000, type: "application/pdf", url: "" }],
    reviewerName: "Sam Rivera", reviewedOn: "2026-09-16", reviewNote: "The certificate shows training but not current or former service. Please resubmit with employment records.",
  },
];
