"use client";

import Link from "next/link";
import { BusinessForm } from "./business-form";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useBusiness } from "@/hooks/use-businesses";

export function EditBusinessPage({ id }: { id: string }) {
  const { business, loading } = useBusiness({ id });

  if (loading && !business) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (!business) {
    return (
      <EmptyState title="Business not found" description="It may have been deleted.">
        <Link href="/admin/businesses" className={`${buttonVariants()} mt-6`}>
          Back to businesses
        </Link>
      </EmptyState>
    );
  }
  return <BusinessForm key={business.id} business={business} />;
}
