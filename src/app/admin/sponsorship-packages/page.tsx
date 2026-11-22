import type { Metadata } from "next";
import { AdProductsAdmin } from "@/components/sponsorship/ad-products-admin";

export const metadata: Metadata = { title: "Sponsorship Packages" };

export default function Page() {
  return <AdProductsAdmin family="sponsorship" />;
}
