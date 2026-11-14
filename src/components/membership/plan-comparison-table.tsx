import { Check, Minus } from "lucide-react";
import { formatLimit, formatPrice, groupFeatures, priceFor } from "@/features/membership/access";
import { cn } from "@/lib/utils";
import type { AdProduct, BillingCycle, MembershipPlan, PlanFeatureDef } from "@/types";

interface Props {
  plans: MembershipPlan[];
  defs: PlanFeatureDef[];
  cycle: BillingCycle;
  currentPlanId?: string;
  /** Include a row summarising each plan's included advertising allowance (business plans). */
  showAdAllowances?: boolean;
  products?: AdProduct[];
}

/** Feature comparison. Scrolls horizontally on small screens; the feature column stays pinned. */
export function PlanComparisonTable({ plans, defs, cycle, currentPlanId, showAdAllowances, products = [] }: Props) {
  const groups = groupFeatures(defs);
  const colCls = (p: MembershipPlan) => cn("min-w-[8.5rem] px-4 py-3 text-center", p.id === currentPlanId && "bg-olive-50");

  return (
    <div className="relative overflow-x-auto rounded-lg border bg-card shadow-card">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Compare membership plans feature by feature</caption>
        <thead>
          <tr className="border-b border-sand-200">
            <th scope="col" className="sticky left-0 z-10 min-w-48 bg-card px-4 py-4 text-left text-sm font-semibold text-olive-950">Features</th>
            {plans.map((p) => (
              <th key={p.id} scope="col" className={cn(colCls(p), "py-4 align-bottom")}>
                <span className="block text-base font-semibold text-olive-950">{p.name}</span>
                <span className="block text-xs font-normal text-muted-foreground">{p.monthlyPrice === 0 ? "Free" : `${formatPrice(priceFor(p, cycle))}/${cycle === "annual" ? "yr" : "mo"}`}</span>
                {p.id === currentPlanId && <span className="mt-1 inline-block rounded-full bg-olive-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Current</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <GroupRows key={g.group} group={g.group} features={g.features} plans={plans} colCls={colCls} />
          ))}
          {showAdAllowances && (
            <>
              <tr className="bg-sand-100"><th scope="colgroup" colSpan={plans.length + 1} className="sticky left-0 px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-olive-700">Included advertising (per month)</th></tr>
              {products.filter((p) => plans.some((pl) => (pl.adAllowances[p.id] ?? 0) > 0)).map((prod) => (
                <tr key={prod.id} className="border-b border-sand-200 last:border-0">
                  <th scope="row" className="sticky left-0 z-10 bg-card px-4 py-3 text-left font-medium">{prod.name}</th>
                  {plans.map((pl) => {
                    const n = pl.adAllowances[prod.id] ?? 0;
                    return <td key={pl.id} className={colCls(pl)}>{n > 0 ? <span className="font-semibold text-olive-900">{n} / mo</span> : <Dash />}</td>;
                  })}
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Dash() {
  return (
    <>
      <Minus className="mx-auto size-4 text-muted-foreground/60" aria-hidden />
      <span className="sr-only">Not included</span>
    </>
  );
}

function GroupRows({ group, features, plans, colCls }: { group: string; features: PlanFeatureDef[]; plans: MembershipPlan[]; colCls: (p: MembershipPlan) => string }) {
  return (
    <>
      <tr className="bg-sand-100">
        <th scope="colgroup" colSpan={plans.length + 1} className="sticky left-0 px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-olive-700">{group}</th>
      </tr>
      {features.map((f) => (
        <tr key={f.id} className="border-b border-sand-200 last:border-0">
          <th scope="row" className="sticky left-0 z-10 bg-card px-4 py-3 text-left font-medium">
            {f.label}
            <span className="block text-xs font-normal text-muted-foreground">{f.description}</span>
          </th>
          {plans.map((p) => {
            const v = p.features[f.id];
            return (
              <td key={p.id} className={colCls(p)}>
                {!v?.enabled ? (
                  <Dash />
                ) : f.kind === "limit" ? (
                  <span className="font-semibold text-olive-900">{formatLimit(f, v)}</span>
                ) : (
                  <>
                    <Check className="mx-auto size-4 text-olive-600" aria-hidden />
                    <span className="sr-only">Included</span>
                  </>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
