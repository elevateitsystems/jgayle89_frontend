"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BusinessCard, BusinessCardSkeleton } from "@/components/directory/business-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { DemoNotice } from "@/components/shared/demo-notice";
import { buttonVariants } from "@/components/ui/button";
import { usePublicBusinesses } from "@/hooks/use-businesses";

export function FeaturedBusinesses() {
  const { businesses, loading } = usePublicBusinesses();
  const featured = businesses.filter((b) => b.featured).slice(0, 6);

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
            : featured.map((b, i) => <BusinessCard key={b.id} business={b} priority={i < 3} />)}
        </div>
      </div>
    </section>
  );
}
