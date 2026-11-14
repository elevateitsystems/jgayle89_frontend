import { z } from "zod";

export const badgeSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(40, "Keep the name under 40 characters"),
  description: z.string().trim().min(10, "Describe what this badge means (10+ characters)").max(200, "Keep it under 200 characters"),
  criteria: z.string().trim().min(10, "Describe what staff should check (10+ characters)").max(240),
  icon: z.enum(["shield-check", "medal", "handshake", "siren", "percent", "star", "flag", "award"]),
  tone: z.enum(["olive", "brass", "sand", "slate", "red"]),
  requiresDocuments: z.boolean(),
  active: z.boolean(),
});
export type BadgeFormValues = z.infer<typeof badgeSchema>;

export const assignBadgeSchema = z.object({
  businessId: z.string().min(1, "Choose a business"),
  badgeId: z.string().min(1, "Choose a badge"),
  verifiedOn: z.string().min(1, "Record the verification date"),
});
export type AssignBadgeValues = z.infer<typeof assignBadgeSchema>;

export const revokeSchema = z.object({ reason: z.string().trim().min(5, "Add a short reason (5+ characters)").max(240) });
