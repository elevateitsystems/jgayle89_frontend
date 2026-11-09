import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_SECTIONS,
  ALL_PERMISSION_IDS,
  adminAccessState,
  hasPermission,
  homePathFor,
  safeNextPath,
  sanitizePermissions,
  sectionForPath,
  visibleAdminSections,
} from "./permissions.ts";
import type { Permission } from "../types/index.ts";

const admin = { role: "admin", permissions: [] as Permission[] } as const;
const staff = (permissions: Permission[]) => ({ role: "staff", permissions }) as const;
const member = { role: "user", permissions: [] as Permission[] } as const;

const ids = (u: Parameters<typeof visibleAdminSections>[0]) => visibleAdminSections(u).map((s) => s.id);

describe("hasPermission", () => {
  it("admin has every permission without needing them assigned", () => {
    for (const p of ALL_PERMISSION_IDS) assert.equal(hasPermission(admin, p), true);
  });
  it("staff only have what they were assigned", () => {
    const s = staff(["photos.upload"]);
    assert.equal(hasPermission(s, "photos.upload"), true);
    assert.equal(hasPermission(s, "businesses.manage"), false);
    assert.equal(hasPermission(s, "events.manage"), false);
    assert.equal(hasPermission(s, "csv.import"), false);
  });
  it("registered users and guests never have staff permissions, even if the field is tampered with", () => {
    assert.equal(hasPermission({ role: "user", permissions: ["businesses.manage"] }, "businesses.manage"), false);
    assert.equal(hasPermission(null, "businesses.manage"), false);
    assert.equal(hasPermission(undefined, "events.manage"), false);
  });
});

describe("navigation per access group", () => {
  it("admin sees every section", () => {
    assert.deepEqual(ids(admin), ADMIN_SECTIONS.map((s) => s.id));
  });
  it("staff with all four permissions see management sections but never administrator-only ones", () => {
    const all = staff([...ALL_PERMISSION_IDS]);
    assert.deepEqual(ids(all), ["dashboard", "businesses", "photos", "events", "import"]);
  });
  it("limited staff see only the dashboard plus what they were granted", () => {
    assert.deepEqual(ids(staff(["photos.upload"])), ["dashboard", "photos"]);
    assert.deepEqual(ids(staff(["events.manage"])), ["dashboard", "events"]);
    assert.deepEqual(ids(staff([])), ["dashboard"]);
  });
  it("registered users and guests see no admin sections", () => {
    assert.deepEqual(ids(member), []);
    assert.deepEqual(ids(null), []);
  });
});

describe("route protection", () => {
  it("maps nested paths to their section (longest prefix)", () => {
    assert.equal(sectionForPath("/admin")?.id, "dashboard");
    assert.equal(sectionForPath("/admin/")?.id, "dashboard");
    assert.equal(sectionForPath("/admin/businesses/new")?.id, "businesses");
    assert.equal(sectionForPath("/admin/businesses/biz_001/edit")?.id, "businesses");
    assert.equal(sectionForPath("/admin/staff")?.id, "staff");
    assert.equal(sectionForPath("/admin/businessesX"), undefined);
  });

  it("guests are told to sign in, members are denied by role", () => {
    assert.equal(adminAccessState(null, "/admin"), "signed-out");
    assert.equal(adminAccessState(member, "/admin"), "forbidden-role");
    assert.equal(adminAccessState(member, "/admin/staff"), "forbidden-role");
  });

  it("staff are denied sections outside their permissions, including admin-only ones", () => {
    const s = staff(["events.manage"]);
    assert.equal(adminAccessState(s, "/admin"), "allowed");
    assert.equal(adminAccessState(s, "/admin/events"), "allowed");
    assert.equal(adminAccessState(s, "/admin/businesses"), "forbidden-permission");
    assert.equal(adminAccessState(s, "/admin/businesses/new"), "forbidden-permission");
    assert.equal(adminAccessState(s, "/admin/import"), "forbidden-permission");
    for (const p of ["/admin/users", "/admin/staff", "/admin/categories", "/admin/settings"]) {
      assert.equal(adminAccessState(s, p), "forbidden-permission", p);
    }
  });

  it("admin can open everything", () => {
    for (const s of ADMIN_SECTIONS) assert.equal(adminAccessState(admin, s.href), "allowed", s.href);
  });

  it("unknown /admin paths fall back to the dashboard rule", () => {
    assert.equal(adminAccessState(staff([]), "/admin/does-not-exist"), "allowed");
    assert.equal(adminAccessState(member, "/admin/does-not-exist"), "forbidden-role");
  });
});

describe("permissions registry", () => {
  it("only offers Phase 1 permissions and drops future/unknown ones", () => {
    assert.deepEqual([...ALL_PERMISSION_IDS].sort(), ["businesses.manage", "csv.import", "events.manage", "photos.upload"]);
    assert.deepEqual(sanitizePermissions(["events.manage", "orders.manage", "appointments.manage", "resources.manage", "nope"]), ["events.manage"]);
  });
});

describe("post-login routing", () => {
  it("sends back-office users to the dashboard and members to the directory", () => {
    assert.equal(homePathFor(admin), "/admin");
    assert.equal(homePathFor(staff([])), "/admin");
    assert.equal(homePathFor(member), "/directory");
  });
  it("only follows same-site relative `next` paths", () => {
    assert.equal(safeNextPath("/admin/events"), "/admin/events");
    assert.equal(safeNextPath("//evil.example"), null);
    assert.equal(safeNextPath("https://evil.example"), null);
    assert.equal(safeNextPath("/\\evil.example"), null);
    assert.equal(safeNextPath(""), null);
    assert.equal(safeNextPath(null), null);
  });
});
