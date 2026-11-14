import { z } from "zod";

const money = (label: string) =>
  z.number({ error: `Enter the ${label} price` }).min(0, "Can't be negative").max(100000, "That's too high").multipleOf(0.01, "Use cents at most (e.g. 9.99)");

export const planSchema = z
  .object({
    audience: z.enum(["veteran", "civilian", "business"]),
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(30, "Keep the name under 30 characters"),
    tagline: z.string().trim().min(5, "Add a short tagline").max(100, "Keep the tagline under 100 characters"),
    description: z.string().trim().min(10, "Add a short description").max(300, "Keep the description under 300 characters"),
    monthlyPrice: money("monthly"),
    annualPrice: money("annual"),
    active: z.boolean(),
    highlighted: z.boolean(),
    features: z.record(
      z.string(),
      z.object({
        enabled: z.boolean(),
        /** null = unlimited. */
        limit: z.number().int("Whole numbers only").min(0, "Can't be negative").max(100000, "Too high").nullable(),
      }),
    ),
  })
  .superRefine((v, ctx) => {
    if (v.monthlyPrice === 0 && v.annualPrice !== 0) ctx.addIssue({ code: "custom", path: ["annualPrice"], message: "A free plan has no annual price" });
    if (v.monthlyPrice > 0 && v.annualPrice === 0) ctx.addIssue({ code: "custom", path: ["annualPrice"], message: "Set an annual price, or $0 only for free plans" });
    if (v.annualPrice > v.monthlyPrice * 12 && v.monthlyPrice > 0) ctx.addIssue({ code: "custom", path: ["annualPrice"], message: "Annual shouldn't cost more than 12 monthly payments" });
  });

export type PlanFormValues = z.input<typeof planSchema>;
