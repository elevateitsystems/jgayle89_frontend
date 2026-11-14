import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialLink, SocialPlatform } from "@/types";

type IconType = React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/** lucide-react no longer ships brand logos, so these four are small inline stroke icons (Feather, MIT). */
const brand = (children: React.ReactNode): IconType =>
  function BrandIcon({ className, ...rest }) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
        {children}
      </svg>
    );
  };

const Facebook = brand(<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />);
const Instagram = brand(<><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></>);
const Linkedin = brand(<><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>);
const Youtube = brand(<><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></>);

export const SOCIAL_ICON: Record<SocialPlatform, IconType> = { facebook: Facebook, instagram: Instagram, linkedin: Linkedin, youtube: Youtube, website: Globe };
export const SOCIAL_LABEL: Record<SocialPlatform, string> = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", youtube: "YouTube", website: "Website" };

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** Links as pills. `variant="plain"` is the owner/staff read-only list; `variant="icons"` is for public profiles. */
export function SocialLinksList({ links, variant = "plain", className }: { links: SocialLink[]; variant?: "plain" | "icons"; className?: string }) {
  if (links.length === 0) return <p className={cn("text-sm text-muted-foreground", className)}>No social links yet.</p>;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Social media links">
      {links.map((l, i) => {
        const Icon = SOCIAL_ICON[l.platform];
        const name = l.label || SOCIAL_LABEL[l.platform];
        return (
          <li key={`${l.url}-${i}`}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={cn(
                "inline-flex items-center gap-2 rounded-full border bg-white text-sm font-medium text-olive-900 transition-colors hover:border-olive-300 hover:bg-olive-50",
                variant === "icons" ? "px-3.5 py-2" : "px-3 py-1.5",
              )}
            >
              <Icon className="size-4 text-olive-700" aria-hidden />
              {name}
              {variant === "plain" && <span className="hidden text-xs font-normal text-muted-foreground sm:inline">{hostOf(l.url)}</span>}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
