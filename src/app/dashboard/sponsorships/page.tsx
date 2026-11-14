import type { Metadata } from "next";
import { AdHub } from "@/components/sponsorship/ad-hub";

export const metadata: Metadata = { title: "Sponsorships" };

export default function Page() {
  return <AdHub family="sponsorship" />;
}
