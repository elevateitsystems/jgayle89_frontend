"use client";

import Image from "next/image";
import { CheckCircle2, CircleDot, FileText, MessageSquareWarning, XCircle } from "lucide-react";
import { ChangeDiff } from "./change-diff";
import { EditStatusPill } from "@/components/dashboard/status-pill";
import { formatBytes } from "@/components/shared/attachment-uploader";
import { formatDate } from "@/lib/date";
import type { BusinessEditRequest, EditReviewEvent } from "@/types";

const EVENT_LABEL: Record<EditReviewEvent["action"], string> = {
  submitted: "Submitted",
  resubmitted: "Resubmitted",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes requested",
};
const EVENT_ICON = { submitted: CircleDot, resubmitted: CircleDot, approved: CheckCircle2, rejected: XCircle, changes_requested: MessageSquareWarning } as const;

/** Everything about one edit request. Used in the owner's history dialog and the staff review sheet. */
export function EditRequestDetail({ request: r }: { request: BusinessEditRequest }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Requested by {r.requesterName} · {formatDate(r.createdAt)}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{r.id}</p>
        </div>
        <EditStatusPill status={r.status} />
      </div>

      <section aria-labelledby="erd-reason">
        <h3 id="erd-reason" className="mb-1.5 font-sans text-sm font-semibold text-olive-950">Reason</h3>
        <p className="rounded-md border bg-white p-3 text-sm leading-relaxed">{r.reason}</p>
      </section>

      <section aria-labelledby="erd-changes">
        <h3 id="erd-changes" className="mb-2 font-sans text-sm font-semibold text-olive-950">Requested changes</h3>
        <ChangeDiff before={r.before} changes={r.changes} />
      </section>

      {r.attachments.length > 0 && (
        <section aria-labelledby="erd-files">
          <h3 id="erd-files" className="mb-2 font-sans text-sm font-semibold text-olive-950">Supporting images</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {r.attachments.map((a) => (
              <li key={a.id} className="overflow-hidden rounded-md border bg-white">
                {a.type.startsWith("image/") && a.url ? (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-[16/10] bg-sand-200">
                    <Image src={a.url} alt={a.name} fill unoptimized sizes="320px" className="object-cover" />
                  </a>
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center bg-sand-100"><FileText className="size-8 text-olive-700" aria-hidden /></div>
                )}
                <p className="truncate px-3 py-2 text-xs"><span className="font-medium">{a.name}</span> · {formatBytes(a.size)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.reviewNote && (
        <section aria-labelledby="erd-note" className="rounded-md border border-brass/40 bg-brass-soft p-3">
          <h3 id="erd-note" className="font-sans text-sm font-semibold text-sand-700">Note from {r.reviewerName ?? "staff"}</h3>
          <p className="mt-1 text-sm text-sand-700">{r.reviewNote}</p>
        </section>
      )}

      <section aria-labelledby="erd-history">
        <h3 id="erd-history" className="mb-2 font-sans text-sm font-semibold text-olive-950">History</h3>
        <ol className="space-y-3 border-l-2 border-sand-200 pl-4">
          {r.history.map((h, i) => {
            const Icon = EVENT_ICON[h.action];
            return (
              <li key={i} className="relative">
                <span className="absolute -left-[25px] flex size-4 items-center justify-center rounded-full bg-sand-50"><Icon className="size-4 text-olive-600" aria-hidden /></span>
                <p className="text-sm font-medium text-olive-950">{EVENT_LABEL[h.action]} <span className="font-normal text-muted-foreground">· {h.by} · {formatDate(h.at)}</span></p>
                {h.note && <p className="text-sm text-muted-foreground">{h.note}</p>}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
