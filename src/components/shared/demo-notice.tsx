import { FlaskConical } from "lucide-react";
import { DEMO_NOTICE } from "@/config/site";
import { cn } from "@/lib/utils";

export function DemoNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-start gap-2 rounded-md border border-sand-300 bg-sand-100 px-3 py-2 text-xs leading-relaxed text-sand-700",
        className,
      )}
    >
      <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{DEMO_NOTICE}</span>
    </p>
  );
}
