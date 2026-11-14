"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, FileEdit, MapPin, Settings2 } from "lucide-react";
import { EditRequestForm } from "./edit-request-form";
import { HiringChip } from "./hiring-toggle";
import { ListingStatusPill, NoBusinesses } from "./business-picker";
import { useEditCaps } from "./owner-edit-requests";
import { PageHeader } from "@/components/admin/page-header";
import { BadgeRow } from "@/components/badges/business-badge";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnedBusinesses } from "@/features/business/hooks";
import { useBusinessPlans } from "@/features/membership/hooks";
import { useCategories } from "@/hooks/use-categories";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import type { Business } from "@/types";

export function MyBusinesses() {
  const user = useSession();
  const { businesses, loading } = useOwnedBusinesses(user?.id);
  const plans = useBusinessPlans(businesses.map((b) => b.id));
  const { categoryName } = useCategories();
  const [editing, setEditing] = useState<Business | null>(null);
  const caps = useEditCaps(editing?.id);

  return (
    <>
      <PageHeader title="My businesses" description="Your listings, membership tiers and status. Public listing changes go through staff review." />
      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : businesses.length === 0 ? (
        <NoBusinesses />
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {businesses.map((b) => (
            <li key={b.id} className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-card sm:flex-row lg:flex-col xl:flex-row">
              <div className="relative aspect-[16/9] shrink-0 bg-sand-200 sm:aspect-auto sm:w-48 lg:aspect-[16/9] lg:w-auto xl:aspect-auto xl:w-48">
                <Image src={b.coverImage} alt="" fill sizes="(min-width: 1280px) 192px, (min-width: 640px) 192px, 100vw" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ListingStatusPill status={b.status} />
                  <StatusPill tone="info">{plans.get(b.id)?.name ?? "Free"} plan</StatusPill>
                  <HiringChip hiring={b.hiring} />
                </div>
                <h2 className="mt-2 font-sans text-lg font-semibold text-olive-950">{b.name}</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5 text-olive-600" aria-hidden /> {b.city}, {b.state} · {categoryName(b.category)}</p>
                <BadgeRow businessId={b.id} className="mt-3" max={4} />
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Link href={`/dashboard/businesses/${b.id}`} className={buttonVariants({ size: "sm" })}><Settings2 /> Manage</Link>
                  <Button size="sm" variant="outline" onClick={() => setEditing(b)}><FileEdit /> Request edit</Button>
                  {b.status === "active" && (
                    <Link href={`/directory/${b.slug}`} className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}>View public page <ExternalLink className="size-3.5" aria-hidden /></Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <EditRequestForm open onOpenChange={(o) => !o && setEditing(null)} business={editing} caps={caps} />}
    </>
  );
}
