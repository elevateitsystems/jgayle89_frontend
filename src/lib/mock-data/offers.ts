import { daysFromToday } from "../date.ts";
import type { BusinessOffer, Freebie } from "../../types/index.ts";

/**
 * DEMO DATA — Freebies & Discounts and business offers. Every company, offer and link below is FICTIONAL
 * (".example" domains); the public page labels them as sample offers. Replace with staff-entered data.
 */
type FreebieSeed = Omit<Freebie, "id" | "createdAt" | "updatedAt" | "active"> & { active?: boolean };

const freebieSeeds: FreebieSeed[] = [
  { slug: "trailmark-veterans-day-meal", title: "Free Veterans Day entrée", company: "Trailmark Grill (sample)", category: "veteran_freebies", summary: "A complimentary entrée from a limited menu for veterans and active-duty service members on Veterans Day.", eligibility: "Veterans and active-duty service members with proof of service.", offerDetails: "1 free entrée, dine-in only", url: "https://trailmarkgrill.example/veterans", expiresOn: daysFromToday(4) },
  { slug: "summit-parks-annual-pass", title: "National park lifetime pass", company: "Summit Outdoor Co. (sample)", category: "veteran_freebies", summary: "A sample listing showing how a free outdoor-access pass for veterans and Gold Star families would appear.", eligibility: "Veterans and Gold Star family members.", offerDetails: "Free pass", url: "https://summitoutdoor.example/pass" },
  { slug: "ironclad-hardware-military-discount", title: "Everyday military discount", company: "Ironclad Hardware (sample)", category: "military_discounts", summary: "10% off most in-store purchases for active-duty, veterans and spouses.", eligibility: "Active-duty, veterans and military spouses with valid ID.", offerDetails: "10% off in store", url: "https://ironcladhardware.example/military" },
  { slug: "northwind-mobile-military-plan", title: "Military phone plan savings", company: "Northwind Mobile (sample)", category: "military_discounts", summary: "Reduced monthly rates on qualifying unlimited plans for service members and veterans.", eligibility: "Service members and veterans; verification required.", offerDetails: "Up to 25% off monthly plans", url: "https://northwindmobile.example/military" },
  { slug: "beacon-fitness-first-responders", title: "First responder gym membership", company: "Beacon Fitness (sample)", category: "first_responder_discounts", summary: "Waived joining fee and a reduced monthly rate for police, fire and EMS.", eligibility: "Law enforcement, firefighters, EMTs and paramedics with department ID.", offerDetails: "$0 joining fee + 20% off monthly", url: "https://beaconfitness.example/heroes", expiresOn: daysFromToday(45) },
  { slug: "redline-auto-first-responder", title: "Service discount for first responders", company: "Redline Auto Service (sample)", category: "first_responder_discounts", summary: "15% off labor on routine maintenance for first responders and veterans.", eligibility: "First responders and veterans.", offerDetails: "15% off labor", url: "https://redlineauto.example/responders" },
  { slug: "keystone-software-corporate", title: "Small-business software bundle", company: "Keystone Software (sample)", category: "corporate_discounts", summary: "Discounted accounting and payroll software for veteran-owned small businesses.", eligibility: "Veteran-owned businesses with a Mission: SITREP listing.", offerDetails: "50% off the first year", url: "https://keystonesoftware.example/veterans", expiresOn: daysFromToday(90) },
  { slug: "harbor-travel-corporate", title: "Corporate travel rates", company: "Harbor Hotels (sample)", category: "corporate_discounts", summary: "Government-style rates at participating hotels for personal leisure travel.", eligibility: "Active-duty, veterans and dependents.", offerDetails: "Up to 15% off best available rate", url: "https://harborhotels.example/military" },
  { slug: "frontline-tax-prep", title: "Complimentary tax preparation", company: "Frontline Tax Help (sample)", category: "complimentary", summary: "Free basic federal return preparation for junior enlisted service members and veterans.", eligibility: "E-1 to E-5 service members and veterans with simple returns.", offerDetails: "Free basic return", url: "https://frontlinetax.example/free", expiresOn: daysFromToday(150) },
  { slug: "liberty-resume-review", title: "Free résumé review", company: "Liberty Careers (sample)", category: "complimentary", summary: "A one-time professional résumé review for transitioning service members.", eligibility: "Service members within 12 months of separation, and veterans.", offerDetails: "1 free review", url: "https://libertycareers.example/review" },
  { slug: "sunrise-coffee-holiday-promo", title: "Holiday gift-card bonus", company: "Sunrise Coffee Co. (sample)", category: "promotional", summary: "Buy a gift card for a service member and get a bonus card for yourself.", eligibility: "Everyone — gift cards must be sent to a service member.", offerDetails: "$10 bonus per $50 gift card", url: "https://sunrisecoffee.example/holiday", expiresOn: daysFromToday(1) },
  { slug: "homefront-moving-other", title: "PCS moving checklist & supplies", company: "Homefront Movers (sample)", category: "other", summary: "Free moving checklist and a supply kit for families on PCS orders.", eligibility: "Military families with PCS orders.", offerDetails: "Free supply kit", url: "https://homefrontmovers.example/pcs" },
  { slug: "expired-summer-promo", title: "Summer camping gear sale", company: "Summit Outdoor Co. (sample)", category: "promotional", summary: "An expired sample offer — kept to show that expired listings are hidden publicly.", eligibility: "Veterans.", offerDetails: "20% off", url: "https://summitoutdoor.example/summer", expiresOn: daysFromToday(-30) },
];

export const freebies: Freebie[] = freebieSeeds.map((f, i) => ({
  ...f,
  id: `fb_${String(i + 1).padStart(3, "0")}`,
  active: f.active ?? true,
  createdAt: daysFromToday(-60 + i),
  updatedAt: daysFromToday(-30 + i),
}));

/** Business offers. Seeded from the previous per-listing promotions plus a few in each workflow state. */
type OfferSeed = Omit<BusinessOffer, "id" | "history" | "createdAt" | "updatedAt">;
const offerSeeds: OfferSeed[] = [
  {
    businessId: "biz_001", title: "Veteran & first responder discount", discountText: "15% off", description: "Show your ID at the bar for 15% off every drink.",
    audience: "veterans_and_first_responders", startsOn: daysFromToday(-40), status: "published", origin: "owner", createdById: "usr_014", createdByName: "Jordan Blake",
    requires: ["staff"], approvedBy: { staff: "Sam Rivera", owner: "Jordan Blake" },
  },
  {
    businessId: "biz_005", title: "Free design consult for veterans", discountText: "Free consult", description: "A complimentary on-site consultation for veterans and first responders.",
    audience: "veterans_and_first_responders", startsOn: daysFromToday(-20), status: "published", origin: "owner", createdById: "usr_016", createdByName: "Dana Cruz",
    requires: ["staff"], approvedBy: { staff: "Sam Rivera", owner: "Dana Cruz" },
  },
  {
    businessId: "biz_001", title: "Holiday bean sale", discountText: "20% off beans", description: "20% off every bag of whole-bean coffee through the holidays.",
    audience: "everyone", startsOn: daysFromToday(-2), expiresOn: daysFromToday(9), status: "published", origin: "staff", createdById: "usr_002", createdByName: "Sam Rivera",
    requires: ["owner"], approvedBy: { staff: "Sam Rivera", owner: "Jordan Blake" },
  },
  {
    businessId: "biz_006", title: "Military family gate special", discountText: "$100 off", description: "$100 off any custom gate for military families.",
    audience: "military_families", startsOn: daysFromToday(0), status: "pending", origin: "owner", createdById: "usr_014", createdByName: "Jordan Blake",
    requires: ["staff"], approvedBy: { owner: "Jordan Blake" },
  },
  {
    businessId: "biz_001", title: "Office coffee trial", discountText: "First month free", description: "A free first month of the office coffee program for veteran-owned businesses.",
    audience: "everyone", startsOn: daysFromToday(3), status: "pending", origin: "staff", createdById: "usr_002", createdByName: "Sam Rivera",
    requires: ["owner"], approvedBy: { staff: "Sam Rivera" },
  },
  {
    businessId: "biz_003", title: "Buy one, get one bread", discountText: "BOGO", description: "Buy one loaf, get one free — every day.",
    audience: "everyone", startsOn: daysFromToday(-5), status: "rejected", origin: "owner", createdById: "usr_014", createdByName: "Jordan Blake",
    requires: ["staff"], approvedBy: { owner: "Jordan Blake" },
    rejectionReason: "Free plan listings can't publish promotions. Upgrade to Growth or above, or contact us to discuss.",
    staffNotes: "Business is on the Free plan (0 promotions). Owner may not have seen the plan limit.",
  },
  {
    businessId: "biz_002", title: "Veterans Day pint", discountText: "Free pint", description: "A free pint for veterans on Veterans Day weekend.",
    audience: "veterans", startsOn: daysFromToday(14), expiresOn: daysFromToday(16), status: "approved", origin: "owner", createdById: "usr_015", createdByName: "Avery Stone",
    requires: ["staff"], approvedBy: { staff: "Sam Rivera", owner: "Avery Stone" },
  },
];

export const businessOffers: BusinessOffer[] = offerSeeds.map((o, i) => {
  const created = `${daysFromToday(-45 + i)}T15:00:00Z`;
  return {
    ...o,
    id: `off_${String(i + 1).padStart(3, "0")}`,
    createdAt: created,
    updatedAt: created,
    history: [
      { at: created, by: o.createdByName, action: "created" },
      ...(o.status === "rejected" ? [{ at: created, by: "Sam Rivera", action: "rejected" as const, note: o.rejectionReason }] : []),
      ...(o.status === "published" || o.status === "approved" ? [{ at: created, by: o.approvedBy.staff ?? o.createdByName, action: "approved" as const }] : []),
    ],
  };
});
