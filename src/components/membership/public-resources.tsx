"use client";

import { ResourceCatalog } from "@/components/dashboard/resource-catalog";

/** Public /resources: community, career and financial-education resources. Never plan-gated. */
export function PublicResources() {
  return (
    <>
      <section className="border-b border-sand-200 bg-sand-100">
        <div className="container-page py-10 sm:py-14">
          <p className="eyebrow">Resources</p>
          <h1 className="mt-2 text-4xl font-semibold text-olive-950 sm:text-5xl">Community resources</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">Help with food, housing, health, careers and money — free for everyone, no account or membership needed.</p>
        </div>
      </section>
      <div className="container-page py-8 sm:py-12">
        <ResourceCatalog kinds={["community", "career", "financial-education"]} audience="public" searchLabel="Search resources" showSponsors />
      </div>
    </>
  );
}
