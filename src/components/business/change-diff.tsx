import { ArrowRight } from "lucide-react";
import { changedKeys, describeValue, fieldLabel } from "@/features/business/changes";
import type { BusinessChanges, EditableFieldKey } from "@/types";

/**
 * Side-by-side "current → requested" view of an edit request. Shared by the owner's preview,
 * the request history and the staff review screen so everyone sees exactly the same change.
 */
export function ChangeDiff({ before, changes, emptyLabel = "No changes yet" }: { before: BusinessChanges; changes: BusinessChanges; emptyLabel?: string }) {
  const keys = changedKeys(changes);
  if (keys.length === 0) return <p className="rounded-md border border-dashed border-sand-300 bg-white/60 px-4 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  return (
    <ul className="space-y-3" aria-label="Requested changes">
      {keys.map((k: EditableFieldKey) => (
        <li key={k} className="rounded-md border bg-white">
          <p className="border-b bg-sand-50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-olive-700">{fieldLabel(k)}</p>
          <div className="grid gap-px bg-sand-200 sm:grid-cols-[1fr_auto_1fr]">
            <div className="bg-white p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Current</p>
              <p className="mt-1 whitespace-pre-line break-words text-sm text-foreground/70 line-through decoration-destructive/40">{describeValue(k, before[k])}</p>
            </div>
            <div className="hidden items-center bg-white px-1 sm:flex"><ArrowRight className="size-4 text-olive-600" aria-hidden /></div>
            <div className="bg-olive-50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-olive-700">Requested</p>
              <p className="mt-1 whitespace-pre-line break-words text-sm font-medium text-olive-950">{describeValue(k, changes[k])}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
