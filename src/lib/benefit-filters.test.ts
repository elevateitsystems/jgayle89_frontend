import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { benefits } from "../data/benefits.ts";
import { US_STATES, stateName } from "../data/us-states.ts";
import {
  buildBenefitIndex,
  countByCategory,
  defaultBenefitFilters,
  filterBenefits,
  paginate,
} from "./benefit-filters.ts";

const index = buildBenefitIndex(benefits, stateName);
const run = (patch: Partial<typeof defaultBenefitFilters>) => filterBenefits(index, { ...defaultBenefitFilters, ...patch });
const federal = benefits.filter((b) => b.scope === "federal");

describe("filterBenefits", () => {
  it("returns every benefit when no filters are set", () => {
    assert.equal(run({}).length, benefits.length);
  });

  it("shows all federal benefits for every state, including states with no state programs", () => {
    for (const s of US_STATES) {
      const slugs = new Set(run({ state: s.code }).map((b) => b.slug));
      for (const f of federal) assert.ok(slugs.has(f.slug), `${f.slug} missing for ${s.code}`);
    }
  });

  it("includes a state's own programs and excludes other states' programs", () => {
    const tx = run({ state: "TX" });
    assert.ok(tx.some((b) => b.slug === "texas-hazlewood-act"));
    assert.ok(tx.every((b) => b.state === null || b.state === "TX"));
    assert.ok(!tx.some((b) => b.slug === "california-calvet-home-loans"));
  });

  it("ranks the selected state's programs ahead of federal ones", () => {
    const tx = run({ state: "TX" });
    const firstFederal = tx.findIndex((b) => b.scope === "federal");
    const lastState = tx.map((b) => b.state).lastIndexOf("TX");
    assert.ok(lastState < firstFederal);
  });

  it("filters by category", () => {
    const res = run({ category: "tax" });
    assert.ok(res.length > 0);
    assert.ok(res.every((b) => b.category === "tax"));
  });

  it("combines state and category", () => {
    const res = run({ state: "VA", category: "education" });
    assert.ok(res.some((b) => b.slug === "virginia-vmsdep"));
    assert.ok(res.some((b) => b.slug === "post-9-11-gi-bill"));
    assert.ok(res.every((b) => b.category === "education" && (b.state === null || b.state === "VA")));
  });

  it("searches title, tags and state names, case-insensitively", () => {
    assert.equal(run({ q: "HAZLEWOOD" })[0].slug, "texas-hazlewood-act");
    assert.ok(run({ q: "va loan" }).some((b) => b.slug === "va-home-loan-guaranty"));
    assert.ok(run({ q: "north carolina" }).some((b) => b.state === "NC"));
  });

  it("requires every keyword to match and returns nothing for gibberish", () => {
    assert.equal(run({ q: "zzzzqqq" }).length, 0);
    assert.equal(run({ q: "hazlewood california" }).length, 0);
  });

  it("ranks title matches above body-only matches", () => {
    const res = run({ q: "pension" });
    assert.equal(res[0].slug, "va-pension");
  });
});

describe("countByCategory", () => {
  it("ignores the category filter but respects state and keyword", () => {
    const counts = countByCategory(index, { q: "", state: "TX", category: "tax" });
    const direct = run({ state: "TX" });
    assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), direct.length);
    assert.equal(counts.education, direct.filter((b) => b.category === "education").length);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i);
  it("slices pages and reports page count", () => {
    const p = paginate(items, 2, 10);
    assert.deepEqual(p.items, [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    assert.equal(p.pageCount, 3);
  });
  it("clamps out-of-range pages", () => {
    assert.equal(paginate(items, 99, 10).page, 3);
    assert.equal(paginate(items, -4, 10).page, 1);
    assert.deepEqual(paginate([], 1, 10), { items: [], page: 1, pageCount: 1, total: 0 });
  });
});
