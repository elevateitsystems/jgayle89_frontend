"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { limitOf } from "@/features/membership/access";
import { useResolvedPlan } from "@/features/membership/hooks";
import { useSession } from "@/hooks/use-session";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
import { savedService, savedStore } from "@/services/member-service";

/** "Save" for Veteran and Civilian members (plan-limited). Guests are sent to sign in; staff and owners don't see it. */
export function SaveBusinessButton({ businessId, businessName }: { businessId: string; businessName: string }) {
  const user = useSession();
  const pathname = usePathname();
  const saved = useStore(savedStore);
  const audience = user?.userType === "veteran" ? "veteran" : "civilian";
  const plan = useResolvedPlan(audience, user?.id);
  const [busy, setBusy] = useState(false);

  if (user && (user.role !== "user" || user.userType === "business_owner")) return null;
  if (!user) {
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
        <Bookmark /> Save
      </Link>
    );
  }

  const isSaved = saved.some((s) => s.userId === user.id && s.businessId === businessId);

  async function toggle() {
    setBusy(true);
    try {
      const nowSaved = await savedService.toggle(user!.id, businessId, limitOf(plan, "saved_businesses"));
      toast.success(nowSaved ? `Saved ${businessName}` : `Removed ${businessName} from saved`);
    } catch (e) {
      toast.error("Couldn't save this business", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant={isSaved ? "default" : "outline"} size="lg" onClick={toggle} disabled={busy} aria-pressed={isSaved}>
      {isSaved ? <BookmarkCheck /> : <Bookmark />} {isSaved ? "Saved" : "Save"}
    </Button>
  );
}
