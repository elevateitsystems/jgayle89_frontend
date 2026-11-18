/**
 * Member profile rules (client update §1): military details, First Responder option and residence.
 * Pure module — the forms, the services and the tests all use it. The API must apply the same validation.
 */
import { MEMBER_BRANCHES } from "../../types/profile.ts";
import type { AppUser, FirstResponderCategory, MemberBranch, ProfileLike, ServiceStatus } from "../../types/index.ts";

export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  veteran: "Veteran",
  active_duty: "Active Duty",
  reserve: "Reserve",
  national_guard: "National Guard",
  retired: "Retired",
};
export const SERVICE_STATUSES = Object.keys(SERVICE_STATUS_LABEL) as ServiceStatus[];

export const FIRST_RESPONDER_LABEL: Record<FirstResponderCategory, string> = {
  law_enforcement: "Law Enforcement",
  firefighter: "Firefighter",
  ems: "EMT / Paramedic",
  other: "Other",
};
export const FIRST_RESPONDER_CATEGORIES = Object.keys(FIRST_RESPONDER_LABEL) as FirstResponderCategory[];

/** Still serving: an end date isn't expected. */
export const isCurrentlyServing = (s: string) => s === "active_duty" || s === "reserve" || s === "national_guard";

/** Flat shape used by the registration and profile forms. */
export interface ProfileFormValues {
  name: string;
  userType: "veteran" | "civilian";
  branch: string;
  serviceStatus: string;
  disabledVeteran: boolean;
  combatVeteran: boolean;
  purpleHeart: boolean;
  serviceStart: string; // "YYYY-MM"
  serviceEnd: string; // "YYYY-MM" or ""
  datesApproximate: boolean;
  city: string;
  state: string;
  zip: string;
  firstResponder: boolean;
  frCategory: string;
  frOther: string;
}

export const emptyProfile: Omit<ProfileFormValues, "name" | "userType"> = {
  branch: "", serviceStatus: "", disabledVeteran: false, combatVeteran: false, purpleHeart: false,
  serviceStart: "", serviceEnd: "", datesApproximate: false, city: "", state: "", zip: "",
  firstResponder: false, frCategory: "", frOther: "",
};

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const ZIP = /^\d{5}(-\d{4})?$/;

export interface ProfileIssue {
  path: keyof ProfileFormValues;
  message: string;
}

/**
 * Field-level problems. Veterans must give military details and residence; dates may be estimates.
 * `currentMonth` is "YYYY-MM" (passed in so tests are deterministic).
 */
export function profileIssues(v: ProfileFormValues, currentMonth: string, stateCodes: readonly string[]): ProfileIssue[] {
  const out: ProfileIssue[] = [];
  const add = (path: keyof ProfileFormValues, message: string) => out.push({ path, message });
  const veteran = v.userType === "veteran";

  if (veteran) {
    if (!(MEMBER_BRANCHES as readonly string[]).includes(v.branch)) add("branch", "Select your branch of service");
    if (!SERVICE_STATUSES.includes(v.serviceStatus as ServiceStatus)) add("serviceStatus", "Select your service status");
    if (!MONTH.test(v.serviceStart)) add("serviceStart", "Enter a month and year (your best estimate is fine)");
    else if (v.serviceStart > currentMonth) add("serviceStart", "The start date can't be in the future");
    if (v.serviceEnd) {
      if (!MONTH.test(v.serviceEnd)) add("serviceEnd", "Enter a month and year, or leave blank");
      else if (MONTH.test(v.serviceStart) && v.serviceEnd < v.serviceStart) add("serviceEnd", "The end date can't be before the start date");
    }
  }

  // Residence: required for veterans (drives "benefits in your state"); optional for civilians.
  const anyLocation = !!(v.city.trim() || v.state || v.zip.trim());
  if (veteran || anyLocation) {
    if (v.city.trim().length < 2) add("city", "Enter your city");
    if (!stateCodes.includes(v.state)) add("state", "Select your state");
    if (!ZIP.test(v.zip.trim())) add("zip", "Enter a 5-digit ZIP code");
  }

  if (v.firstResponder) {
    if (!FIRST_RESPONDER_CATEGORIES.includes(v.frCategory as FirstResponderCategory)) add("frCategory", "Choose your first responder category");
    else if (v.frCategory === "other" && v.frOther.trim().length < 2) add("frOther", "Tell us your first responder role");
  }
  return out;
}

/** Form values → what the user service stores. */
export function formToProfile(v: ProfileFormValues): ProfileLike {
  const veteran = v.userType === "veteran";
  const hasLocation = !!(v.city.trim() && v.state && v.zip.trim());
  return {
    name: v.name.trim(),
    userType: v.userType,
    branch: veteran ? (v.branch as MemberBranch) : undefined,
    military: veteran
      ? {
          branch: v.branch as MemberBranch,
          status: v.serviceStatus as ServiceStatus,
          disabledVeteran: v.disabledVeteran,
          combatVeteran: v.combatVeteran,
          purpleHeart: v.purpleHeart,
          serviceStart: v.serviceStart,
          serviceEnd: v.serviceEnd || undefined,
          datesApproximate: v.datesApproximate,
        }
      : undefined,
    location: hasLocation ? { city: v.city.trim(), state: v.state, zip: v.zip.trim() } : undefined,
    firstResponder: v.firstResponder
      ? { category: v.frCategory as FirstResponderCategory, otherLabel: v.frCategory === "other" ? v.frOther.trim() : undefined }
      : undefined,
  };
}

/** A stored user → form values for the profile page. */
export function profileToForm(u: AppUser): ProfileFormValues {
  const m = u.military;
  return {
    name: u.name,
    userType: u.userType === "veteran" ? "veteran" : "civilian",
    branch: m?.branch ?? ((MEMBER_BRANCHES as readonly string[]).includes(u.branch ?? "") ? (u.branch as string) : ""),
    serviceStatus: m?.status ?? "",
    disabledVeteran: m?.disabledVeteran ?? false,
    combatVeteran: m?.combatVeteran ?? false,
    purpleHeart: m?.purpleHeart ?? false,
    serviceStart: m?.serviceStart ?? "",
    serviceEnd: m?.serviceEnd ?? "",
    datesApproximate: m?.datesApproximate ?? false,
    city: u.location?.city ?? "",
    state: u.location?.state ?? "",
    zip: u.location?.zip ?? "",
    firstResponder: !!u.firstResponder,
    frCategory: u.firstResponder?.category ?? "",
    frOther: u.firstResponder?.otherLabel ?? "",
  };
}

/** Short labels for the identity badges shown on profiles and in admin lists. */
export function identityTags(u: Pick<AppUser, "military" | "firstResponder">): string[] {
  const tags: string[] = [];
  if (u.military?.disabledVeteran) tags.push("Disabled Veteran");
  if (u.military?.combatVeteran) tags.push("Combat Veteran");
  if (u.military?.purpleHeart) tags.push("Purple Heart");
  return tags;
}

export function firstResponderLabel(u: Pick<AppUser, "firstResponder">): string | null {
  const fr = u.firstResponder;
  if (!fr) return null;
  return fr.category === "other" && fr.otherLabel ? fr.otherLabel : FIRST_RESPONDER_LABEL[fr.category];
}
