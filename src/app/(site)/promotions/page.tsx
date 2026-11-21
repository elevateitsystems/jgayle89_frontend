import type { Metadata } from "next";
import { PromotionsClient } from "@/components/promotions/promotions-client";

export const metadata: Metadata = { title: "Promotions" };

export default function Page() {
  return <PromotionsClient />;
}
