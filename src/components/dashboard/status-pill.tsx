import { cn } from "@/lib/utils";
import type { CampaignDisplayStatus, EditRequestStatus, InvoiceStatus, BadgeRequestStatus } from "@/types";
import type { SubscriptionTone } from "@/features/membership/access";
import { STATUS_LABEL as CAMPAIGN_LABEL } from "@/features/advertising/rules";
import { EDIT_STATUS_LABEL } from "@/features/business/changes";

export type Tone = SubscriptionTone | "info";

const toneStyles: Record<Tone, string> = {
  good: "bg-olive-100 text-olive-800 ring-olive-300",
  warn: "bg-brass-soft text-sand-700 ring-brass/40",
  bad: "bg-destructive/10 text-destructive ring-destructive/30",
  info: "bg-sand-100 text-olive-900 ring-sand-300",
  neutral: "bg-sand-200 text-sand-700 ring-sand-300",
};

/** Colour + dot + text status chip (never colour alone). */
export function StatusPill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", toneStyles[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

export const editStatusTone: Record<EditRequestStatus, Tone> = { pending: "warn", approved: "good", rejected: "bad", changes_requested: "info" };
export const EditStatusPill = ({ status }: { status: EditRequestStatus }) => <StatusPill tone={editStatusTone[status]}>{EDIT_STATUS_LABEL[status]}</StatusPill>;

const badgeReqTone: Record<BadgeRequestStatus, Tone> = { pending: "warn", approved: "good", rejected: "bad" };
export const BadgeRequestPill = ({ status }: { status: BadgeRequestStatus }) => (
  <StatusPill tone={badgeReqTone[status]}>{status === "pending" ? "Pending review" : status === "approved" ? "Approved" : "Rejected"}</StatusPill>
);

const campaignTone: Record<CampaignDisplayStatus, Tone> = {
  draft: "neutral", pending_review: "warn", changes_requested: "info", rejected: "bad", approved: "info",
  scheduled: "info", active: "good", completed: "neutral", expired: "neutral",
};
export const CampaignStatusPill = ({ status }: { status: CampaignDisplayStatus }) => <StatusPill tone={campaignTone[status]}>{CAMPAIGN_LABEL[status]}</StatusPill>;

const invoiceTone: Record<InvoiceStatus, Tone> = { paid: "good", pending: "warn", failed: "bad", refunded: "neutral" };
export const InvoiceStatusPill = ({ status }: { status: InvoiceStatus }) => <StatusPill tone={invoiceTone[status]} className="capitalize">{status}</StatusPill>;
