import type { Metadata } from "next";
import { PricingPage } from "@/components/membership/pricing-page";

export const metadata: Metadata = {
  title: "Membership Plans",
  description: "Compare Mission: SITREP membership plans for veterans, civilians and businesses. Directory search and community resources are always free.",
};

export default function Page() {
  return <PricingPage />;
}
