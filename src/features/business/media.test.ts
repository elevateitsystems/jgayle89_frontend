import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { embedUrl, mediaAllowance, visibleMedia } from "./media.ts";
import { plans } from "../../lib/mock-data/membership.ts";

const plan = (id: string) => plans.find((p) => p.id === id);
const owned = { ownerId: "usr_014" };

describe("business photos & videos by tier (client update §4A)", () => {
  it("Free: logo only — no cover, gallery or videos", () => {
    const a = mediaAllowance(plan("plan_biz_free"), owned);
    assert.deepEqual(a, { governed: true, cover: false, gallery: 0, videos: 0 });
  });
  it("paid tiers add a cover, gallery and videos, with limits from the plan", () => {
    assert.deepEqual(mediaAllowance(plan("plan_biz_growth"), owned), { governed: true, cover: true, gallery: 10, videos: 2 });
    assert.deepEqual(mediaAllowance(plan("plan_biz_exec"), owned), { governed: true, cover: true, gallery: null, videos: null });
  });
  it("hides (but keeps) extras beyond the plan", () => {
    const b = { ...owned, coverImage: "/c.jpg", gallery: ["1", "2", "3"], videos: [{ id: "v", url: "https://x.example", title: "t" }] };
    assert.deepEqual(visibleMedia(b, mediaAllowance(plan("plan_biz_free"), owned)), { cover: null, gallery: [], videos: [] });
    assert.equal(visibleMedia(b, { governed: true, cover: true, gallery: 2, videos: 0 }).gallery.length, 2);
  });
  it("staff-maintained listings without a membership aren't limited", () => {
    assert.equal(mediaAllowance(plan("plan_biz_free"), {}).governed, false);
  });
  it("embeds YouTube and Vimeo only", () => {
    assert.equal(embedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    assert.equal(embedUrl("https://youtu.be/dQw4w9WgXcQ"), "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    assert.equal(embedUrl("https://vimeo.com/123456"), "https://player.vimeo.com/video/123456");
    assert.equal(embedUrl("https://video.example/clip"), null);
    assert.equal(embedUrl("not a url"), null);
  });
});
