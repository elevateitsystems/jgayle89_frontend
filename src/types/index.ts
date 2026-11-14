import type { Promotion, SocialLink } from "./business-ops";

export * from "./membership";
export * from "./business-ops";
export * from "./badges";
export * from "./advertising";
export * from "./member";

export type ListingStatus = "active" | "pending" | "draft";
export type EventStatus = "published" | "draft";

export type BranchOfService =
  | "Army"
  | "Navy"
  | "Marine Corps"
  | "Air Force"
  | "Space Force"
  | "Coast Guard"
  | "National Guard";

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string; // key into the icon map in lib/category-icons
  image: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  category: string; // Category.id
  tagline: string;
  description: string;
  services: string[];
  keywords: string[];
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  website: string;
  rating: number; // DEMO rating, not a real review score
  reviewCount: number; // DEMO count
  branch: BranchOfService;
  yearFounded: number;
  hours: string;
  coverImage: string;
  profileImage?: string; // optional; a monogram is used when empty
  featured: boolean;
  status: ListingStatus;
  createdAt: string; // ISO date
  /** Reserved for the future Google Places integration; unused by the mock provider. */
  googlePlaceId?: string;
  /** AppUser.id of the owning Business Owner account. Owners can only *request* edits to the listing. */
  ownerId?: string;
  /** Owner-controlled switch (the one listing field owners may change directly). */
  hiring?: boolean;
  /** Public social links. Changes go through the edit-request workflow. */
  socialLinks?: SocialLink[];
  /** Discounts shown on the public profile. Changes go through the edit-request workflow. */
  promotions?: Promotion[];
}

/** A review left on the Mission: SITREP platform itself (not Google). */
export interface Review {
  id: string;
  businessId: string; // Business.id
  author: string;
  rating: number; // 1-5
  title: string;
  body: string;
  createdAt: string; // ISO date
}

/** Aggregate Google rating for a business. `source` tells the UI whether it is real. */
export interface GoogleRatingSummary {
  rating: number; // 0-5
  reviewCount: number;
  source: "mock" | "google-places";
}

/** Platform-wide settings editable from the admin area. */
export interface SiteSettings {
  showGoogleRatings: boolean;
}

export interface CommunityEvent {
  id: string;
  slug: string;
  title: string;
  category: string; // EventCategory
  summary: string;
  description: string;
  agenda: string[];
  date: string; // ISO date (YYYY-MM-DD)
  startTime: string; // "18:00"
  endTime: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  image: string;
  organizer: string;
  price: string; // "Free" or "$15"
  capacity: number;
  registered: number;
  status: EventStatus;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: "business" | "event" | "import" | "user" | "review";
  message: string;
  actor: string;
  time: string; // ISO datetime
}

export interface DashboardStat {
  id: string;
  label: string;
  value: number;
  delta: number; // percent vs previous period
  hint: string;
}

export interface TimeseriesPoint {
  label: string;
  value: number;
}

/** Access level. Admin = everything; Staff = only their assigned permissions; User = registered member. */
export type UserRole = "admin" | "staff" | "user";

/**
 * Registered users are either Veterans/Military or Civilians. This is a profile
 * attribute, NOT a permission role — both get the same standard member access.
 */
export type UserType = "veteran" | "civilian" | "business_owner";

/** Staff permissions. Admins implicitly have all of them; staff only what an admin assigned. */
export type Permission =
  | "businesses.manage"
  | "photos.upload"
  | "csv.import"
  | "events.manage"
  | "edits.review"
  | "verification.review"
  | "badges.manage"
  | "benefits.manage"
  | "sponsorships.review"
  | "advertising.review"
  | "users.manage";

export type UserStatus = "active" | "suspended";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  userType?: UserType;
  branch?: BranchOfService; // veterans / military only
  permissions: Permission[]; // meaningful for staff only; admin has all, user has none
  status: UserStatus;
  createdAt: string; // ISO date
}

export interface ProfileLike {
  name: string;
  /** Self-service sign-up and profile edits only cover members; Business Owner is assigned elsewhere. */
  userType: Exclude<UserType, "business_owner">;
  branch?: BranchOfService;
}

/** What is persisted for "who is signed in" — resolved to an AppUser by useSession. */
export interface SessionRecord {
  userId: string;
}

export type BenefitCategory =
  | "education"
  | "healthcare"
  | "housing"
  | "employment"
  | "disability"
  | "tax"
  | "financial";

export type BenefitScope = "federal" | "state";

/**
 * A veteran assistance program. Federal programs have `state: null` and appear
 * for every state; state programs carry a 2-letter USPS code.
 */
export interface Benefit {
  id: string;
  slug: string;
  title: string;
  category: BenefitCategory;
  scope: BenefitScope;
  state: string | null;
  agency: string;
  summary: string;
  description: string;
  eligibility: string[];
  howToApply: string[];
  sourceUrl: string; // official program page
  applyUrl?: string; // official application page, when distinct
  tags: string[];
  /**
   * "demo" = summary written for the prototype and NOT yet reviewed against the
   * official source; the UI labels it as such. Flip to "verified" (and set
   * `lastVerified`) only after a person has checked the record.
   */
  dataStatus: "demo" | "verified";
  lastVerified?: string; // ISO date
}

export interface UsState {
  code: string; // USPS 2-letter
  name: string;
}
