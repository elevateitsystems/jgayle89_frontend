import type { Category } from "@/types";

const primaries: Category[] = [
  {
    id: "food-drink",
    name: "Food & Drink",
    description: "Cafés, bakeries, breweries, and restaurants.",
    icon: "utensils",
    image: "/images/coffee.jpg",
  },
  {
    id: "construction-trades",
    name: "Construction & Trades",
    description: "Builders, welders, and skilled trades.",
    icon: "hammer",
    image: "/images/construction.jpg",
  },
  {
    id: "automotive-transport",
    name: "Automotive & Transport",
    description: "Auto care, trucking, and logistics.",
    icon: "truck",
    image: "/images/auto-engine.jpg",
  },
  {
    id: "professional-services",
    name: "Professional Services",
    description: "Legal, financial, and consulting expertise.",
    icon: "briefcase",
    image: "/images/legal-desk.jpg",
  },
  {
    id: "technology",
    name: "Technology",
    description: "Software, cybersecurity, and IT services.",
    icon: "cpu",
    image: "/images/tech-desk.jpg",
  },
  {
    id: "health-fitness",
    name: "Health & Fitness",
    description: "Gyms, recovery, and wellness studios.",
    icon: "heart-pulse",
    image: "/images/gym.jpg",
  },
  {
    id: "home-real-estate",
    name: "Home & Real Estate",
    description: "Realty, landscaping, and home security.",
    icon: "home",
    image: "/images/house-keys.jpg",
  },
  {
    id: "outdoors-recreation",
    name: "Outdoors & Recreation",
    description: "Guides, outfitters, and adventure services.",
    icon: "mountain",
    image: "/images/hiking.jpg",
  },
  {
    id: "creative-media",
    name: "Creative & Media",
    description: "Photography, film, design, and marketing.",
    icon: "camera",
    image: "/images/photographer.jpg",
  },
  {
    id: "personal-services",
    name: "Personal Services",
    description: "Barbers, salons, and everyday services.",
    icon: "scissors",
    image: "/images/barber.jpg",
  },
];

/**
 * Subcategories (client update §11A). Each belongs to one primary category via `parentId`; admins can rename,
 * move, reorder, hide from filters or deactivate them without code changes.
 */
const SUBS: Record<string, string[]> = {
  "food-drink": ["Restaurants", "Cafés", "Catering", "Bakeries", "Food Trucks", "Breweries"],
  "construction-trades": ["Plumbing", "Electrical", "Roofing", "HVAC", "General Contracting", "Welding & Fabrication"],
  "automotive-transport": ["Auto Repair", "Trucking & Freight"],
  "professional-services": ["Accounting", "Legal Services", "Consulting", "Marketing", "Business Development", "Financial Planning"],
  technology: ["Cybersecurity", "Web & Software"],
  "health-fitness": ["Gyms & Training", "Yoga & Recovery"],
  "home-real-estate": ["Landscaping", "Real Estate", "Home Security", "Hardware & Supplies"],
  "outdoors-recreation": ["Guided Trips", "Outdoor Gear"],
  "creative-media": ["Photography & Video"],
  "personal-services": ["Barbers & Salons", "Dental & Health Care"],
  "community-resources": ["Legal Aid", "Financial Counseling", "Veteran Support"],
};

export const subId = (name: string) => `sub-${name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

const withPrimary = [
  ...primaries,
  {
    id: "community-resources",
    name: "Community Resources & Assistance",
    description: "Legal aid, financial counseling and other veteran support services.",
    icon: "handshake",
    image: "/images/handshake.jpg",
  },
].map((c, i) => ({ ...c, parentId: null, active: true, showInFilters: true, sortOrder: (i + 1) * 10 }));

export const categories: Category[] = [
  ...withPrimary,
  ...withPrimary.flatMap((p) =>
    (SUBS[p.id] ?? []).map((name, i) => ({
      id: subId(name),
      name,
      description: `${name} — part of ${p.name}.`,
      icon: p.icon,
      image: p.image,
      parentId: p.id,
      active: true,
      showInFilters: true,
      sortOrder: (i + 1) * 10,
    })),
  ),
];

export const categoryById = (id: string) => categories.find((c) => c.id === id);
