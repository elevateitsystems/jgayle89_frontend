import { FlaskConical, MessageSquareText } from "lucide-react";
import { GoogleMark } from "./rating-pills";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatDate } from "@/lib/date";
import type { Business, GoogleRatingSummary, Review } from "@/types";

interface Props {
  business: Business;
  reviews: Review[];
  /** Resolved Google rating, or null when unavailable. Ignored unless `googleEnabled`. */
  google: GoogleRatingSummary | null;
  googleLoading: boolean;
  /** Admin setting: when false the Google card is not rendered at all. */
  googleEnabled: boolean;
}

/** Two independent rating cards (website + Google) followed by the website's reviews. */
export function RatingsSection({ business: b, reviews, google, googleLoading, googleEnabled }: Props) {
  return (
    <section aria-labelledby="ratings-h">
      <h2 id="ratings-h" className="text-2xl font-semibold text-olive-950">Ratings &amp; reviews</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Website rating */}
        <div data-testid="website-rating-card" className="rounded-lg border border-brass/40 bg-brass-soft/40 p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-sand-700">
            <MessageSquareText className="size-4" aria-hidden /> Mission: SITREP rating
          </p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums text-olive-950">{b.rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">out of 5</span>
          </p>
          <RatingStars rating={b.rating} size="lg" className="mt-1" label="Website rating" />
          <p className="mt-2 text-sm text-foreground/80">
            Based on <strong>{b.reviewCount.toLocaleString()}</strong> website {b.reviewCount === 1 ? "review" : "reviews"}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-sm bg-sand-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sand-700">
            <FlaskConical className="size-3" aria-hidden /> Demo data
          </p>
        </div>

        {/* Google rating */}
        {googleEnabled && (
          <div data-testid="google-rating-card" className="rounded-lg border border-sky-200 bg-sky-50 p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-sky-800">
              <GoogleMark /> Google rating
            </p>
            {googleLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">Loading Google rating…</p>
            ) : google ? (
              <>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tabular-nums text-olive-950">{google.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">out of 5</span>
                </p>
                <RatingStars rating={google.rating} size="lg" className="mt-1" label="Google rating" />
                <p className="mt-2 text-sm text-foreground/80">
                  Based on <strong>{google.reviewCount.toLocaleString()}</strong> Google {google.reviewCount === 1 ? "review" : "reviews"}
                </p>
                {google.source === "mock" && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-sm bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-800">
                    <FlaskConical className="size-3" aria-hidden /> Sample Google data
                  </p>
                )}
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No Google rating is available for this business.</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-olive-950">Latest website reviews</h3>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No website reviews yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <RatingStars rating={r.rating} label="Review rating" />
                  <time dateTime={r.createdAt} className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</time>
                </div>
                <p className="mt-2 font-semibold text-olive-950">{r.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/85">{r.body}</p>
                <p className="mt-3 text-xs text-muted-foreground">{r.author} · sample review</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
