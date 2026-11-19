import { daysFromToday } from "../date.ts";
import type { ServiceListing, ServiceOrder, ServicePromotion } from "../../types/index.ts";

/**
 * DEMO DATA — Additional Services Marketplace (client update §6). Services, prices and promotions are sample
 * values for the preview, not real offers. Plan ids come from lib/mock-data/membership.
 */
const MEMBER_PLANS = ["plan_vet_free", "plan_vet_plus", "plan_vet_pro", "plan_civ_free", "plan_civ_plus", "plan_civ_pro"];
const PAID_MEMBER_PLANS = ["plan_vet_plus", "plan_vet_pro", "plan_civ_plus", "plan_civ_pro"];
const BUSINESS_PLANS = ["plan_biz_free", "plan_biz_growth", "plan_biz_pro", "plan_biz_exec"];

type Seed = Omit<ServiceListing, "id" | "createdAt" | "sortOrder" | "eligiblePlanIds"> & { eligiblePlanIds?: string[] };

const memberSeeds: Seed[] = [
  {
    audience: "member", name: "Professional résumé writing", price: 149, priceUnit: "one-time", availability: "active", image: "/images/team-laptop.jpg",
    shortDescription: "A civilian-ready résumé written with you by a career writer.",
    description: "Work one-on-one with a professional writer to translate your experience into a clear, civilian-ready résumé. Includes one round of revisions.",
    included: ["45-minute intake call", "Professionally written résumé", "One revision round", "Editable Word and PDF files"],
  },
  {
    audience: "member", name: "Career consultation", price: 75, priceUnit: "per session", availability: "active",
    shortDescription: "A one-hour session with a career coach.",
    description: "Talk through your goals, target roles and next steps with an experienced career coach.",
    included: ["60-minute video or phone session", "Written action plan"],
  },
  {
    audience: "member", name: "Interview preparation", price: 95, priceUnit: "per session", availability: "active",
    shortDescription: "Mock interview and feedback for your next opportunity.",
    description: "Practise with a mock interview tailored to the role you're applying for and get structured feedback.",
    included: ["Role-specific mock interview", "Recorded feedback", "Follow-up checklist"],
  },
  {
    audience: "member", name: "Financial planning consultation", price: 120, priceUnit: "per session", availability: "active",
    shortDescription: "Budgeting and planning session with a financial coach.",
    description: "A one-on-one session covering budgeting, savings goals and planning for major purchases.",
    included: ["60-minute session", "Budget worksheet", "Summary of next steps"],
    eligiblePlanIds: PAID_MEMBER_PLANS,
  },
  {
    audience: "member", name: "Certification exam coaching", price: 39, priceUnit: "per month", availability: "coming_soon",
    shortDescription: "Monthly coaching for industry certification exams.",
    description: "Guided study plans and monthly check-ins for popular industry certifications. Coming soon.",
    included: ["Study plan", "Monthly check-in", "Practice resources"],
  },
];

const businessSeeds: Seed[] = [
  {
    audience: "business", name: "Business consulting session", price: 199, priceUnit: "per session", availability: "active", image: "/images/conference.jpg",
    shortDescription: "Strategy session with an experienced business consultant.",
    description: "Review your business goals, operations and growth plans with an experienced consultant.",
    included: ["90-minute session", "Written recommendations"],
  },
  {
    audience: "business", name: "Business financial assessment", price: 349, priceUnit: "one-time", availability: "active",
    shortDescription: "A review of your books, cash flow and pricing.",
    description: "A structured assessment of your financial health with practical recommendations.",
    included: ["Document review", "Cash-flow analysis", "Findings call"],
  },
  {
    audience: "business", name: "Marketing assistance", price: 59, priceUnit: "per month", availability: "active",
    shortDescription: "Monthly help with social posts and promotions.",
    description: "Monthly marketing support: content calendar, social posts and promotion ideas for your listing.",
    included: ["Monthly content calendar", "8 social posts", "Monthly check-in"],
  },
  {
    audience: "business", name: "Grant writing assistance", price: 499, priceUnit: "per application", availability: "coming_soon",
    shortDescription: "Help preparing small-business grant applications.",
    description: "Support identifying and writing grant applications for veteran-owned businesses. Coming soon.",
    included: ["Grant search", "Application drafting", "Final review"],
    eligiblePlanIds: ["plan_biz_growth", "plan_biz_pro", "plan_biz_exec"],
  },
];

export const services: ServiceListing[] = [...memberSeeds, ...businessSeeds].map((s, i) => ({
  ...s,
  id: `svc_${String(i + 1).padStart(3, "0")}`,
  eligiblePlanIds: s.eligiblePlanIds ?? (s.audience === "member" ? MEMBER_PLANS : BUSINESS_PLANS),
  sortOrder: (i + 1) * 10,
  createdAt: daysFromToday(-90 + i),
}));

export const servicePromotions: ServicePromotion[] = [
  { id: "promo_svc_001", name: "Paid member savings", kind: "percent_off", value: 10, couponCode: "", planIds: PAID_MEMBER_PLANS, serviceIds: [], startsOn: daysFromToday(-60), active: true, approval: "approved", createdAt: daysFromToday(-60) },
  { id: "promo_svc_002", name: "Veterans Day coupon", kind: "amount_off", value: 25, couponCode: "SALUTE25", planIds: [], serviceIds: [], startsOn: daysFromToday(-10), endsOn: daysFromToday(20), active: true, approval: "approved", createdAt: daysFromToday(-10) },
  { id: "promo_svc_003", name: "Pro résumé price", kind: "member_price", value: 119, couponCode: "", planIds: ["plan_vet_pro", "plan_civ_pro"], serviceIds: ["svc_001"], startsOn: daysFromToday(-30), active: true, approval: "approved", createdAt: daysFromToday(-30) },
  { id: "promo_svc_004", name: "First month of marketing free", kind: "free_months", value: 1, couponCode: "", planIds: ["plan_biz_pro", "plan_biz_exec"], serviceIds: ["svc_008"], startsOn: daysFromToday(-15), active: true, approval: "approved", createdAt: daysFromToday(-15) },
  { id: "promo_svc_005", name: "Free consulting session (requested)", kind: "free_consultation", value: 0, couponCode: "", planIds: ["plan_biz_exec"], serviceIds: ["svc_006"], startsOn: daysFromToday(0), active: true, approval: "pending", requestedBy: "Casey Morgan", createdAt: daysFromToday(-1) },
];

type OrderSeed = Omit<ServiceOrder, "id" | "createdAt" | "updatedAt" | "notes"> & { daysAgo: number; notes?: string };

const orderSeeds: OrderSeed[] = [
  { serviceId: "svc_001", serviceName: "Professional résumé writing", buyerId: "usr_007", buyerName: "Morgan Ellis", planId: "plan_vet_pro", listPrice: 149, discount: 30, total: 119, promotionId: "promo_svc_003", promotionLabel: "Member price $119", paymentStatus: "paid", status: "completed", assignedTo: "usr_004", scheduledFor: daysFromToday(-20), daysAgo: 30 },
  { serviceId: "svc_002", serviceName: "Career consultation", buyerId: "usr_005", buyerName: "Riley Hart", planId: "plan_vet_plus", listPrice: 75, discount: 7.5, total: 67.5, promotionId: "promo_svc_001", promotionLabel: "10% off", paymentStatus: "paid", status: "scheduled", assignedTo: "usr_002", scheduledFor: daysFromToday(4), daysAgo: 6 },
  { serviceId: "svc_003", serviceName: "Interview preparation", buyerId: "usr_006", buyerName: "Taylor Brooks", planId: "plan_civ_free", listPrice: 95, discount: 25, total: 70, promotionId: "promo_svc_002", promotionLabel: "$25 off", couponCode: "SALUTE25", paymentStatus: "awaiting_payment", status: "pending", daysAgo: 1 },
  { serviceId: "svc_006", serviceName: "Business consulting session", buyerId: "usr_014", buyerName: "Jordan Blake", businessId: "biz_001", planId: "plan_biz_pro", listPrice: 199, discount: 0, total: 199, paymentStatus: "paid", status: "in_progress", assignedTo: "usr_001", scheduledFor: daysFromToday(-2), daysAgo: 12 },
  { serviceId: "svc_008", serviceName: "Marketing assistance", buyerId: "usr_016", buyerName: "Dana Cruz", businessId: "biz_005", planId: "plan_biz_exec", listPrice: 59, discount: 59, total: 0, promotionId: "promo_svc_004", promotionLabel: "One month free", paymentStatus: "waived", status: "in_progress", assignedTo: "usr_004", daysAgo: 9 },
];

export const serviceOrders: ServiceOrder[] = orderSeeds.map(({ daysAgo, notes, ...o }, i) => {
  const at = `${daysFromToday(-daysAgo)}T14:00:00Z`;
  return { ...o, id: `ord_${String(i + 1).padStart(3, "0")}`, notes: notes ?? "", createdAt: at, updatedAt: at };
});
