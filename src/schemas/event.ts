import { z } from "zod";
import { eventCategories } from "@/data/events";

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
    category: z.enum(eventCategories, { error: "Choose a category" }),
    summary: z.string().trim().min(10, "Add a one-line summary").max(180, "Keep the summary under 180 characters"),
    description: z.string().trim().min(30, "Description should be at least 30 characters").max(2000),
    agenda: z.string().trim().max(800),
    date: z.string().min(1, "Choose a date"),
    startTime: z.string().min(1, "Start time required"),
    endTime: z.string().min(1, "End time required"),
    venue: z.string().trim().min(2, "Venue is required"),
    address: z.string().trim().min(2, "Address is required"),
    city: z.string().trim().min(2, "City is required"),
    state: z.string().trim().min(2, "State is required").max(2, "Use the 2-letter state code"),
    organizer: z.string().trim().min(2, "Organizer is required"),
    price: z.string().trim().min(1, "Enter a price or 'Free'"),
    capacity: z.number({ error: "Enter a capacity" }).int().min(1, "Min 1"),
    image: z.string().min(1, "Add an event image"),
    status: z.enum(["published", "draft"]),
  })
  .refine((v) => !v.startTime || !v.endTime || v.endTime > v.startTime, {
    path: ["endTime"],
    message: "End time must be after start time",
  });

export type EventFormValues = z.input<typeof eventSchema>;
export type EventFormOutput = z.output<typeof eventSchema>;
