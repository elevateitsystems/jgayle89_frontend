import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { BenefitsClient } from "@/components/benefits/benefits-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Veteran Benefits",
  description: "Search federal and state veteran benefits by keyword, state and category, with links to official sources.",
};

export default function BenefitsPage() {
  if (!siteConfig.features.benefits) notFound();
  return (
    <Suspense fallback={<div className="container-page py-16"><Skeleton className="h-64 w-full" /></div>}>
      <BenefitsClient />
    </Suspense>
  );
}
