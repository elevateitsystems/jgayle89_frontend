import type { Metadata } from "next";
import { AppointmentsClient } from "@/components/dashboard/appointments-client";

export const metadata: Metadata = { title: "Appointments" };

export default function Page() {
  return <AppointmentsClient />;
}
