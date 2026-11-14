import { addDays } from "../date.ts";
import type { BusinessAnalytics } from "../../types/index.ts";

/**
 * DEMO DATA GENERATOR — deterministic fake analytics per business (same id → same numbers),
 * so the owner dashboard looks stable. Replace with the analytics API; the shape is BusinessAnalytics.
 */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SOURCES = ["Directory search", "Category browsing", "Homepage", "Event pages", "Direct / shared link"];
const TERMS = ["veteran owned", "near me", "coffee", "contractor", "open now", "military discount", "hiring veterans", "best rated"];

export function mockAnalytics(businessId: string, rangeDays = 30): BusinessAnalytics {
  const r = rng(hash(businessId));
  const scale = 0.6 + r() * 1.6;
  const series = Array.from({ length: rangeDays }, (_, i) => {
    const wave = 1 + 0.25 * Math.sin(i / 3.2) + i / (rangeDays * 4);
    const views = Math.round((18 + r() * 14) * scale * wave);
    return { label: addDays(-(rangeDays - 1 - i)).slice(5), views, clicks: Math.round(views * (0.08 + r() * 0.07)) };
  });
  const views = series.reduce((n, d) => n + d.views, 0);
  const clicks = series.reduce((n, d) => n + d.clicks, 0);
  const weights = SOURCES.map(() => 0.4 + r());
  const wsum = weights.reduce((a, b) => a + b, 0);
  return {
    rangeDays,
    totals: { views, websiteClicks: clicks, calls: Math.round(clicks * 0.45), directions: Math.round(clicks * 0.6), saves: Math.round(views * 0.03) },
    previous: { views: Math.round(views * (0.82 + r() * 0.2)), websiteClicks: Math.round(clicks * (0.8 + r() * 0.25)) },
    series,
    sources: SOURCES.map((label, i) => ({ label, value: Math.round((weights[i] / wsum) * views) })).sort((a, b) => b.value - a.value),
    searchTerms: TERMS.map((label) => ({ label, value: Math.round((8 + r() * 60) * scale) })).sort((a, b) => b.value - a.value).slice(0, 6),
  };
}
