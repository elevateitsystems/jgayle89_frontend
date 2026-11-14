import type { Metadata } from "next";
import { AdHub } from "@/components/sponsorship/ad-hub";

export const metadata: Metadata = { title: "Advertisements" };

export default function Page() {
  return <AdHub family="advertising" />;
}
