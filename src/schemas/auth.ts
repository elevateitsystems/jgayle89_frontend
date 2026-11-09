import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const BRANCHES = ["Army", "Navy", "Marine Corps", "Air Force", "Space Force", "Coast Guard", "National Guard"] as const;

/** Veteran / Military vs Civilian is a profile attribute, not a permission role. */
export const userTypeSchema = z.enum(["veteran", "civilian"], { error: "Choose Veteran / Military or Civilian" });

const profileFields = {
  name: z.string().trim().min(2, "Please enter your full name"),
  userType: userTypeSchema,
  branch: z.string(),
};

const requireBranchForVeterans = (v: { userType: string; branch: string }, ctx: z.RefinementCtx) => {
  if (v.userType === "veteran" && !(BRANCHES as readonly string[]).includes(v.branch)) {
    ctx.addIssue({ code: "custom", path: ["branch"], message: "Select your branch of service" });
  }
};

export const profileSchema = z.object(profileFields).superRefine(requireBranchForVeterans);
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
  .superRefine(requireBranchForVeterans)
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotSchema = z.object({ email: z.email("Enter a valid email address") });
export type ForgotValues = z.infer<typeof forgotSchema>;
