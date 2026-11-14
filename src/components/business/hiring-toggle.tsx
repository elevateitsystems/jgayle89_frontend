"use client";

import { useState } from "react";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { businessService } from "@/services/business-service";
import type { Business } from "@/types";

/**
 * Hiring status — the one listing field owners change directly (no review). It appears on the public
 * profile and directory card as soon as it's saved.
 */
export function HiringToggle({ business, className }: { business: Business; className?: string }) {
  const user = useSession();
  const [pending, setPending] = useState(false);
  const hiring = !!business.hiring;
  const id = `hiring-${business.id}`;

  async function change(next: boolean) {
    if (!user) return;
    setPending(true);
    try {
      await businessService.setHiring(business.id, user.id, next);
      toast.success(next ? `${business.name} is now marked as hiring` : `${business.name} is marked as not hiring`);
    } catch (e) {
      toast.error("Couldn't update hiring status", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <label htmlFor={id} className="flex min-w-0 cursor-pointer items-center gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", hiring ? "bg-olive-700 text-white" : "bg-sand-200 text-sand-700")}>
          <Briefcase className="size-4" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-olive-950">{business.name}</span>
          <span className="block text-xs text-muted-foreground" aria-live="polite">{hiring ? "Currently hiring" : "Not hiring"}</span>
        </span>
      </label>
      <Switch id={id} checked={hiring} disabled={pending} onCheckedChange={change} aria-label={`${business.name}: currently hiring`} />
    </div>
  );
}

/** Small public-facing chip. Shown on directory cards and business profiles. */
export function HiringChip({ hiring, className }: { hiring?: boolean; className?: string }) {
  if (!hiring) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-olive-700 px-2 py-0.5 text-[11px] font-semibold text-white", className)}>
      <Briefcase className="size-3" aria-hidden /> Hiring
    </span>
  );
}
