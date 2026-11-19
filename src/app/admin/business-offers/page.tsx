import type { Metadata } from "next";
import { BusinessOffersAdmin } from "@/components/admin/business-offers-admin";

export const metadata: Metadata = { title: "Business Offers" };

export default function Page() {
  return <BusinessOffersAdmin />;
}
