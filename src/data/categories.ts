import type { Category } from "@/types";

export const categories: Category[] = [
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

export const categoryById = (id: string) => categories.find((c) => c.id === id);
