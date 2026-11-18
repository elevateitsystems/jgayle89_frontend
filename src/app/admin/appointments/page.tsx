import { Suspense } from "react";
import type { Metadata } from "next";
import { AppointmentsAdmin } from "@/components/admin/appointments-admin";

export const metadata: Metadata = { title: "Appointments" };

export default function Page() {
  return (
    <Suspense>
      <AppointmentsAdmin />
    </Suspense>
  );
}
