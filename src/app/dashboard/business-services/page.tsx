import type { Metadata } from "next";
import { BusinessServicesPage } from "@/components/services/services-catalog";

export const metadata: Metadata = { title: "Business Services" };

export default function Page() {
  return <BusinessServicesPage />;
}
