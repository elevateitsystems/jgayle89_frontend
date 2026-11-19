import { HeartPulse, Medal, ShieldCheck, Siren, Swords } from "lucide-react";
import { SERVICE_STATUS_LABEL, firstResponderLabel } from "@/features/profile/profile";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";

const pill = "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset";

/**
 * A member's identity badges: service summary, Disabled / Combat Veteran and Purple Heart, and the First Responder
 * badge (client update §1B — a badge only, not a membership tier). Renders nothing when there's nothing to show.
 */
export function MemberIdentityBadges({ user, className }: { user: Pick<AppUser, "military" | "firstResponder" | "branch" | "userType">; className?: string }) {
  const m = user.military;
  const fr = firstResponderLabel(user);
  if (!m && !fr) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Profile badges">
      {m && (
        <li className={cn(pill, "bg-olive-100 text-olive-800 ring-olive-300")}>
          <ShieldCheck className="size-3" aria-hidden /> {m.branch} · {SERVICE_STATUS_LABEL[m.status]}
        </li>
      )}
      {m?.disabledVeteran && <li className={cn(pill, "bg-sand-100 text-olive-900 ring-sand-300")}><HeartPulse className="size-3" aria-hidden /> Disabled Veteran</li>}
      {m?.combatVeteran && <li className={cn(pill, "bg-sand-100 text-olive-900 ring-sand-300")}><Swords className="size-3" aria-hidden /> Combat Veteran</li>}
      {m?.purpleHeart && <li className={cn(pill, "bg-brass-soft text-sand-700 ring-brass/50")}><Medal className="size-3" aria-hidden /> Purple Heart</li>}
      {fr && <li className={cn(pill, "bg-destructive/10 text-destructive ring-destructive/30")}><Siren className="size-3" aria-hidden /> First Responder · {fr}</li>}
    </ul>
  );
}
