"use client";

import { useState } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { StatusPill, type Tone } from "@/components/dashboard/status-pill";
import { EmptyState } from "@/components/shared/empty-state";
import { NativeSelect } from "@/components/ui/native-select";
import type { Business, ListingStatus } from "@/types";

/** Keeps track of which of an owner's businesses a page is showing. Falls back to the first one. */
export function useSelectedBusiness(businesses: Business[]) {
  const [id, setId] = useState("");
  const selected = businesses.find((b) => b.id === id) ?? businesses[0];
  return { selected, setId };
}

/** Only renders when there is something to choose between. */
export function BusinessPicker({ businesses, value, onChange, label = "Business", id = "biz-picker" }: { businesses: Business[]; value: string | undefined; onChange: (id: string) => void; label?: string; id?: string }) {
  if (businesses.length < 2) return null;
  return (
    <div className="mb-6 flex max-w-md flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-olive-950">{label}</label>
      <NativeSelect id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {businesses.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.city}, {b.state}</option>)}
      </NativeSelect>
    </div>
  );
}

export const LISTING_LABEL: Record<ListingStatus, string> = { active: "Published", pending: "Pending approval", draft: "Draft · not public" };
const LISTING_TONE: Record<ListingStatus, Tone> = { active: "good", pending: "warn", draft: "neutral" };
export const ListingStatusPill = ({ status }: { status: ListingStatus }) => <StatusPill tone={LISTING_TONE[status]}>{LISTING_LABEL[status]}</StatusPill>;

/** Shown when an account has no businesses attached. */
export function NoBusinesses() {
  return (
    <EmptyState icon={Store} title="No businesses linked to your account" description="Listings are connected to owner accounts by Mission: SITREP staff. Contact support to claim your business.">
      <Link href="/directory" className="mt-6 text-sm font-semibold text-olive-700 hover:underline">Browse the public directory</Link>
    </EmptyState>
  );
}
