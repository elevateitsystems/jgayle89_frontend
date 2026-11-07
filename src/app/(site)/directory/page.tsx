import { Suspense } from "react";
import type { Metadata } from "next";
import { DirectoryClient } from "@/components/directory/directory-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Business Directory",
  description: "Search and filter veteran-owned businesses by name, location and category.",
};

export default function DirectoryPage() {
  return (
    <Suspense fallback={<div className="container-page py-16"><Skeleton className="h-64 w-full" /></div>}>
      <DirectoryClient />
    </Suspense>
  );
}
