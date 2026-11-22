import type { Metadata } from "next";
import { SponsorshipOperationsAdmin } from "@/components/admin/sponsorship-operations-admin";

export const metadata: Metadata = { title: "Sponsorship Operations" };

export default function Page() {
  return <SponsorshipOperationsAdmin />;
}
