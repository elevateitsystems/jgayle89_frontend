import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean(),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name"),
    email: z.email("Enter a valid email address"),
    branch: z.string().min(1, "Select a branch or 'Supporter'"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/\d/, "Include a number"),
    confirm: z.string().min(1, "Confirm your password"),
    terms: z.boolean().refine((v) => v === true, "You must accept the demo terms"),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotSchema = z.object({ email: z.email("Enter a valid email address") });
export type ForgotValues = z.infer<typeof forgotSchema>;
