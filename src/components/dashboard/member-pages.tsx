"use client";

import { PageHeader } from "@/components/admin/page-header";
import { AccountSummary, ProfileCard } from "@/components/account/account-client";
import { FinancialCalculator } from "@/components/dashboard/financial-calculator";
import { MemberOverview } from "@/components/dashboard/member-overview";
import { OwnerOverview } from "@/components/dashboard/owner-overview";
import { Panel } from "@/components/dashboard/panel";
import { ResourceCatalog } from "@/components/dashboard/resource-catalog";
import { MembershipManager } from "@/components/membership/membership-manager";
import { Switch } from "@/components/ui/switch";
import { personaOf } from "@/features/dashboard/nav";
import { useSession } from "@/hooks/use-session";
import { useState } from "react";
import type { AppUser } from "@/types";

const asAudience = (u: AppUser) => (u.userType === "veteran" ? "veteran" : "civilian") as "veteran" | "civilian";

/** /dashboard — the overview that matches the signed-in account type. */
export function DashboardHome() {
  const user = useSession();
  if (!user) return null;
  return personaOf(user) === "business_owner" ? <OwnerOverview user={user} /> : <MemberOverview user={user} />;
}

/** Veteran / Civilian → My Membership. */
export function MyMembershipPage() {
  const user = useSession();
  if (!user) return null;
  return (
    <>
      <PageHeader title="My membership" description="Your plan, renewal date, billing history and what each plan includes." />
      <MembershipManager mode="manage" audience={asAudience(user)} subjectId={user.id} user={user} />
    </>
  );
}

export function FinancialToolsPage() {
  const user = useSession();
  if (!user) return null;
  const audience = asAudience(user);
  return (
    <>
      <PageHeader title="Financial tools" description="Planning calculators and trusted guides. Basic tools are free; advanced planners come with a paid plan." />
      <div className="space-y-8">
        <FinancialCalculator audience={audience} userId={user.id} />
        <section aria-labelledby="fin-guides">
          <h2 id="fin-guides" className="mb-4 text-xl font-semibold text-olive-950">Guides &amp; tools</h2>
          <ResourceCatalog kinds={["financial-tool", "financial-education"]} audience={audience} userId={user.id} searchLabel="Search financial resources" />
        </section>
      </div>
    </>
  );
}

export function FinancialEducationPage() {
  const user = useSession();
  if (!user) return null;
  const audience = asAudience(user);
  return (
    <>
      <PageHeader title="Financial education" description="Plain-language guidance on credit, saving, homebuying and protecting your family's finances." />
      <div className="space-y-8">
        <ResourceCatalog kinds={["financial-education", "financial-tool"]} audience={audience} userId={user.id} searchLabel="Search financial education" />
        <FinancialCalculator audience={audience} userId={user.id} />
      </div>
    </>
  );
}

export function CareerPage() {
  const user = useSession();
  if (!user) return null;
  return (
    <>
      <PageHeader title="Career resources" description="Job boards, training and coaching for veterans and the people who support them." />
      <ResourceCatalog kinds={["career"]} audience={asAudience(user)} userId={user.id} searchLabel="Search career resources" />
    </>
  );
}

export function CommunityPage() {
  const user = useSession();
  if (!user) return null;
  return (
    <>
      <PageHeader title="Community resources" description="Help with food, housing, health and more — free for everyone, no membership required." />
      <ResourceCatalog kinds={["community"]} audience={asAudience(user)} userId={user.id} searchLabel="Search community resources" showSponsors />
    </>
  );
}

/** Account Settings for every member type: profile + notification preferences (preferences are local-only in this demo). */
export function AccountSettings() {
  const user = useSession();
  if (!user) return null;
  return (
    <>
      <PageHeader title="Account settings" description="Update your profile and choose which emails you'd like to receive." />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <ProfileCard user={user} />
          <NotificationPrefs user={user} />
        </div>
        <div className="space-y-5 lg:col-span-5">
          <AccountSummary user={user} />
        </div>
      </div>
    </>
  );
}

const PREFS = [
  { id: "product", label: "Product updates", hint: "New features and improvements." },
  { id: "events", label: "Community events", hint: "Events near you." },
  { id: "billing", label: "Billing reminders", hint: "Renewals and receipts." },
] as const;

function NotificationPrefs({ user }: { user: AppUser }) {
  const key = `sitrep:prefs:${user.id}`;
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try {
      return { product: true, events: true, billing: true, ...(JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<string, boolean>) };
    } catch {
      return { product: true, events: true, billing: true };
    }
  });
  function toggle(id: string, v: boolean) {
    const next = { ...prefs, [id]: v };
    setPrefs(next);
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage unavailable — preference lives in memory only */
    }
  }
  return (
    <Panel title="Email preferences" subtitle="Saved in this browser for the demo.">
      <ul className="divide-y divide-sand-200">
        {PREFS.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <label htmlFor={`pref-${p.id}`} className="min-w-0 flex-1 cursor-pointer">
              <span className="block text-sm font-medium text-olive-950">{p.label}</span>
              <span className="block text-xs text-muted-foreground">{p.hint}</span>
            </label>
            <Switch id={`pref-${p.id}`} checked={prefs[p.id]} onCheckedChange={(v) => toggle(p.id, v)} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

