/** Member profile details collected at registration and editable in profile settings. */

/** Branches offered on the member form (National Guard is a service *status*, not a branch, for members). */
export const MEMBER_BRANCHES = ["Army", "Navy", "Marine Corps", "Air Force", "Space Force", "Coast Guard"] as const;
export type MemberBranch = (typeof MEMBER_BRANCHES)[number];

export type ServiceStatus = "veteran" | "active_duty" | "reserve" | "national_guard" | "retired";

export interface MilitaryProfile {
  branch: MemberBranch;
  status: ServiceStatus;
  disabledVeteran: boolean;
  combatVeteran: boolean;
  purpleHeart: boolean;
  /** "YYYY-MM". */
  serviceStart: string;
  /** "YYYY-MM"; empty while still serving. */
  serviceEnd?: string;
  /** The member gave their best estimate rather than exact dates. */
  datesApproximate: boolean;
}

export type FirstResponderCategory = "law_enforcement" | "firefighter" | "ems" | "other";

export interface FirstResponderProfile {
  category: FirstResponderCategory;
  /** Free text when category is "other". */
  otherLabel?: string;
}

export interface MemberLocation {
  city: string;
  state: string; // USPS code
  zip: string;
}
