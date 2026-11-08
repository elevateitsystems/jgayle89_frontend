import { RatingStars } from "@/components/shared/rating-stars";
import { cn } from "@/lib/utils";
import type { Business, GoogleRatingSummary } from "@/types";

/** Small "G" mark used to tell Google ratings apart from the site's own rating. */
export function GoogleMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-full border border-sky-200 bg-white text-[11px] font-bold leading-none text-sky-700",
        className,
      )}
    >
      G
    </span>
  );
}

/**
 * Compact rating summary for the business header. Website and Google ratings are
 * rendered as two separate labelled pills so they can't be mistaken for one score.
 */
export function RatingPills({ business, google }: { business: Business; google: GoogleRatingSummary | null }) {
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Ratings">
      <li
        data-testid="website-rating-pill"
        className="flex items-center gap-2 rounded-md border border-brass/40 bg-brass-soft/60 px-2.5 py-1.5"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-sand-700">Website</span>
        <RatingStars rating={business.rating} reviewCount={business.reviewCount} label="Website rating" />
      </li>
      {google && (
        <li
          data-testid="google-rating-pill"
          className="flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1.5"
        >
          <GoogleMark />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-800">Google</span>
          <RatingStars rating={google.rating} reviewCount={google.reviewCount} label="Google rating" />
        </li>
      )}
    </ul>
  );
}
