import type { Metadata } from "next";
import { BusinessMembershipsPage } from "@/components/business/owner-pages";

export const metadata: Metadata = { title: "Business Memberships" };

export default function Page() {
  return <BusinessMembershipsPage />;
}
