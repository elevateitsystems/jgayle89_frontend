"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Users } from "lucide-react";
import { BadgePill } from "./business-badge";
import { AdminMemberLink } from "@/components/admin/entity-links";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BusinessAvatar } from "@/components/shared/monogram";
import { buttonVariants } from "@/components/ui/button";
import { useBadgeAssignments, useBadges } from "@/features/badges/hooks";
import { useResolvedPlan } from "@/features/membership/hooks";
import { useBusinesses } from "@/hooks/use-businesses";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { userStore } from "@/services/user-service";

/** Badge holder view: business badges are surfaced through their linked demo owner/member accounts. */
export function BadgeHoldersPage({ badgeId }: { badgeId: string }) {
  const badge = useBadges().find((b) => b.id === badgeId);
  const assignments = useBadgeAssignments().filter((a) => a.badgeId === badgeId && a.status === "active" && !a.hidden);
  const { businesses } = useBusinesses();
  const users = useStore(userStore);
  const holders = assignments.flatMap((assignment) => {
    const business = businesses.find((b) => b.id === assignment.businessId);
    const member = business?.ownerId ? users.find((u) => u.id === business.ownerId) : undefined;
    return business && member ? [{ assignment, business, member }] : [];
  });

  if (!badge) return <EmptyState icon={Users} title="Badge not found" description="This badge type may have been removed." />;
  return (
    <>
      <Link href="/admin/badges" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-olive-700 hover:underline"><ArrowLeft className="size-4" /> Back to badges</Link>
      <PageHeader title={`${badge.name} holders`} description="Members linked to businesses carrying this badge. Ownership and membership are demo relationships only." />
      <div className="mb-5 rounded-lg border border-sand-300 bg-sand-100 p-4"><BadgePill badge={badge} size="md" /><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{badge.description}</p></div>
      {holders.length === 0 ? <EmptyState icon={Users} title="No linked members" description="Active assignments with a linked business owner will appear here." /> : <ul className="grid gap-4 lg:grid-cols-2">{holders.map(({ assignment, business, member }) => <HolderCard key={assignment.id} business={business} member={member} badge={badge} />)}</ul>}
    </>
  );
}

function HolderCard({ business, member, badge }: { business: import("@/types").Business; member: import("@/types").AppUser; badge: import("@/types").BusinessBadge }) {
  const plan = useResolvedPlan("business", business.id);
  return <li className="flex gap-4 rounded-lg border bg-card p-4 shadow-card"><BusinessAvatar name={member.name} className="size-14 rounded-full" textClassName="text-lg" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><AdminMemberLink userId={member.id} name={member.name} /><p className="text-xs text-muted-foreground">{member.userType?.replace("_", " ") ?? "Member"} · {plan?.name ?? "Free"} membership</p></div><BadgePill badge={badge} /></div><p className="mt-3 font-medium text-olive-950">{business.name}</p><p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {business.city}, {business.state}</span><span className="inline-flex items-center gap-1"><Mail className="size-3" /> {member.email}</span></p><Link href={`/admin/businesses/${business.id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}>View linked business</Link></div></li>;
}
