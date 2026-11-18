import type { Business, BusinessVideo } from "../../types/index.ts";

/**
 * DEMO DATA — category structure, media and "who added it" layered onto the base business seeds by slug
 * (client update §4A, §7B, §11). Subcategory ids come from data/categories (`sub-…`). Employee ids are
 * staff/admin AppUser ids from data/users.ts. Videos are placeholder links on ".example" domains, so they
 * render as links rather than embeds.
 */
export interface BusinessStructure {
  subcategories?: string[];
  secondaryCategories?: string[];
  gallery?: string[];
  videos?: BusinessVideo[];
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
  listingKind?: Business["listingKind"];
}

const g = (...names: string[]) => names.map((n) => `/images/${n}.jpg`);

export const businessStructure: Record<string, BusinessStructure> = {
  "ironwood-coffee-roasters": { subcategories: ["sub-cafes"], gallery: g("cafe", "coffee", "friends", "market"), videos: [{ id: "vid_001", title: "Inside the roastery", url: "https://video.example/ironwood-roastery" }], createdBy: "usr_002", updatedBy: "usr_002", updatedAt: "2026-11-12" },
  "summit-rally-brewing": { subcategories: ["sub-breweries", "sub-restaurants"], gallery: g("brewery", "restaurant-dining"), createdBy: "usr_002", updatedBy: "usr_001", updatedAt: "2026-10-30" },
  "fieldstone-bakehouse": { subcategories: ["sub-bakeries", "sub-catering"], gallery: g("bakery"), createdBy: "usr_001" },
  "oak-and-anchor-kitchen": { subcategories: ["sub-restaurants", "sub-catering"], createdBy: "usr_002", updatedBy: "usr_002", updatedAt: "2026-11-05" },
  "bravo-company-builders": { subcategories: ["sub-general-contracting", "sub-roofing"], gallery: g("construction", "site-crew", "blueprints", "cranes", "workshop-team"), videos: [{ id: "vid_002", title: "Kitchen remodel walkthrough", url: "https://video.example/bravo-remodel" }], createdBy: "usr_001", updatedBy: "usr_002", updatedAt: "2026-11-14" },
  "sparkline-welding-fabrication": { subcategories: ["sub-welding-and-fabrication"], gallery: g("welding", "workshop-team"), createdBy: "usr_002" },
  "torque-and-tread-auto-care": { subcategories: ["sub-auto-repair"], createdBy: "usr_004", updatedBy: "usr_004", updatedAt: "2026-11-16" },
  "longhaul-logistics-group": { subcategories: ["sub-trucking-and-freight"], createdBy: "usr_004" },
  "meridian-legal-advisory": { subcategories: ["sub-legal-services", "sub-legal-aid"], secondaryCategories: ["community-resources"], createdBy: "usr_002", updatedBy: "usr_001", updatedAt: "2026-11-17" },
  "fortitude-financial-planning": { subcategories: ["sub-financial-planning", "sub-accounting", "sub-financial-counseling"], secondaryCategories: ["community-resources"], gallery: g("finance", "office"), createdBy: "usr_002" },
  "vector-cyber-solutions": { subcategories: ["sub-cybersecurity"], createdBy: "usr_001" },
  "northstar-web-software": { subcategories: ["sub-web-and-software", "sub-marketing"], secondaryCategories: ["professional-services"], createdBy: "usr_004" },
  "ranger-strength-conditioning": { subcategories: ["sub-gyms-and-training"], createdBy: "usr_002", updatedBy: "usr_002", updatedAt: "2026-11-18" },
  "stillwater-yoga-recovery": { subcategories: ["sub-yoga-and-recovery"], createdBy: "usr_004" },
  "homefront-realty-group": { subcategories: ["sub-real-estate"], createdBy: "usr_002" },
  "sentinel-home-security": { subcategories: ["sub-home-security"], createdBy: "usr_001" },
  "greenline-lawn-landscape": { subcategories: ["sub-landscaping"], createdBy: "usr_004", updatedBy: "usr_004", updatedAt: "2026-11-10" },
  "trailhead-outfitters": { subcategories: ["sub-guided-trips", "sub-outdoor-gear"], createdBy: "usr_002" },
  "frontline-photo-film": { subcategories: ["sub-photography-and-video", "sub-marketing"], secondaryCategories: ["professional-services"], createdBy: "usr_002", updatedBy: "usr_002", updatedAt: "2026-11-15" },
  "garrison-barber-shave": { subcategories: ["sub-barbers-and-salons"], createdBy: "usr_001", updatedBy: "usr_002", updatedAt: "2026-11-13" },
  "cape-fear-hardware-supply": { subcategories: ["sub-hardware-and-supplies"], listingKind: "veteran_friendly", createdBy: "usr_002" },
  "front-range-family-dental": { subcategories: ["sub-dental-and-health-care"], listingKind: "veteran_friendly", createdBy: "usr_004" },
};
