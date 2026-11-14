import type { Promotion, SocialLink } from "../../types/index.ts";

/**
 * DEMO DATA — ownership, hiring status, social links and promotions layered onto the base
 * business seeds (data/businesses.ts) by slug. `ownerId` values are AppUser ids from data/users.ts.
 */
export interface BusinessExtra {
  ownerId?: string;
  hiring?: boolean;
  socialLinks?: SocialLink[];
  promotions?: Promotion[];
}

export const businessExtras: Record<string, BusinessExtra> = {
  // Jordan Blake (owner@sitrep.demo) — three businesses on Pro, Free and Growth
  "ironwood-coffee-roasters": {
    ownerId: "usr_014",
    hiring: true,
    socialLinks: [
      { platform: "facebook", url: "https://facebook.com/ironwoodcoffee.example" },
      { platform: "instagram", url: "https://instagram.com/ironwoodcoffee.example" },
      { platform: "website", url: "https://ironwoodcoffee.example/wholesale", label: "Wholesale portal" },
    ],
    promotions: [
      { id: "promo_001", title: "Veteran & first responder discount", discountText: "10% off", description: "Show your ID at the bar for 10% off every drink.", audience: "veterans" },
    ],
  },
  "fieldstone-bakehouse": {
    ownerId: "usr_014",
    hiring: false,
    socialLinks: [
      { platform: "facebook", url: "https://facebook.com/fieldstonebakehouse.example" },
      { platform: "instagram", url: "https://instagram.com/fieldstonebakehouse.example" },
    ],
  },
  "sparkline-welding-fabrication": {
    ownerId: "usr_014",
    hiring: true,
    socialLinks: [{ platform: "linkedin", url: "https://linkedin.com/company/sparkline-welding.example" }, { platform: "youtube", url: "https://youtube.com/@sparklinewelding.example" }],
  },
  // Avery Stone
  "summit-rally-brewing": {
    ownerId: "usr_015",
    hiring: true,
    socialLinks: [{ platform: "instagram", url: "https://instagram.com/summitrally.example" }],
  },
  "oak-and-anchor-kitchen": { ownerId: "usr_015", hiring: false, socialLinks: [{ platform: "facebook", url: "https://facebook.com/oakandanchor.example" }] },
  // Dana Cruz
  "bravo-company-builders": {
    ownerId: "usr_016",
    hiring: true,
    socialLinks: [
      { platform: "facebook", url: "https://facebook.com/bravocompanybuilders.example" },
      { platform: "linkedin", url: "https://linkedin.com/company/bravo-company-builders.example" },
      { platform: "youtube", url: "https://youtube.com/@bravobuilders.example" },
    ],
    promotions: [
      { id: "promo_002", title: "Free design consult for veterans", discountText: "Free consult", description: "A complimentary on-site consultation for veterans and first responders.", audience: "veterans" },
    ],
  },
  "fortitude-financial-planning": { ownerId: "usr_016", hiring: false, socialLinks: [{ platform: "linkedin", url: "https://linkedin.com/company/fortitude-financial.example" }] },
  // Marcus Reed
  "vector-cyber-solutions": { ownerId: "usr_017", hiring: true, socialLinks: [{ platform: "linkedin", url: "https://linkedin.com/company/vector-cyber.example" }] },
  "northstar-web-software": { ownerId: "usr_017", hiring: true, socialLinks: [] },
  // Not owner-managed (staff-maintained listings) — still shows hiring/social on a couple
  "ranger-strength-conditioning": { hiring: true, socialLinks: [{ platform: "instagram", url: "https://instagram.com/rangerstrength.example" }] },
  "trailhead-outfitters": { hiring: false, socialLinks: [{ platform: "facebook", url: "https://facebook.com/trailheadoutfitters.example" }, { platform: "youtube", url: "https://youtube.com/@trailhead.example" }] },
  "torque-and-tread-auto-care": { hiring: true },
};
