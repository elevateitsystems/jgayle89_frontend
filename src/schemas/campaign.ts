import { z } from "zod";
import { validateTargeting } from "@/features/advertising/rules";
import type { AdProduct } from "@/types";

/** Advertiser campaign form. The rules that depend on the chosen product (targeting, image, logo) are added per product. */
export function campaignSchemaFor(product: AdProduct) {
  return z
    .object({
      businessId: z.string().min(1, "Choose a business"),
      name: z.string().trim().min(3, "Name the campaign (3+ characters)").max(60),
      durationDays: z.string().min(1, "Choose a duration"),
      requestedStart: z.string().min(1, "Choose a start date"),
      categoryIds: z.array(z.string()),
      states: z.array(z.string()),
      city: z.string().trim().max(60),
      eventId: z.string(),
      resourceId: z.string(),
      headline: z.string().trim().min(5, "Add a headline (5+ characters)").max(70, "Keep the headline under 70 characters"),
      body: z.string().trim().max(160, "Keep the text under 160 characters"),
      ctaLabel: z.string().trim().max(24, "Keep the button text under 24 characters"),
      ctaUrl: z.string().trim().refine((v) => v === "" || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), "Enter a full URL starting with http:// or https://"),
      image: z.string(),
      logo: z.string(),
    })
    .superRefine((v, ctx) => {
      const err = validateTargeting(product, { categoryIds: v.categoryIds, states: v.states, city: v.city, eventId: v.eventId, resourceId: v.resourceId });
      if (err) {
        const path = product.targeting === "category" ? "categoryIds" : product.targeting === "geo" ? "states" : product.targeting === "event" ? "eventId" : "resourceId";
        ctx.addIssue({ code: "custom", path: [path], message: err });
      }
      if (product.needsImage && !v.image) ctx.addIssue({ code: "custom", path: ["image"], message: "Upload a promotional image" });
      if (product.needsLogo && !v.logo) ctx.addIssue({ code: "custom", path: ["logo"], message: "Upload your logo" });
      if (v.ctaLabel && !v.ctaUrl) ctx.addIssue({ code: "custom", path: ["ctaUrl"], message: "Add the link the button should open" });
    });
}

export type CampaignFormValues = z.input<ReturnType<typeof campaignSchemaFor>>;

/** Admin → advertising product form. */
export const adProductSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(60),
  description: z.string().trim().min(10, "Add a short description").max(240),
  placement: z.string().trim().min(3, "Describe where it appears").max(120),
  label: z.enum(["Sponsored", "Advertisement"]),
  family: z.enum(["advertising", "sponsorship"]),
  targeting: z.enum(["none", "category", "geo", "event", "resource"]),
  totalSlots: z.number({ error: "Enter the number of slots" }).int("Whole number").min(0, "Min 0").max(100, "Max 100"),
  active: z.boolean(),
  needsImage: z.boolean(),
  needsLogo: z.boolean(),
  imageSpec: z.string().trim().max(160),
  durations: z
    .array(
      z.object({
        days: z.number({ error: "Days" }).int("Whole days").min(1, "Min 1"),
        price: z.number({ error: "Price" }).min(0, "Min $0").max(100000, "Too high"),
      }),
    )
    .min(1, "Add at least one duration")
    .refine((d) => new Set(d.map((x) => x.days)).size === d.length, "Each duration length must be different"),
});
export type AdProductFormValues = z.input<typeof adProductSchema>;

export const creditSchema = z.object({
  businessId: z.string().min(1, "Choose a business"),
  amount: z.number({ error: "Enter an amount" }).positive("Must be more than $0").max(5000, "Max $5,000"),
  reason: z.string().trim().min(3, "Add a reason").max(120),
  expiresOn: z.string().min(1, "Choose an expiry date"),
});
export type CreditFormValues = z.input<typeof creditSchema>;
