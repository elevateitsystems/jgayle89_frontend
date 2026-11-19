"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { AdminBusinessLink } from "./entity-links";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { MemberIdentityBadges } from "@/components/account/member-identity";
import { Panel } from "@/components/dashboard/panel";
import { StatusPill } from "@/components/dashboard/status-pill";
import { SubscriptionStatusBadge } from "@/components/membership/subscription-summary";
import { ORDER_STATUS } from "@/components/services/services-catalog";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { SERVICE_STATUS_LABEL } from "@/features/profile/profile";
import { findSubscription, formatPrice, resolvePlan } from "@/features/membership/access";
import { useAllPlans, useSubscriptions } from "@/features/membership/hooks";
import { useBusinesses } from "@/hooks/use-businesses";
import { useStore } from "@/hooks/use-store";
import { formatDate, formatTime } from "@/lib/date";
import { ROLE_LABEL, STAFF_PERMISSIONS, USER_TYPE_LABEL } from "@/lib/permissions";
import { stateName } from "@/data/us-states";
import { orderStore } from "@/services/marketplace-service";
import { appointmentStore } from "@/services/member-service";
import { userStore } from "@/services/user-service";

/** Admin → a member's management page: the target of every clickable member name (client update §8). */
export function MemberDetailAdmin({ id }: { id: string }) {
  const users = useStore(userStore);
  const user = users.find((u) => u.id === id);
  const plans = useAllPlans();
  const subs = useSubscriptions();
  const appts = useStore(appointmentStore);
  const orders = useStore(orderStore);
  const { businesses } = useBusinesses();

  const mine = useMemo(() => ({
    appts: appts.filter((a) => a.userId === id).sort((a, b) => b.date.localeCompare(a.date)),
    orders: orders.filter((o) => o.buyerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    owned: businesses.filter((b) => b.ownerId === id),
    handled: appts.filter((a) => a.assignedTo === id).length,
  }), [appts, orders, businesses, id]);

  if (!user) {
    return (
      <EmptyState title="Member not found" description="This account may have been removed.">
        <Link href="/admin/users" className={`${buttonVariants()} mt-6`}>Back to users</Link>
      </EmptyState>
    );
  }

  const audience = user.userType === "veteran" ? "veteran" : user.userType === "civilian" ? "civilian" : null;
  const plan = audience ? resolvePlan(plans, subs, audience, user.id) : undefined;
  const sub = audience ? findSubscription(subs, audience, user.id) : undefined;
  const m = user.military;

  return (
    <>
      <Link href="/admin/users" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-olive-700 hover:underline"><ArrowLeft className="size-4" aria-hidden /> All users</Link>
      <PageHeader title={user.name} description={`${user.email} · ${user.role === "user" && user.userType ? USER_TYPE_LABEL[user.userType] : ROLE_LABEL[user.role]} · joined ${formatDate(user.createdAt)}`} actions={<StatusBadge status={user.status} />} />
      <MemberIdentityBadges user={user} className="-mt-2 mb-6" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Profile">
          <dl className="space-y-2.5 text-sm">
            {m && (
              <>
                <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Service</dt><dd>{m.branch} · {SERVICE_STATUS_LABEL[m.status]}</dd></div>
                <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Service dates</dt><dd>{m.serviceStart} – {m.serviceEnd ?? "present"}{m.datesApproximate ? " (approximate)" : ""}</dd></div>
              </>
            )}
            {user.location && <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Residence</dt><dd>{user.location.city}, {stateName(user.location.state)} {user.location.zip}</dd></div>}
            {user.role === "staff" && (
              <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Permissions</dt><dd>{STAFF_PERMISSIONS.filter((p) => user.permissions.includes(p.id)).map((p) => p.label).join(", ") || "None"}</dd></div>
            )}
            {user.role !== "user" && <div><dt className="text-xs uppercase tracking-wider text-muted-foreground">Appointments assigned</dt><dd>{mine.handled}</dd></div>}
          </dl>
        </Panel>

        <Panel title="Membership">
          {audience ? (
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><strong>{plan?.name ?? "Free"}</strong> <SubscriptionStatusBadge subscription={sub} /></p>
              {sub?.renewsOn && <p className="text-muted-foreground">Renews {formatDate(sub.renewsOn)}</p>}
              <Link href="/admin/subscriptions" className="font-semibold text-olive-700 hover:underline">Manage subscriptions</Link>
            </div>
          ) : mine.owned.length > 0 ? (
            <ul className="space-y-1.5 text-sm">{mine.owned.map((b) => <li key={b.id}><AdminBusinessLink businessId={b.id} /></li>)}</ul>
          ) : (
            <p className="text-sm text-muted-foreground">No membership for this account type.</p>
          )}
        </Panel>

        <Panel title="Service orders">
          {mine.orders.length === 0 ? <p className="text-sm text-muted-foreground">No purchases.</p> : (
            <ul className="divide-y divide-sand-200 text-sm">
              {mine.orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0"><span className="block truncate font-medium">{o.serviceName}</span><span className="text-xs text-muted-foreground">{formatPrice(o.total)}</span></span>
                  <StatusPill tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</StatusPill>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/service-orders" className="mt-2 inline-block text-sm font-semibold text-olive-700 hover:underline">All service orders</Link>
        </Panel>
      </div>

      <Panel title="Appointments" className="mt-6" action={<Link href="/admin/appointments" className="text-sm font-semibold text-olive-700 hover:underline">All appointments</Link>}>
        {mine.appts.length === 0 ? <p className="text-sm text-muted-foreground">No appointments.</p> : (
          <ul className="divide-y divide-sand-200 text-sm">
            {mine.appts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-2">
                <span className="min-w-0 flex-1"><span className="font-medium">{a.topic}</span>{a.context && <span className="text-muted-foreground"> · {a.context.title}</span>}</span>
                <span className="text-muted-foreground">{formatDate(a.date)} · {formatTime(a.time)}</span>
                <StatusPill tone={a.status === "completed" ? "good" : a.status === "cancelled" ? "neutral" : a.status === "confirmed" ? "info" : "warn"} className="capitalize">{a.status}</StatusPill>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
