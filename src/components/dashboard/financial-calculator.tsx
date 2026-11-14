"use client";

import { useMemo, useState } from "react";
import { Calculator, Home, Lock, Wallet } from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/dashboard/panel";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasFeature } from "@/features/membership/access";
import { useResolvedPlan } from "@/features/membership/hooks";
import { cn } from "@/lib/utils";
import type { PlanAudience } from "@/types";

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function NumberField({ id, label, value, onChange, step = 1, suffix }: { id: string; label: string; value: number; onChange: (n: number) => void; step?: number; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-olive-950">{label}</Label>
      <div className="relative">
        <Input id={id} type="number" inputMode="decimal" min={0} step={step} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} className={suffix ? "pr-12" : undefined} />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

/** Basic budget tool (free for everyone) and a home-loan planner (needs `financial_advanced`). Calculations run locally. */
export function FinancialCalculator({ audience, userId }: { audience: Exclude<PlanAudience, "business">; userId: string }) {
  const plan = useResolvedPlan(audience, userId);
  const advanced = hasFeature(plan, "financial_advanced");
  const [tool, setTool] = useState<"budget" | "loan">("budget");

  return (
    <div id="calculator" className="scroll-mt-24 space-y-4">
      <div role="tablist" aria-label="Financial tools" className="inline-flex rounded-md border border-input bg-white p-0.5">
        {[
          { id: "budget" as const, label: "Monthly budget", icon: Wallet, locked: false },
          { id: "loan" as const, label: "Home-loan planner", icon: Home, locked: !advanced },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tool === t.id}
            onClick={() => setTool(t.id)}
            className={cn("inline-flex h-10 items-center gap-2 rounded-[5px] px-4 text-sm font-medium transition-colors", tool === t.id ? "bg-olive-700 text-white" : "hover:bg-sand-100")}
          >
            <t.icon className="size-4" aria-hidden /> {t.label} {t.locked && <Lock className="size-3.5 opacity-70" aria-label="Requires a paid plan" />}
          </button>
        ))}
      </div>

      {tool === "budget" ? (
        <BudgetTool />
      ) : advanced ? (
        <LoanTool />
      ) : (
        <Panel title="Home-loan planner">
          <p className="flex items-start gap-2 text-sm text-muted-foreground"><Lock className="mt-0.5 size-4 shrink-0" aria-hidden /> The advanced planners are included with a paid plan.</p>
          <Link href="/dashboard/membership" className={cn(buttonVariants(), "mt-4")}>See plans</Link>
        </Panel>
      )}
    </div>
  );
}

function BudgetTool() {
  const [v, setV] = useState({ income: 4200, housing: 1400, food: 600, transport: 450, other: 700 });
  const set = (k: keyof typeof v) => (n: number) => setV((s) => ({ ...s, [k]: n }));
  const spend = v.housing + v.food + v.transport + v.other;
  const left = v.income - spend;
  return (
    <Panel title="Monthly budget" subtitle="Rough planning only — nothing is saved or shared.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField id="b-income" label="Monthly income" value={v.income} onChange={set("income")} suffix="USD" />
          <NumberField id="b-housing" label="Housing" value={v.housing} onChange={set("housing")} suffix="USD" />
          <NumberField id="b-food" label="Food" value={v.food} onChange={set("food")} suffix="USD" />
          <NumberField id="b-transport" label="Transportation" value={v.transport} onChange={set("transport")} suffix="USD" />
          <NumberField id="b-other" label="Everything else" value={v.other} onChange={set("other")} suffix="USD" />
        </div>
        <dl className="space-y-3 rounded-lg bg-sand-50 p-5 text-sm" aria-live="polite">
          <div className="flex justify-between"><dt className="text-muted-foreground">Total spending</dt><dd className="font-semibold tabular-nums">{money(spend)}</dd></div>
          <div className="flex justify-between border-t pt-3 text-base"><dt className="font-semibold">Left each month</dt><dd className={cn("font-heading text-2xl font-semibold tabular-nums", left < 0 ? "text-destructive" : "text-olive-800")}>{money(left)}</dd></div>
          <p className="text-xs text-muted-foreground">{left < 0 ? "You're planning to spend more than you earn." : v.income > 0 ? `That's ${Math.round((left / v.income) * 100)}% of your income.` : ""}</p>
        </dl>
      </div>
    </Panel>
  );
}

function LoanTool() {
  const [v, setV] = useState({ price: 320000, down: 20000, rate: 6.25, years: 30 });
  const set = (k: keyof typeof v) => (n: number) => setV((s) => ({ ...s, [k]: n }));
  const out = useMemo(() => {
    const principal = Math.max(0, v.price - v.down);
    const n = Math.max(1, v.years * 12);
    const r = v.rate / 100 / 12;
    const payment = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
    return { principal, payment, interest: payment * n - principal };
  }, [v]);
  return (
    <Panel title="Home-loan planner" subtitle="Estimate only. Taxes, insurance and fees are not included.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField id="l-price" label="Home price" value={v.price} onChange={set("price")} suffix="USD" step={1000} />
          <NumberField id="l-down" label="Down payment" value={v.down} onChange={set("down")} suffix="USD" step={1000} />
          <NumberField id="l-rate" label="Interest rate" value={v.rate} onChange={set("rate")} suffix="%" step={0.125} />
          <NumberField id="l-years" label="Term" value={v.years} onChange={set("years")} suffix="years" />
        </div>
        <dl className="space-y-3 rounded-lg bg-sand-50 p-5 text-sm" aria-live="polite">
          <div className="flex justify-between"><dt className="text-muted-foreground">Loan amount</dt><dd className="font-semibold tabular-nums">{money(out.principal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Total interest</dt><dd className="font-semibold tabular-nums">{money(out.interest)}</dd></div>
          <div className="flex justify-between border-t pt-3 text-base"><dt className="flex items-center gap-1.5 font-semibold"><Calculator className="size-4" aria-hidden /> Monthly payment</dt><dd className="font-heading text-2xl font-semibold tabular-nums text-olive-800">{money(out.payment)}</dd></div>
        </dl>
      </div>
    </Panel>
  );
}
