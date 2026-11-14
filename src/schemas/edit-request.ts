import { z } from "zod";

export const SOCIAL_PLATFORMS = [
  { id: "facebook", label: "Facebook", host: /(^|\.)facebook\.com$|(^|\.)fb\.com$/i, placeholder: "https://facebook.com/yourbusiness" },
  { id: "instagram", label: "Instagram", host: /(^|\.)instagram\.com$/i, placeholder: "https://instagram.com/yourbusiness" },
  { id: "linkedin", label: "LinkedIn", host: /(^|\.)linkedin\.com$/i, placeholder: "https://linkedin.com/company/yourbusiness" },
  { id: "youtube", label: "YouTube", host: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i, placeholder: "https://youtube.com/@yourbusiness" },
  { id: "website", label: "Other website", host: /.+/, placeholder: "https://example.com/page" },
] as const;

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

export const socialLinkSchema = z
  .object({
    platform: z.enum(["facebook", "instagram", "linkedin", "youtube", "website"]),
    url: z.string().trim().min(1, "Enter a URL"),
    label: z.string().trim().max(40, "Keep the name under 40 characters"),
  })
  .superRefine((v, ctx) => {
    if (!/^https?:\/\//i.test(v.url)) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "Start with http:// or https://" });
      return;
    }
    const host = hostOf(v.url);
    if (!host || !host.includes(".")) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "Enter a valid web address" });
      return;
    }
    const platform = SOCIAL_PLATFORMS.find((p) => p.id === v.platform);
    if (platform && !platform.host.test(host)) {
      ctx.addIssue({ code: "custom", path: ["url"], message: `That doesn't look like a ${platform.label} address` });
    }
    if (v.platform === "website" && !v.label) {
      ctx.addIssue({ code: "custom", path: ["label"], message: "Name this link (e.g. “Online store”)" });
    }
  });

export const promotionSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(3, "Add a title").max(60, "Keep the title under 60 characters"),
  discountText: z.string().trim().min(2, "Describe the discount, e.g. “10% off”").max(30, "Keep this short"),
  description: z.string().trim().min(10, "Add a short description").max(200, "Keep the description under 200 characters"),
  audience: z.enum(["veterans", "first_responders", "everyone"]),
  validUntil: z.string(),
});

const optionalUrl = z.string().trim().refine((v) => v === "" || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), "Enter a full URL starting with http:// or https://");

export const editRequestSchema = z.object({
  name: z.string().trim().min(2, "Business name must be at least 2 characters").max(80),
  tagline: z.string().trim().min(5, "Add a short tagline").max(120, "Keep the tagline under 120 characters"),
  description: z.string().trim().min(40, "Description should be at least 40 characters").max(2000),
  services: z.string().trim().max(400),
  phone: z.string().trim().regex(/^[\d\s().+-]{7,20}$/, "Enter a valid phone number"),
  email: z.email("Enter a valid email address"),
  website: optionalUrl,
  hours: z.string().trim().max(160),
  address: z.string().trim().min(3, "Street address is required"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().length(2, "Use the 2-letter state code"),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
  socialLinks: z.array(socialLinkSchema).max(12),
  promotions: z.array(promotionSchema).max(12),
  reason: z.string().trim().min(10, "Tell staff why you're requesting this change (10+ characters)").max(500),
});

export type EditRequestFormValues = z.input<typeof editRequestSchema>;
export type EditRequestFormOutput = z.output<typeof editRequestSchema>;

export const reviewNoteSchema = z.object({ note: z.string().trim().min(5, "Add a short note (5+ characters)").max(500) });
