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
    permissions: ["businesses.manage", "photos.upload", "csv.import", "events.manage"],
  },
  { name: "Jordan Lee", email: "photos@sitrep.demo", role: "staff", userType: "civilian", createdAt: "2026-03-02", permissions: ["photos.upload"] },
  { name: "Casey Morgan", email: "events@sitrep.demo", role: "staff", userType: "veteran", branch: "Navy", createdAt: "2026-03-20", permissions: ["events.manage"] },
  { name: "Riley Hart", email: "veteran@sitrep.demo", role: "user", userType: "veteran", branch: "Marine Corps", createdAt: "2026-04-08" },
  { name: "Taylor Brooks", email: "civilian@sitrep.demo", role: "user", userType: "civilian", createdAt: "2026-04-15" },
  { name: "Morgan Ellis", email: "morgan.ellis@example.com", role: "user", userType: "veteran", branch: "Air Force", createdAt: "2026-05-03" },
  { name: "Devon Patel", email: "devon.patel@example.com", role: "user", userType: "civilian", createdAt: "2026-05-19" },
  { name: "Alex Nguyen", email: "alex.nguyen@example.com", role: "user", userType: "veteran", branch: "Coast Guard", createdAt: "2026-06-12" },
  { name: "Jamie Ortiz", email: "jamie.ortiz@example.com", role: "user", userType: "civilian", createdAt: "2026-07-01" },
  { name: "Chris Walker", email: "chris.walker@example.com", role: "user", userType: "veteran", branch: "National Guard", createdAt: "2026-08-22", status: "suspended" },
  { name: "Pat Sullivan", email: "pat.sullivan@example.com", role: "user", userType: "veteran", branch: "Army", createdAt: "2026-09-30" },
  { name: "Robin Kim", email: "robin.kim@example.com", role: "user", userType: "civilian", createdAt: "2026-10-18" },
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
  { email: "staff@sitrep.demo", label: "Staff", note: "All four staff permissions" },
  { email: "veteran@sitrep.demo", label: "Veteran / Military", note: "Registered member" },
  { email: "civilian@sitrep.demo", label: "Civilian", note: "Registered member" },
] as const;
