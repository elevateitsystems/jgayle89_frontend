"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileEdit, Info } from "lucide-react";
import { AnalyticsView } from "./analytics-view";
import { EditRequestForm } from "./edit-request-form";
import { HiringToggle } from "./hiring-toggle";
import { ListingStatusPill } from "./business-picker";
import { useEditCaps } from "./owner-edit-requests";
import { SocialLinksList } from "./social-links";
import { EditStatusPill, StatusPill } from "@/components/dashboard/status-pill";
import { OwnerBadgesPanel } from "@/components/badges/owner-badges";
import { Panel } from "@/components/dashboard/panel";
import { EmptyState } from "@/components/shared/empty-state";
import { SubscriptionStatusBadge } from "@/components/membership/subscription-summary";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { summarizeChanges } from "@/features/business/changes";
import { useOwnerEditRequests } from "@/features/business/hooks";
import { useResolvedPlan, useSubscriptionFor } from "@/features/membership/hooks";
import { useBusiness } from "@/hooks/use-businesses";
import { useCategories } from "@/hooks/use-categories";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";

/** Owner → one business: details, tier, status, hiring, analytics (plan-gated), badges and edit requests. Read-only listing data. */
export function BusinessDetailOwner({ id }: { id: string }) {
  const user = useSession();
  const { business: b, loading } = useBusiness({ id });
  const plan = useResolvedPlan("business", id);
  const sub = useSubscriptionFor("business", id);
  const requests = useOwnerEditRequests(user?.id);
  const { categoryName } = useCategories();
  const caps = useEditCaps(id);
  const [editing, setEditing] = useState(false);
  const mine = useMemo(() => requests.filter((r) => r.businessId === id), [requests, id]);

  if (loading && !b) return <Skeleton className="h-96 w-full" />;
  // Owners can only open businesses they own.
  if (!b || b.ownerId !== user?.id) {
    return (
      <EmptyState title="Business not found" description="This business doesn't exist or isn't linked to your account.">
        <Link href="/dashboard/businesses" className={cn(buttonVariants(), "mt-6")}>Back to my businesses</Link>
      </EmptyState>
    );
  }

  const pending = mine.filter((r) => r.status === "pending").length;

  return (
    <>
      <Link href="/dashboard/businesses" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-olive-700 hover:underline"><ArrowLeft className="size-4" aria-hidden /> My businesses</Link>

      <header className="mb-6 flex flex-col gap-4 overflow-hidden rounded-lg border bg-card shadow-card sm:flex-row">
        <div className="relative aspect-[16/9] bg-sand-200 sm:aspect-auto sm:w-64"><Image src={b.coverImage} alt="" fill sizes="256px" className="object-cover" /></div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <ListingStatusPill status={b.status} />
            <StatusPill tone="info">{plan?.name ?? "Free"} plan</StatusPill>
            <SubscriptionStatusBadge subscription={sub} />
          </div>
          <h1 className="text-2xl font-semibold text-olive-950 sm:text-3xl">{b.name}</h1>
          <p className="text-sm text-muted-foreground">{categoryName(b.category)} · {b.city}, {b.state}</p>
          <div className="mt-auto flex flex-wrap gap-2">
            <Button onClick={() => setEditing(true)}><FileEdit /> Request an edit</Button>
            {b.status === "active" && <Link href={`/directory/${b.slug}`} className={buttonVariants({ variant: "outline" })}>View public page <ExternalLink className="size-3.5" aria-hidden /></Link>}
          </div>
        </div>
      </header>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 h-auto flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="overview" className="h-9 px-3">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="h-9 px-3">Analytics</TabsTrigger>
          <TabsTrigger value="badges" className="h-9 px-3">Badges</TabsTrigger>
          <TabsTrigger value="requests" className="h-9 px-3">Edit requests{pending > 0 ? ` (${pending})` : ""}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <p className="flex items-start gap-2 rounded-md border border-sand-300 bg-sand-100 px-3 py-2.5 text-sm text-sand-700">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>This is how your listing currently appears. To change anything other than hiring status, submit an edit request — staff review it before it goes live.</span>
          </p>
          <div className="grid gap-6 lg:grid-cols-3">
            <Panel title="Listing details" className="lg:col-span-2">
              <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                {[
                  ["Tagline", b.tagline],
                  ["Phone", b.phone],
                  ["Email", b.email],
                  ["Website", b.website || "—"],
                  ["Address", `${b.address}, ${b.city}, ${b.state} ${b.zip}`],
                  ["Hours", b.hours || "—"],
                  ["Services", b.services.join(", ") || "—"],
                ].map(([k, v]) => (
                  <div key={k}><dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{k}</dt><dd className="mt-0.5 break-words">{v}</dd></div>
                ))}
              </dl>
              <h3 className="mb-2 mt-6 font-sans text-sm font-semibold text-olive-950">Social media links</h3>
              <SocialLinksList links={b.socialLinks ?? []} />
            </Panel>
            <div className="space-y-6">
              <Panel title="Hiring status" subtitle="Updates your public listing right away">
                <HiringToggle business={b} />
              </Panel>
              <Panel title="Membership">
                <p className="text-sm"><strong>{plan?.name ?? "Free"}</strong> plan{sub?.renewsOn && sub.status !== "canceled" ? ` · renews ${formatDate(sub.renewsOn)}` : ""}</p>
                <Link href="/dashboard/memberships" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}>Manage membership</Link>
              </Panel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics"><AnalyticsView business={b} /></TabsContent>
        <TabsContent value="badges"><OwnerBadgesPanel business={b} /></TabsContent>
        <TabsContent value="requests">
          {mine.length === 0 ? (
            <EmptyState icon={FileEdit} title="No edit requests for this business" description="Submit a request when you want to change your listing." actionLabel="Request an edit" onAction={() => setEditing(true)} />
          ) : (
            <ul className="divide-y divide-sand-200 rounded-lg border bg-card shadow-card">
              {mine.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0"><p className="truncate font-medium text-olive-950">{summarizeChanges(r.changes)}</p><p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p></div>
                  <EditStatusPill status={r.status} />
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/edit-requests" className="mt-4 inline-block text-sm font-semibold text-olive-700 hover:underline">Open full request history</Link>
        </TabsContent>
      </Tabs>

      <EditRequestForm open={editing} onOpenChange={setEditing} business={b} caps={caps} />
    </>
  );
}
