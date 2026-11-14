import { z } from "zod";

export const appointmentSchema = z.object({
  topic: z.string().min(1, "Choose a topic"),
  mode: z.enum(["phone", "video", "in_person"], { error: "Choose how you'd like to meet" }),
  date: z.string().min(1, "Choose a date"),
  time: z.string().min(1, "Choose a time"),
  notes: z.string().trim().max(500, "Keep notes under 500 characters"),
});
export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export const APPOINTMENT_TOPICS = ["Benefits review", "Career coaching", "Financial planning", "Business owner Q&A", "Something else"] as const;
