"use client";

import { cn } from "@/lib/utils";
import type { BillingCycle } from "@/types";

/** Monthly / Annual segmented control. `savingsLabel` (e.g. "Save up to 17%") is shown beside Annual. */
export function PricingToggle({ value, onChange, savingsLabel, className }: { value: BillingCycle; onChange: (v: BillingCycle) => void; savingsLabel?: string; className?: string }) {
  const options: { id: BillingCycle; label: string }[] = [
    { id: "monthly", label: "Monthly" },
    { id: "annual", label: "Annual" },
  ];
  return (
    <div role="radiogroup" aria-label="Billing period" className={cn("inline-flex rounded-md border border-input bg-white p-0.5", className)}>
      {options.map((o) => {
        const selected = value === o.id;
        return (
          <label
            key={o.id}
            className={cn(
              "inline-flex h-10 cursor-pointer items-center gap-2 rounded-[5px] px-4 text-sm font-medium transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
              selected ? "bg-olive-700 text-white" : "text-foreground hover:bg-sand-100",
            )}
          >
            <input type="radio" name="billing-cycle" value={o.id} checked={selected} onChange={() => onChange(o.id)} className="sr-only" />
            {o.label}
            {o.id === "annual" && savingsLabel && (
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", selected ? "bg-white/20 text-white" : "bg-brass-soft text-sand-700")}>{savingsLabel}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}
