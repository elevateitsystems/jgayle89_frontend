"use client";

import { useMemo } from "react";
import { History } from "lucide-react";
import { AdminMemberLink } from "./entity-links";
import { Panel } from "@/components/dashboard/panel";
import { useStore } from "@/hooks/use-store";
import { formatDate } from "@/lib/date";
import { auditStore } from "@/services/audit-service";
import type { AuditArea } from "@/types";

/** Recent back-office changes — who did what, and when (client update §11E). */
export function AuditLogPanel({ areas, limit = 8, title = "Change history" }: { areas?: AuditArea[]; limit?: number; title?: string }) {
  const all = useStore(auditStore);
  const rows = useMemo(() => all.filter((e) => !areas || areas.includes(e.area)).sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit), [all, areas, limit]);
  return (
    <Panel title={title} subtitle="Recorded automatically for every change">
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">No changes recorded yet.</p>
      ) : (
        <ol className="divide-y divide-sand-200">
          {rows.map((e) => (
            <li key={e.id} className="flex items-start gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
              <History className="mt-0.5 size-4 shrink-0 text-olive-600" aria-hidden />
              <div className="min-w-0 flex-1">
                <p><AdminMemberLink userId={e.actorId} name={e.actorName} /> {e.action} <span className="font-medium">{e.targetName}</span></p>
                {e.details && <p className="text-xs text-muted-foreground">{e.details}</p>}
              </div>
              <time dateTime={e.at} className="shrink-0 text-xs text-muted-foreground">{formatDate(e.at.slice(0, 10))} {e.at.slice(11, 16)}</time>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
