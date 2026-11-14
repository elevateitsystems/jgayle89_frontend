/** Business-owner tooling: social links, promotions, the edit-request workflow and analytics. */
import type { Business } from "./index";

export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "youtube" | "website";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  /** Free-text name, used for "other website" links. */
  label?: string;
}

export type PromotionAudience = "veterans" | "first_responders" | "everyone";

export interface Promotion {
  id: string;
  title: string;
  discountText: string; // "10% off"
  description: string;
  audience: PromotionAudience;
  validUntil?: string; // ISO date
}

export type EditRequestStatus = "pending" | "approved" | "rejected" | "changes_requested";

/** Listing fields an owner may ask staff to change. Everything else is staff-only. */
export interface EditableBusinessFields {
  name: string;
  tagline: string;
  description: string;
  services: string[];
  phone: string;
  email: string;
  website: string;
  hours: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  socialLinks: SocialLink[];
  promotions: Promotion[];
}

export type EditableFieldKey = keyof EditableBusinessFields;
export type BusinessChanges = Partial<EditableBusinessFields>;

export interface EditAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Data URL in the demo; an uploaded file URL once the API exists. */
  url: string;
}

export interface EditReviewEvent {
  at: string; // ISO datetime
  by: string;
  action: "submitted" | "resubmitted" | "approved" | "rejected" | "changes_requested";
  note?: string;
}

export interface BusinessEditRequest {
  id: string;
  businessId: string;
  businessName: string;
  requesterId: string;
  requesterName: string;
  status: EditRequestStatus;
  /** Why the owner wants the change. */
  reason: string;
  /** Snapshot of the current values for the fields being changed. */
  before: BusinessChanges;
  /** Proposed values. Applied to the listing only when staff approve. */
  changes: BusinessChanges;
  attachments: EditAttachment[];
  createdAt: string; // ISO datetime
  updatedAt: string;
  reviewerName?: string;
  reviewNote?: string;
  history: EditReviewEvent[];
}

export interface BusinessAnalytics {
  rangeDays: number;
  totals: { views: number; websiteClicks: number; calls: number; directions: number; saves: number };
  /** Previous-period totals, used for the trend delta. */
  previous: { views: number; websiteClicks: number };
  series: { label: string; views: number; clicks: number }[];
  sources: { label: string; value: number }[];
  searchTerms: { label: string; value: number }[];
}

export type { Business };
