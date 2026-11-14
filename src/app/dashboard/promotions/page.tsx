import type { Metadata } from "next";
import { PromotionsPage } from "@/components/business/owner-pages";

export const metadata: Metadata = { title: "Discounts & Promotions" };

export default function Page() {
  return <PromotionsPage />;
}
