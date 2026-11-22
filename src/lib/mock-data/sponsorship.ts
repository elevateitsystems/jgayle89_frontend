import { daysFromToday } from "../date.ts";
import type { PromotionAssignment, SponsorshipAssignment, SponsorshipRequest } from "../../types/index.ts";

/** DEMO DATA — staff-mediated sponsorship requests and assignments. */
export const sponsorshipRequests: SponsorshipRequest[] = [
  {
    id: "sreq_001", businessId: "biz_003", businessName: "Fieldstone Bakehouse", requesterId: "usr_014", requesterName: "Jordan Blake", requesterEmail: "owner@sitrep.demo",
    details: "We would like to learn about sponsoring a community event or newsletter placement for the holiday season.", status: "submitted", createdAt: `${daysFromToday(-1)}T15:00:00Z`, updatedAt: `${daysFromToday(-1)}T15:00:00Z`,
  },
];

export const sponsorshipAssignments: SponsorshipAssignment[] = [
  {
    id: "sassn_001", businessId: "biz_005", businessName: "Bravo Company Builders", packageId: "ap_geo", packageName: "City / State Sponsorship", placement: "Banner on directory searches in the sponsored location",
    startDate: daysFromToday(-4), endDate: daysFromToday(26), status: "active", notes: "Texas directory placement", assignedBy: "Demo Admin", createdAt: `${daysFromToday(-7)}T12:00:00Z`, updatedAt: `${daysFromToday(-4)}T12:00:00Z`,
  },
];

export const promotionAssignments: PromotionAssignment[] = [
  {
    id: "passn_001", businessId: "biz_001", businessName: "Ironwood Coffee Roasters", sourceOfferId: "off_003", promotionTitle: "Holiday bean sale", discountText: "20% off beans", description: "20% off every bag of whole-bean coffee through the holidays.", audience: "Everyone", startDate: daysFromToday(-2), endDate: daysFromToday(9), status: "active", assignedBy: "Demo Admin", createdAt: `${daysFromToday(-4)}T12:00:00Z`, updatedAt: `${daysFromToday(-2)}T12:00:00Z`,
  },
];
