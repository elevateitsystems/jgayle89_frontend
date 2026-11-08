import {
  Accessibility,
  Briefcase,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  House,
  ReceiptText,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { benefitCategoryName } from "@/data/benefit-categories";
import { stateName } from "@/data/us-states";
import { cn } from "@/lib/utils";
import type { Benefit, BenefitCategory } from "@/types";

export const benefitCategoryIcon: Record<BenefitCategory, LucideIcon> = {
  education: GraduationCap,
  healthcare: HeartPulse,
  housing: House,
  employment: Briefcase,
  disability: Accessibility,
  tax: ReceiptText,
  financial: Wallet,
};

export function CategoryBadge({ category }: { category: BenefitCategory }) {
  const Icon = benefitCategoryIcon[category];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-olive-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-olive-800">
      <Icon className="size-3.5" aria-hidden /> {benefitCategoryName(category)}
    </span>
  );
}

export function ScopeBadge({ benefit }: { benefit: Pick<Benefit, "scope" | "state"> }) {
  const federal = benefit.scope === "federal";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-wider",
        federal ? "bg-brass-soft text-sand-700" : "bg-sky-100 text-sky-800",
      )}
    >
      {federal ? "Federal · all states" : stateName(benefit.state)}
    </span>
  );
}

/** Shown on every record whose details haven't been reviewed against the official source yet. */
export function DataStatusBadge({ status }: { status: Benefit["dataStatus"] }) {
  if (status === "verified") return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-sand-200 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-sand-700">
      <FlaskConical className="size-3" aria-hidden /> Sample summary
    </span>
  );
}
