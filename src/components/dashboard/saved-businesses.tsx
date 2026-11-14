"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, BookmarkX, MapPin } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { BadgeRow } from "@/components/badges/business-badge";
import { UsageMeter } from "@/components/membership/feature-access";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { limitOf } from "@/features/membership/access";
import { useResolvedPlan } from "@/features/membership/hooks";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCategories } from "@/hooks/use-categories";
import { useSession } from "@/hooks/use-session";
import { useStore } from "@/hooks/use-store";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { savedService, savedStore } from "@/services/member-service";

export function SavedBusinesses() {
  const user = useSession();
  const audience = user?.userType === "veteran" ? "veteran" : "civilian";
  const plan = useResolvedPlan(audience, user?.id);
  const saved = useStore(savedStore);
  const { businesses } = useBusinesses();
  const { categoryName } = useCategories();
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      saved
        .filter((s) => s.userId === user?.id)
        .flatMap((s) => {
          const b = businesses.find((x) => x.id === s.businessId && x.status === "active");
          return b ? [{ saved: s, business: b }] : [];
        })
        .sort((a, b) => b.saved.savedOn.localeCompare(a.saved.savedOn)),
    [saved, businesses, user?.id],
  );

  if (!user) return null;

  async function remove(businessId: string, name: string) {
    setBusyId(businessId);
    try {
      await savedService.toggle(user!.id, businessId, limitOf(plan, "saved_businesses"));
      toast.success(`Removed ${name}`);
    } catch (e) {
      toast.error("Couldn't update saved businesses", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Saved businesses"
        description="Businesses you bookmarked from the directory."
        actions={<Link href="/directory" className={buttonVariants({ variant: "outline" })}>Browse the directory</Link>}
      />
      <div className="mb-6 max-w-md rounded-lg border bg-card p-4 shadow-card">
        <UsageMeter plan={plan} featureId="saved_businesses" used={rows.length} label="Saved businesses" />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Bookmark} title="Nothing saved yet" description="Open any business in the directory and choose Save to keep it here.">
          <Link href="/directory" className={cn(buttonVariants(), "mt-6")}>Find businesses</Link>
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ saved: s, business: b }) => (
            <li key={s.id} className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-card">
              <Link href={`/directory/${b.slug}`} className="group relative block aspect-[16/9] bg-sand-200">
                <Image src={b.coverImage} alt="" fill sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <Link href={`/directory/${b.slug}`} className="text-lg font-semibold text-olive-950 hover:text-olive-700">{b.name}</Link>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 text-olive-600" aria-hidden /> {b.city}, {b.state} · {categoryName(b.category)}
                </p>
                <BadgeRow businessId={b.id} className="mt-3" max={3} />
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <span className="text-xs text-muted-foreground">Saved {formatDate(s.savedOn)}</span>
                  <Button variant="outline" size="sm" disabled={busyId === b.id} onClick={() => remove(b.id, b.name)}>
                    <BookmarkX /> Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
