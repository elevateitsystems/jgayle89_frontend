import type { MembershipPlan, PlanAudience, PlanFeatureDef, PlanFeatureValue } from "../../types/index.ts";

/**
 * DEMO DATA — the single source of truth for membership plans and features.
 * No component hardcodes a plan name, price or feature; everything is derived from here
 * (via the plan store in services/membership-service). Replace with API data later.
 */

export const AUDIENCE_LABEL: Record<PlanAudience, string> = {
  veteran: "Veteran / Military",
  civilian: "Civilian",
  business: "Business",
};

const V: PlanAudience[] = ["veteran"];
const C: PlanAudience[] = ["civilian"];
const M: PlanAudience[] = ["veteran", "civilian"];
const B: PlanAudience[] = ["business"];

export const featureDefs: PlanFeatureDef[] = [
  // ----- Members: community
  { id: "directory_search", label: "Business directory search", description: "Search and filter every public listing.", audiences: M, kind: "toggle", group: "Community", essential: true },
  { id: "community_resources", label: "Community resources", description: "Local and national community resource listings.", audiences: M, kind: "toggle", group: "Community", essential: true },
  { id: "saved_businesses", label: "Saved businesses", description: "Bookmark businesses to find them again.", audiences: M, kind: "limit", unit: "businesses", group: "Community" },
  { id: "event_early_access", label: "Early event registration", description: "Register for events 48 hours before the public.", audiences: M, kind: "toggle", group: "Community" },
  { id: "member_discounts", label: "Member-only partner discounts", description: "Discounts from participating businesses.", audiences: M, kind: "toggle", group: "Community" },
  { id: "volunteer_matching", label: "Volunteer matching", description: "Get matched with veteran-serving organizations.", audiences: C, kind: "toggle", group: "Community" },
  // ----- Members: benefits & career
  { id: "benefits_directory", label: "Benefits directory", description: "Browse federal and state veteran benefits.", audiences: V, kind: "toggle", group: "Benefits & career", essential: true },
  { id: "benefits_alerts", label: "Benefit change alerts", description: "Email alerts when a program you follow changes.", audiences: V, kind: "toggle", group: "Benefits & career" },
  { id: "benefits_review", label: "Benefits review sessions", description: "One-on-one review of the programs you may qualify for.", audiences: V, kind: "limit", unit: "per year", group: "Benefits & career" },
  { id: "career_basic", label: "Career resource library", description: "Résumé guides, job boards and transition checklists.", audiences: M, kind: "toggle", group: "Benefits & career", essential: true },
  { id: "career_coaching", label: "Career coaching sessions", description: "Sessions with a volunteer career coach.", audiences: V, kind: "limit", unit: "per month", group: "Benefits & career" },
  // ----- Members: financial
  { id: "financial_basic", label: "Basic financial tools", description: "Budget and payment calculators.", audiences: M, kind: "toggle", group: "Financial", essential: true },
  { id: "financial_advanced", label: "Advanced financial tools", description: "Home-loan, retirement and debt-payoff planners.", audiences: M, kind: "toggle", group: "Financial" },
  { id: "education_courses", label: "Financial education courses", description: "Self-paced courses on credit, saving and investing.", audiences: C, kind: "toggle", group: "Financial" },
  // ----- Members: support
  { id: "appointments", label: "Advisor appointments", description: "Appointments with Mission: SITREP advisors.", audiences: V, kind: "limit", unit: "per month", group: "Support" },
  { id: "priority_support", label: "Priority support", description: "Jump the queue when you contact support.", audiences: [...M, ...B], kind: "toggle", group: "Support" },
  // ----- Business: listing
  { id: "business_listing", label: "Public business listing", description: "Your business appears in the public directory.", audiences: B, kind: "toggle", group: "Listing", essential: true },
  { id: "business_photos", label: "Business photos", description: "Photos shown on your listing.", audiences: B, kind: "limit", unit: "photos", group: "Listing" },
  { id: "social_links", label: "Social media links", description: "Links shown on your public profile (changes are reviewed by staff).", audiences: B, kind: "limit", unit: "links", group: "Listing" },
  { id: "promotions", label: "Discounts & promotions", description: "Active promotions shown on your profile (reviewed by staff).", audiences: B, kind: "limit", unit: "active", group: "Listing" },
  { id: "featured_credits", label: "Featured listing credits", description: "Credits redeemable for featured placements each month.", audiences: B, kind: "limit", unit: "per month", group: "Visibility" },
  // ----- Business: insights
  { id: "analytics_basic", label: "Analytics: profile views & clicks", description: "Totals for the last 30 days.", audiences: B, kind: "toggle", group: "Insights" },
  { id: "analytics_trends", label: "Analytics: daily trends", description: "Day-by-day charts and period comparison.", audiences: B, kind: "toggle", group: "Insights" },
  { id: "analytics_insights", label: "Analytics: traffic sources & searches", description: "Where visitors come from and what they search for.", audiences: B, kind: "toggle", group: "Insights" },
  { id: "analytics_export", label: "Analytics export", description: "Download analytics as CSV.", audiences: B, kind: "toggle", group: "Insights" },
];

export const featureById = new Map(featureDefs.map((f) => [f.id, f]));
export const featuresFor = (audience: PlanAudience) => featureDefs.filter((f) => f.audiences.includes(audience));

/** Builds a plan's feature map: `on` = enabled toggles, `limits` = enabled limit features (null = unlimited). */
function feat(audience: PlanAudience, on: string[], limits: Record<string, number | null>): Record<string, PlanFeatureValue> {
  const out: Record<string, PlanFeatureValue> = {};
  for (const f of featuresFor(audience)) {
    if (f.kind === "limit") {
      const has = f.id in limits;
      out[f.id] = { enabled: has && limits[f.id] !== 0, limit: has ? limits[f.id] : 0 };
    } else {
      out[f.id] = { enabled: on.includes(f.id), limit: null };
    }
  }
  return out;
}

const essentialsFor = (a: PlanAudience) => featuresFor(a).filter((f) => f.essential && f.kind === "toggle").map((f) => f.id);

type PlanSeed = Omit<MembershipPlan, "createdAt" | "stripe" | "adAllowances" | "active" | "highlighted"> & {
  highlighted?: boolean;
  adAllowances?: Record<string, number>;
};

const seeds: PlanSeed[] = [
  // ----- Veteran / Military
  {
    id: "plan_vet_free", audience: "veteran", name: "Free", sortOrder: 1, monthlyPrice: 0, annualPrice: 0,
    tagline: "Everything you need to find veteran-owned businesses.",
    description: "Free for every veteran and service member. Directory search, benefits directory and community resources are always free.",
    features: feat("veteran", essentialsFor("veteran"), { saved_businesses: 10, appointments: 1, career_coaching: 0, benefits_review: 0 }),
  },
  {
    id: "plan_vet_plus", audience: "veteran", name: "Plus", sortOrder: 2, monthlyPrice: 4.99, annualPrice: 49, highlighted: true,
    tagline: "Alerts, discounts and more advisor time.",
    description: "Stay ahead of benefit changes, unlock partner discounts and get early access to community events.",
    features: feat("veteran", [...essentialsFor("veteran"), "benefits_alerts", "event_early_access", "member_discounts", "financial_advanced"], { saved_businesses: 50, appointments: 3, career_coaching: 1, benefits_review: 0 }),
  },
  {
    id: "plan_vet_pro", audience: "veteran", name: "Pro", sortOrder: 3, monthlyPrice: 9.99, annualPrice: 99,
    tagline: "Hands-on help with benefits, career and money.",
    description: "Everything in Plus with benefits reviews, regular coaching and priority support.",
    features: feat("veteran", [...essentialsFor("veteran"), "benefits_alerts", "event_early_access", "member_discounts", "financial_advanced", "priority_support"], { saved_businesses: null, appointments: 8, career_coaching: 2, benefits_review: 2 }),
  },
  // ----- Civilian
  {
    id: "plan_civ_free", audience: "civilian", name: "Free", sortOrder: 1, monthlyPrice: 0, annualPrice: 0,
    tagline: "Support veteran-owned businesses in your community.",
    description: "Free for every supporter. Directory search and community resources are always free.",
    features: feat("civilian", essentialsFor("civilian"), { saved_businesses: 10, appointments: 1, career_coaching: 0 }),
  },
  {
    id: "plan_civ_plus", audience: "civilian", name: "Plus", sortOrder: 2, monthlyPrice: 5.99, annualPrice: 59, highlighted: true,
    tagline: "Discounts, early event access and courses.",
    description: "Partner discounts, early event registration, volunteer matching and financial education courses.",
    features: feat("civilian", [...essentialsFor("civilian"), "event_early_access", "member_discounts", "volunteer_matching", "financial_advanced", "education_courses"], { saved_businesses: 50, appointments: 3, career_coaching: 1 }),
  },
  {
    id: "plan_civ_pro", audience: "civilian", name: "Pro", sortOrder: 3, monthlyPrice: 11.99, annualPrice: 119,
    tagline: "Coaching and priority support.",
    description: "Everything in Plus with more advisor time, regular coaching and priority support.",
    features: feat("civilian", [...essentialsFor("civilian"), "event_early_access", "member_discounts", "volunteer_matching", "financial_advanced", "education_courses", "priority_support"], { saved_businesses: null, appointments: 8, career_coaching: 2 }),
  },
  // ----- Business
  {
    id: "plan_biz_free", audience: "business", name: "Free", sortOrder: 1, monthlyPrice: 0, annualPrice: 0,
    tagline: "A public listing in the directory.",
    description: "Every business gets a public listing. Verification badges are earned through review, never purchased.",
    features: feat("business", [...essentialsFor("business"), "analytics_basic"], { business_photos: 3, social_links: 2, promotions: 0, featured_credits: 0 }),
  },
  {
    id: "plan_biz_growth", audience: "business", name: "Growth", sortOrder: 2, monthlyPrice: 29, annualPrice: 290, highlighted: true,
    tagline: "More photos, links and daily analytics.",
    description: "For businesses ready to showcase their work and understand their audience.",
    adAllowances: { ap_featured_search: 1 },
    features: feat("business", [...essentialsFor("business"), "analytics_basic", "analytics_trends"], { business_photos: 10, social_links: 5, promotions: 1, featured_credits: 1 }),
  },
  {
    id: "plan_biz_pro", audience: "business", name: "Pro", sortOrder: 3, monthlyPrice: 79, annualPrice: 790,
    tagline: "Insights and advertising allowances.",
    description: "Traffic-source insights, promotions and included advertising placements every month.",
    adAllowances: { ap_featured_search: 2, ap_featured_category: 1 },
    features: feat("business", [...essentialsFor("business"), "analytics_basic", "analytics_trends", "analytics_insights", "priority_support"], { business_photos: 25, social_links: 5, promotions: 3, featured_credits: 3 }),
  },
  {
    id: "plan_biz_exec", audience: "business", name: "Executive", sortOrder: 4, monthlyPrice: 199, annualPrice: 1990,
    tagline: "The full toolkit for established businesses.",
    description: "Unlimited photos and promotions, data export, priority support and the largest advertising allowance.",
    adAllowances: { ap_featured_search: 3, ap_featured_category: 2, ap_homepage_featured: 1, ap_newsletter: 1 },
    features: feat("business", [...essentialsFor("business"), "analytics_basic", "analytics_trends", "analytics_insights", "analytics_export", "priority_support"], { business_photos: null, social_links: null, promotions: null, featured_credits: 6 }),
  },
];

export const plans: MembershipPlan[] = seeds.map((s) => ({
  adAllowances: {},
  highlighted: false,
  ...s,
  active: true,
  stripe: { monthlyPriceId: null, annualPriceId: null },
  createdAt: "2026-01-05",
}));
