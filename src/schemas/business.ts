import { z } from "zod";

const branches = ["Army", "Navy", "Marine Corps", "Air Force", "Space Force", "Coast Guard", "National Guard"] as const;

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), "Enter a full URL starting with http:// or https://");

export const businessSchema = z.object({
  name: z.string().trim().min(2, "Business name must be at least 2 characters").max(80),
  slug: z
    .string()
    .trim()
    .max(80)
    .refine((v) => v === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), "Use lowercase letters, numbers and hyphens only"),
  category: z.string().min(1, "Choose a category"),
  tagline: z.string().trim().min(5, "Add a short tagline").max(120, "Keep the tagline under 120 characters"),
  description: z.string().trim().min(40, "Description should be at least 40 characters").max(2000),
  services: z.string().trim().max(400),
  keywords: z.string().trim().max(200),
  address: z.string().trim().min(3, "Street address is required"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().length(2, "Use the 2-letter state code").transform((v) => v.toUpperCase()),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
  lat: z.number({ error: "Latitude is required" }).min(-90, "Must be between -90 and 90").max(90, "Must be between -90 and 90"),
  lng: z.number({ error: "Longitude is required" }).min(-180, "Must be between -180 and 180").max(180, "Must be between -180 and 180"),
  phone: z.string().trim().regex(/^[\d\s().+-]{7,20}$/, "Enter a valid phone number"),
  email: z.email("Enter a valid email address"),
  website: optionalUrl,
  rating: z.number({ error: "Enter a rating" }).min(0, "Min 0").max(5, "Max 5"),
  reviewCount: z.number({ error: "Enter a count" }).int("Whole number").min(0, "Min 0"),
  branch: z.enum(branches, { error: "Select a branch" }),
  yearFounded: z
    .number({ error: "Enter a year" })
    .int()
    .min(1900, "Enter a valid year")
    .max(new Date().getFullYear(), "Year can't be in the future"),
  hours: z.string().trim().max(160),
  coverImage: z.string().min(1, "Add a cover image"),
  profileImage: z.string().optional(),
  featured: z.boolean(),
  status: z.enum(["active", "pending", "draft"]),
});

export type BusinessFormValues = z.input<typeof businessSchema>;
export type BusinessFormOutput = z.output<typeof businessSchema>;
