import { z } from "zod";

export const staffSchema = z.object({
  name: z.string().trim().min(2, "Please enter the staff member's name"),
  email: z.email("Enter a valid email address"),
  permissions: z.array(z.string()).min(1, "Assign at least one permission"),
});
export type StaffFormValues = z.infer<typeof staffSchema>;
