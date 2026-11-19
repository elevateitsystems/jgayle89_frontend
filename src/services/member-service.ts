import { createCollectionStore, delay } from "@/lib/demo-store";
import { daysFromToday } from "@/lib/date";
import { appointments as seedAppointments } from "@/lib/mock-data/appointments";
import { newId } from "@/lib/slug";
import { requirePermission, type Reviewer } from "@/services/actor";
import { auditService } from "@/services/audit-service";
import type { Appointment, AppointmentContext, AppointmentMode, AppointmentStatus, SavedBusiness } from "@/types";

/**
 * Member (Veteran / Civilian) data layer — saved businesses and advisor appointments (demo implementation).
 * Plan limits are passed in by the caller (resolved from the member's plan). The API must re-check them.
 */
export const savedStore = createCollectionStore<SavedBusiness>("saved-businesses", [
  { id: "sv_001", userId: "usr_005", businessId: "biz_001", savedOn: "2026-10-02" },
  { id: "sv_002", userId: "usr_005", businessId: "biz_013", savedOn: "2026-10-11" },
  { id: "sv_003", userId: "usr_006", businessId: "biz_003", savedOn: "2026-10-15" },
]);

export const appointmentStore = createCollectionStore<Appointment>("appointments", seedAppointments);

export const savedService = {
  isSaved(userId: string, businessId: string) {
    return savedStore.getSnapshot().some((s) => s.userId === userId && s.businessId === businessId);
  },

  /** `limit` is the member's plan limit (null = unlimited). Removing is always allowed. */
  async toggle(userId: string, businessId: string, limit: number | null): Promise<boolean> {
    await delay(200);
    const all = savedStore.getSnapshot();
    const existing = all.find((s) => s.userId === userId && s.businessId === businessId);
    if (existing) {
      savedStore.set(all.filter((s) => s.id !== existing.id));
      return false;
    }
    const used = all.filter((s) => s.userId === userId).length;
    if (limit !== null && used >= limit) throw new Error(`You've reached your plan's limit of ${limit} saved businesses.`);
    savedStore.set([{ id: newId("sv"), userId, businessId, savedOn: daysFromToday(0) }, ...all]);
    return true;
  },
};

export interface AppointmentInput {
  topic: string;
  mode: AppointmentMode;
  date: string;
  time: string;
  notes: string;
  /** Set when booked from a "Schedule an Appointment for Assistance" button. */
  context?: AppointmentContext;
}

const monthKey = (iso: string) => iso.slice(0, 7);

/** Appointments that count against this month's allowance (cancelled ones don't). */
export function appointmentsInMonth(list: Appointment[], userId: string, month: string) {
  return list.filter((a) => a.userId === userId && a.status !== "cancelled" && monthKey(a.date) === month).length;
}

export const appointmentService = {
  async request(userId: string, input: AppointmentInput, limit: number | null): Promise<Appointment> {
    await delay(500);
    if (input.date < daysFromToday(0)) throw new Error("Choose a date in the future.");
    const all = appointmentStore.getSnapshot();
    const used = appointmentsInMonth(all, userId, monthKey(input.date));
    if (limit !== null && used >= limit) throw new Error(`Your plan includes ${limit} appointment${limit === 1 ? "" : "s"} per month and that month is full.`);
    const appt: Appointment = {
      id: newId("ap"), userId, ...input, notes: input.notes.trim(), status: "requested", createdAt: new Date().toISOString(),
      ...(input.context ? { context: input.context } : {}),
    };
    appointmentStore.set([appt, ...all]);
    return appt;
  },

  async cancel(id: string, userId: string): Promise<void> {
    await delay(300);
    const all = appointmentStore.getSnapshot();
    const a = all.find((x) => x.id === id);
    if (!a || a.userId !== userId) throw new Error("Appointment not found.");
    if (a.status === "completed") throw new Error("Completed appointments can't be cancelled.");
    appointmentStore.set(all.map((x) => (x.id === id ? { ...x, status: "cancelled" as const } : x)));
  },
};

/** Staff-side appointment handling (Admin → Appointments). The API must enforce `appointments.manage`. */
export const appointmentAdminService = {
  async assign(id: string, staffId: string | undefined, actor: Reviewer): Promise<void> {
    await delay(250);
    requirePermission(actor, "appointments.manage", "assign appointments");
    patchAppointment(id, { assignedTo: staffId });
    auditService.record(actor, "appointments", staffId ? "assigned" : "unassigned", { id, name: id }, staffId);
  },

  async setStatus(id: string, status: AppointmentStatus, actor: Reviewer): Promise<void> {
    await delay(250);
    requirePermission(actor, "appointments.manage", "update appointments");
    patchAppointment(id, { status });
    auditService.record(actor, "appointments", `marked ${status}`, { id, name: id });
  },
};

function patchAppointment(id: string, patch: Partial<Appointment>) {
  const all = appointmentStore.getSnapshot();
  if (!all.some((a) => a.id === id)) throw new Error("Appointment not found.");
  appointmentStore.set(all.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)));
}
