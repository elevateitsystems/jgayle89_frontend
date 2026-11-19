import type { AppUser } from "@/types";

/**
 * DEMO DATA — fictional accounts. The ones listed in `demoAccounts` are documented on the sign-in
 * page so every access level can be tried. Any password (8+ chars) works.
 * Real authentication and authorization arrive with the backend.
 */
export const DEMO_PASSWORD_HINT = "Demo1234";

type Seed = Omit<AppUser, "id" | "status" | "permissions"> & { status?: AppUser["status"]; permissions?: AppUser["permissions"] };

const seeds: Seed[] = [
  { name: "Demo Admin", email: "admin@sitrep.demo", role: "admin", createdAt: "2026-01-05" },
  {
    name: "Sam Rivera", email: "staff@sitrep.demo", role: "staff", userType: "veteran", branch: "Army", createdAt: "2026-02-11",
    permissions: [
      "businesses.manage", "photos.upload", "csv.import", "events.manage",
      "edits.review", "verification.review", "badges.manage", "benefits.manage",
      "sponsorships.review", "advertising.review", "users.manage",
      // Added with the client's 2026-11 update. Category/subcategory/badge-type structure permissions are
      // deliberately NOT granted — those stay admin-only until an administrator grants them (§11D).
      // "Apply service discounts" is also left off so Sam can only *request* discounts (§6).
      "offers.manage", "services.manage", "appointments.manage",
    ],
  },
  { name: "Jordan Lee", email: "photos@sitrep.demo", role: "staff", userType: "civilian", createdAt: "2026-03-02", permissions: ["photos.upload"] },
  { name: "Casey Morgan", email: "events@sitrep.demo", role: "staff", userType: "veteran", branch: "Navy", createdAt: "2026-03-20", permissions: ["events.manage"] },
  { name: "Riley Hart", email: "veteran@sitrep.demo", role: "user", userType: "veteran", branch: "Marine Corps", createdAt: "2026-04-08",
    military: { branch: "Marine Corps", status: "veteran", disabledVeteran: false, combatVeteran: true, purpleHeart: false, serviceStart: "2008-06", serviceEnd: "2016-09", datesApproximate: false },
    location: { city: "Fayetteville", state: "NC", zip: "28301" } },
  { name: "Taylor Brooks", email: "civilian@sitrep.demo", role: "user", userType: "civilian", createdAt: "2026-04-15",
    location: { city: "Colorado Springs", state: "CO", zip: "80903" }, firstResponder: { category: "firefighter" } },
  { name: "Morgan Ellis", email: "morgan.ellis@example.com", role: "user", userType: "veteran", branch: "Air Force", createdAt: "2026-05-03",
    military: { branch: "Air Force", status: "retired", disabledVeteran: true, combatVeteran: false, purpleHeart: false, serviceStart: "1996-01", serviceEnd: "2018-03", datesApproximate: true },
    location: { city: "San Antonio", state: "TX", zip: "78205" } },
  { name: "Devon Patel", email: "devon.patel@example.com", role: "user", userType: "civilian", createdAt: "2026-05-19" },
  { name: "Alex Nguyen", email: "alex.nguyen@example.com", role: "user", userType: "veteran", branch: "Coast Guard", createdAt: "2026-06-12",
    military: { branch: "Coast Guard", status: "reserve", disabledVeteran: false, combatVeteran: false, purpleHeart: false, serviceStart: "2015-08", datesApproximate: false },
    location: { city: "Norfolk", state: "VA", zip: "23510" } },
  { name: "Jamie Ortiz", email: "jamie.ortiz@example.com", role: "user", userType: "civilian", createdAt: "2026-07-01" },
  { name: "Chris Walker", email: "chris.walker@example.com", role: "user", userType: "veteran", branch: "Army", createdAt: "2026-08-22", status: "suspended",
    military: { branch: "Army", status: "national_guard", disabledVeteran: false, combatVeteran: false, purpleHeart: false, serviceStart: "2019-02", datesApproximate: true } },
  { name: "Pat Sullivan", email: "pat.sullivan@example.com", role: "user", userType: "veteran", branch: "Army", createdAt: "2026-09-30",
    military: { branch: "Army", status: "active_duty", disabledVeteran: false, combatVeteran: true, purpleHeart: true, serviceStart: "2012-05", datesApproximate: false },
    location: { city: "Killeen", state: "TX", zip: "76541" }, firstResponder: { category: "ems" } },
  { name: "Robin Kim", email: "robin.kim@example.com", role: "user", userType: "civilian", createdAt: "2026-10-18",
    location: { city: "Tampa", state: "FL", zip: "33611" }, firstResponder: { category: "law_enforcement" } },
  // Business owners. Ids (usr_014…) are referenced by lib/mock-data/business-extras.
  { name: "Jordan Blake", email: "owner@sitrep.demo", role: "user", userType: "business_owner", createdAt: "2026-02-20" },
  { name: "Avery Stone", email: "avery.stone@example.com", role: "user", userType: "business_owner", createdAt: "2026-03-14" },
  { name: "Dana Cruz", email: "dana.cruz@example.com", role: "user", userType: "business_owner", createdAt: "2026-03-29" },
  { name: "Marcus Reed", email: "marcus.reed@example.com", role: "user", userType: "business_owner", createdAt: "2026-05-07" },
];

export const users: AppUser[] = seeds.map((s, i) => ({
  ...s,
  id: `usr_${String(i + 1).padStart(3, "0")}`,
  status: s.status ?? "active",
  permissions: s.permissions ?? [],
}));

/** Accounts advertised on the sign-in page. */
export const demoAccounts = [
  { email: "admin@sitrep.demo", label: "Admin", note: "Full access" },
  { email: "staff@sitrep.demo", label: "Staff", note: "Every staff permission" },
  { email: "veteran@sitrep.demo", label: "Veteran / Military", note: "Registered member" },
  { email: "civilian@sitrep.demo", label: "Civilian", note: "Registered member" },
  { email: "owner@sitrep.demo", label: "Business Owner", note: "Owns three businesses" },
] as const;
