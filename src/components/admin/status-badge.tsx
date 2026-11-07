import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  active: "bg-olive-100 text-olive-800 ring-olive-300",
  published: "bg-olive-100 text-olive-800 ring-olive-300",
  pending: "bg-brass-soft text-sand-700 ring-brass/40",
  draft: "bg-sand-200 text-sand-700 ring-sand-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset",
        styles[status] ?? styles.draft,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}
