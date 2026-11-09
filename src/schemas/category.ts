import { z } from "zod";
import { categoryIconKeys } from "@/lib/category-icons";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(40, "Keep the name under 40 characters"),
  description: z.string().trim().min(5, "Add a short description").max(120, "Keep it under 120 characters"),
  icon: z.string().refine((v) => categoryIconKeys.includes(v), "Choose an icon"),
  image: z.string().min(1, "Add an image"),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;
