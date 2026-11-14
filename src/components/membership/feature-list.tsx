import { Check, Minus } from "lucide-react";
import { formatLimit } from "@/features/membership/access";
import { cn } from "@/lib/utils";
import type { MembershipPlan, PlanFeatureDef } from "@/types";

/**
 * A plan's features as a checklist. Included features come first; with `max`, the rest are summarised
 * as "+N more" so cards stay compact (the comparison table lists everything).
 */
export function FeatureList({ plan, defs, max, showMissing = false, className }: { plan: MembershipPlan; defs: PlanFeatureDef[]; max?: number; showMissing?: boolean; className?: string }) {
  const included = defs.filter((d) => plan.features[d.id]?.enabled);
  const missing = showMissing ? defs.filter((d) => !plan.features[d.id]?.enabled) : [];
  const shown = max ? included.slice(0, max) : included;
  const hidden = included.length - shown.length;

  return (
    <ul className={cn("space-y-2.5 text-sm", className)}>
      {shown.map((d) => {
        const v = plan.features[d.id];
        return (
          <li key={d.id} className="flex items-start gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-olive-600" aria-hidden />
            <span>
              {d.label}
              {d.kind === "limit" && <span className="font-semibold text-olive-900"> · {formatLimit(d, v)}</span>}
            </span>
          </li>
        );
      })}
      {hidden > 0 && <li className="pl-6.5 text-xs text-muted-foreground">+ {hidden} more included</li>}
      {missing.map((d) => (
        <li key={d.id} className="flex items-start gap-2.5 text-muted-foreground">
          <Minus className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span><span className="sr-only">Not included: </span>{d.label}</span>
        </li>
      ))}
    </ul>
  );
}
