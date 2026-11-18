import type { Metadata } from "next";
import { MemberServicesPage } from "@/components/services/services-catalog";

export const metadata: Metadata = { title: "Services" };

export default function Page() {
  return <MemberServicesPage />;
}
