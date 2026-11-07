export type ListingStatus = "active" | "pending" | "draft";
export type EventStatus = "published" | "draft";

export type BranchOfService =
  | "Army"
  | "Navy"
  | "Marine Corps"
  | "Air Force"
  | "Space Force"
  | "Coast Guard"
  | "National Guard";

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string; // key into the icon map in lib/category-icons
  image: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  category: string; // Category.id
  tagline: string;
  description: string;
  services: string[];
  keywords: string[];
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  website: string;
  rating: number; // DEMO rating, not a real review score
  reviewCount: number; // DEMO count
  branch: BranchOfService;
  yearFounded: number;
  hours: string;
  coverImage: string;
  profileImage?: string; // optional; a monogram is used when empty
  featured: boolean;
  status: ListingStatus;
  createdAt: string; // ISO date
}

export interface CommunityEvent {
  id: string;
  slug: string;
  title: string;
  category: string; // EventCategory
  summary: string;
  description: string;
  agenda: string[];
  date: string; // ISO date (YYYY-MM-DD)
  startTime: string; // "18:00"
  endTime: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  image: string;
  organizer: string;
  price: string; // "Free" or "$15"
  capacity: number;
  registered: number;
  status: EventStatus;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: "business" | "event" | "import" | "user" | "review";
  message: string;
  actor: string;
  time: string; // ISO datetime
}

export interface DashboardStat {
  id: string;
  label: string;
  value: number;
  delta: number; // percent vs previous period
  hint: string;
}

export interface TimeseriesPoint {
  label: string;
  value: number;
}

export interface DemoSession {
  name: string;
  email: string;
  role: "admin" | "member";
}
