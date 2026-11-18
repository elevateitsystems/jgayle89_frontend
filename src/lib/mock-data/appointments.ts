import { daysFromToday } from "../date.ts";
import type { Appointment, AppointmentMode, AppointmentStatus } from "../../types/index.ts";

/**
 * DEMO DATA — member appointment requests spread over the last ~10 weeks and the next 2 weeks, so the admin
 * appointment reports have something to show. Members are AppUser ids from data/users.ts; `assignedTo` are staff ids.
 */
type Row = [user: string, topic: string, mode: AppointmentMode, dayOffset: number, time: string, status: AppointmentStatus, assignedTo?: string, context?: Appointment["context"]];

const rows: Row[] = [
  ["usr_005", "Benefits review", "video", 6, "10:30", "confirmed", "usr_002"],
  ["usr_005", "Career coaching", "phone", -12, "15:00", "completed", "usr_004"],
  ["usr_007", "Benefit assistance", "video", 3, "09:00", "confirmed", "usr_002", { kind: "benefit", id: "ben_009", title: "VA Home Loan Guaranty" }],
  ["usr_007", "Financial planning", "in_person", -30, "11:00", "completed", "usr_001"],
  ["usr_008", "Freebies & discounts assistance", "phone", 2, "13:30", "requested", undefined, { kind: "freebie", id: "fb_002", title: "National park lifetime pass" }],
  ["usr_008", "Career coaching", "video", -45, "16:00", "completed", "usr_004"],
  ["usr_010", "Something else", "phone", -8, "10:00", "cancelled", "usr_002"],
  ["usr_009", "Benefits review", "video", -3, "14:00", "completed", "usr_002"],
  ["usr_012", "Benefit assistance", "phone", -20, "09:30", "completed", "usr_004", { kind: "benefit", id: "ben_001", title: "Post-9/11 GI Bill" }],
  ["usr_012", "Career coaching", "video", 9, "15:30", "requested"],
  ["usr_013", "Freebies & discounts assistance", "video", -15, "12:00", "cancelled", "usr_004"],
  ["usr_006", "Financial planning", "phone", -2, "17:00", "completed", "usr_001"],
  ["usr_005", "Benefit assistance", "in_person", -60, "10:00", "completed", "usr_002", { kind: "benefit", id: "ben_006", title: "VA Disability Compensation" }],
  ["usr_007", "Service follow-up", "video", -25, "13:00", "completed", "usr_004"],
  ["usr_009", "Benefits review", "phone", 12, "11:30", "requested"],
  ["usr_011", "Career coaching", "video", -50, "09:00", "cancelled"],
  ["usr_008", "Financial planning", "video", -6, "18:00", "completed", "usr_002"],
  ["usr_010", "Freebies & discounts assistance", "phone", 5, "10:15", "confirmed", "usr_004"],
  ["usr_006", "Benefits review", "in_person", -1, "14:30", "completed", "usr_002"],
  ["usr_012", "Something else", "phone", 0, "16:30", "confirmed", "usr_001"],
  ["usr_007", "Benefit assistance", "video", -70, "09:45", "completed", "usr_002", { kind: "benefit", id: "ben_013", title: "Veteran Readiness and Employment (VR&E)" }],
  ["usr_013", "Career coaching", "video", 1, "12:30", "requested"],
];

export const appointments: Appointment[] = rows.map(([userId, topic, mode, offset, time, status, assignedTo, context], i) => {
  const date = daysFromToday(offset);
  const created = daysFromToday(Math.min(offset, 0) - 4);
  return {
    id: `ap_seed_${i + 1}`,
    userId,
    topic,
    mode,
    date,
    time,
    notes: i % 3 === 0 ? "Would like help understanding the next steps." : "",
    status,
    createdAt: `${created}T12:00:00Z`,
    ...(assignedTo ? { assignedTo } : {}),
    ...(context ? { context } : {}),
  };
});
