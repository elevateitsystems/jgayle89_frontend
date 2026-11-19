import { Suspense } from "react";
import type { Metadata } from "next";
import { FreebiesClient } from "@/components/offers/freebies-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Freebies & Discounts",
  description: "Veteran freebies, military and first responder discounts, corporate offers and promotions.",
};

export default function FreebiesPage() {
  return (
    <Suspense fallback={<div className="container-page py-16"><Skeleton className="h-64 w-full" /></div>}>
      <FreebiesClient />
    </Suspense>
  );
}
