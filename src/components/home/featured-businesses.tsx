"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BusinessCard, BusinessCardSkeleton } from "@/components/directory/business-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { DemoNotice } from "@/components/shared/demo-notice";
import { buttonVariants } from "@/components/ui/button";
import { useLiveCampaignsOfKind } from "@/features/advertising/hooks";
import { usePublicBusinesses } from "@/hooks/use-businesses";
import { useMemo } from "react";

export function FeaturedBusinesses() {
  const { businesses, loading } = usePublicBusinesses();
  const sponsoredLive = useLiveCampaignsOfKind("homepage_featured");
  // Homepage Featured Business placements come first and are labelled "Sponsored"; the editorial picks fill the rest.
  const { featured, sponsoredIds } = useMemo(() => {
    const sponsored = sponsoredLive.flatMap(({ campaign }) => businesses.filter((b) => b.id === campaign.businessId));
    const ids = new Set(sponsored.map((b) => b.id));
    const rest = businesses.filter((b) => b.featured && !ids.has(b.id));
    return { featured: [...sponsored, ...rest].slice(0, 6), sponsoredIds: ids };
  }, [businesses, sponsoredLive]);

  return (
    <section className="section-y" aria-labelledby="featured-heading">
      <div className="container-page">
        <SectionHeading
          id="featured-heading"
          eyebrow="Featured"
          title="Featured veteran-owned businesses"
          description="A hand-picked look at the kinds of businesses you'll find in the directory."
          action={
            <Link href="/directory" className={buttonVariants({ variant: "outline" })}>
              View all businesses <ArrowRight />
            </Link>
          }
        />
        <div className="mt-8">
          <DemoNotice />
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <BusinessCardSkeleton key={i} />)
            : featured.map((b, i) => <BusinessCard key={b.id} business={b} priority={i < 3} sponsored={sponsoredIds.has(b.id)} />)}
        </div>
      </div>
    </section>
  );
}
