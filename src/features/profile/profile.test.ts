import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyProfile, firstResponderLabel, formToProfile, identityTags, profileIssues, profileToForm, type ProfileFormValues } from "./profile.ts";
import { users } from "../../data/users.ts";

const STATES = ["NC", "TX", "CA"];
const vet = (patch: Partial<ProfileFormValues> = {}): ProfileFormValues => ({
  name: "Riley Hart", userType: "veteran", ...emptyProfile,
  branch: "Marine Corps", serviceStatus: "veteran", serviceStart: "2008-06", serviceEnd: "2016-09",
  city: "Fayetteville", state: "NC", zip: "28301", ...patch,
});
const paths = (v: ProfileFormValues) => profileIssues(v, "2026-11", STATES).map((i) => i.path);

describe("member profile rules (client update §1)", () => {
  it("accepts a complete veteran profile", () => {
    assert.deepEqual(paths(vet()), []);
  });
  it("requires branch, status, start date and residence for veterans", () => {
    const p = paths(vet({ branch: "", serviceStatus: "", serviceStart: "", city: "", state: "", zip: "" }));
    for (const k of ["branch", "serviceStatus", "serviceStart", "city", "state", "zip"]) assert.ok(p.includes(k as never), k);
  });
  it("only offers the six branches (National Guard is a status)", () => {
    assert.ok(paths(vet({ branch: "National Guard" })).includes("branch"));
    assert.deepEqual(paths(vet({ serviceStatus: "national_guard", serviceEnd: "" })), []);
  });
  it("allows a blank end date and approximate dates, but not impossible ones", () => {
    assert.deepEqual(paths(vet({ serviceEnd: "", datesApproximate: true })), []);
    assert.ok(paths(vet({ serviceEnd: "2001-01" })).includes("serviceEnd"));
    assert.ok(paths(vet({ serviceStart: "2030-01" })).includes("serviceStart"));
    assert.ok(paths(vet({ serviceStart: "2020-13" })).includes("serviceStart"));
  });
  it("lets civilians skip residence, but validates it if started", () => {
    const civ: ProfileFormValues = { name: "Taylor", userType: "civilian", ...emptyProfile };
    assert.deepEqual(paths(civ), []);
    assert.ok(paths({ ...civ, zip: "123" }).includes("zip"));
  });
  it("requires a category when 'I am a First Responder' is ticked", () => {
    assert.ok(paths(vet({ firstResponder: true })).includes("frCategory"));
    assert.ok(paths(vet({ firstResponder: true, frCategory: "other" })).includes("frOther"));
    assert.deepEqual(paths(vet({ firstResponder: true, frCategory: "firefighter" })), []);
  });
  it("round-trips form values through the stored shape", () => {
    const stored = formToProfile(vet({ purpleHeart: true, firstResponder: true, frCategory: "ems" }));
    assert.equal(stored.military?.purpleHeart, true);
    assert.equal(stored.firstResponder?.category, "ems");
    assert.equal(stored.location?.state, "NC");
    const civilian = formToProfile({ name: "T", userType: "civilian", ...emptyProfile, branch: "Army" });
    assert.equal(civilian.military, undefined, "civilians never store military details");
    assert.equal(civilian.branch, undefined);
  });
  it("labels badges from stored profiles", () => {
    const pat = users.find((u) => u.email === "pat.sullivan@example.com")!;
    assert.deepEqual(identityTags(pat), ["Combat Veteran", "Purple Heart"]);
    assert.equal(firstResponderLabel(pat), "EMT / Paramedic");
    assert.equal(profileToForm(pat).serviceStatus, "active_duty");
  });
});
