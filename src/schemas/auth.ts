import { z } from "zod";
import { US_STATES } from "@/data/us-states";
import { profileIssues, type ProfileFormValues } from "@/features/profile/profile";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const BRANCHES = ["Army", "Navy", "Marine Corps", "Air Force", "Space Force", "Coast Guard", "National Guard"] as const;

/** Veteran / Military vs Civilian is a profile attribute, not a permission role. */
export const userTypeSchema = z.enum(["veteran", "civilian"], { error: "Choose Veteran / Military or Civilian" });

/** Every member profile field (client update §1). Cross-field rules live in features/profile. */
const profileFields = {
  name: z.string().trim().min(2, "Please enter your full name"),
  userType: userTypeSchema,
  branch: z.string(),
  serviceStatus: z.string(),
  disabledVeteran: z.boolean(),
  combatVeteran: z.boolean(),
  purpleHeart: z.boolean(),
  serviceStart: z.string(),
  serviceEnd: z.string(),
  datesApproximate: z.boolean(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  firstResponder: z.boolean(),
  frCategory: z.string(),
  frOther: z.string(),
};

const currentMonth = () => new Date().toISOString().slice(0, 7);
const STATE_CODES = US_STATES.map((s) => s.code);

function applyProfileRules(v: ProfileFormValues, ctx: z.RefinementCtx) {
  for (const issue of profileIssues(v, currentMonth(), STATE_CODES)) ctx.addIssue({ code: "custom", path: [issue.path], message: issue.message });
}

export const profileSchema = z.object(profileFields).superRefine(applyProfileRules);
export type ProfileValues = z.infer<typeof profileSchema>;

export const registerSchema = z
  .object({
    ...profileFields,
    email: z.email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/\d/, "Include a number"),
    confirm: z.string().min(1, "Confirm your password"),
    terms: z.boolean().refine((v) => v === true, "You must accept the demo terms"),
  })
  .superRefine(applyProfileRules)
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotSchema = z.object({ email: z.email("Enter a valid email address") });
export type ForgotValues = z.infer<typeof forgotSchema>;
