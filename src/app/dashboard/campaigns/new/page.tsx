import { Suspense } from "react";
import type { Metadata } from "next";
import { CampaignBuilder } from "@/components/sponsorship/campaign-builder";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "New campaign" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <CampaignBuilder />
    </Suspense>
  );
}
