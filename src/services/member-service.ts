import { createCollectionStore, delay } from "@/lib/demo-store";
import { daysFromToday } from "@/lib/date";
import { newId } from "@/lib/slug";
import type { Appointment, AppointmentMode, SavedBusiness } from "@/types";

/**
 * Member (Veteran / Civilian) data layer — saved businesses and advisor appointments (demo implementation).
 * Plan limits are passed in by the caller (resolved from the member's plan). The API must re-check them.
 */
export const savedStore = createCollectionStore<SavedBusiness>("saved-businesses", [
  { id: "sv_001", userId: "usr_005", businessId: "biz_001", savedOn: "2026-10-02" },
  { id: "sv_002", userId: "usr_005", businessId: "biz_013", savedOn: "2026-10-11" },
  { id: "sv_003", userId: "usr_006", businessId: "biz_003", savedOn: "2026-10-15" },
]);

export const appointmentStore = createCollectionStore<Appointment>("appointments", [
  { id: "ap_seed_1", userId: "usr_005", topic: "Benefits review", mode: "video", date: daysFromToday(6), time: "10:30", notes: "Questions about disability rating and education benefits.", status: "confirmed", createdAt: "2026-11-09T12:00:00Z" },
  { id: "ap_seed_2", userId: "usr_005", topic: "Career coaching", mode: "phone", date: daysFromToday(-12), time: "15:00", notes: "", status: "completed", createdAt: "2026-10-20T12:00:00Z" },
]);

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
    const appt: Appointment = { id: newId("ap"), userId, ...input, notes: input.notes.trim(), status: "requested", createdAt: new Date().toISOString() };
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
