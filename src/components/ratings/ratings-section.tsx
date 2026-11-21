"use client";

import { useState } from "react";
import { FlaskConical, Loader2, MessageSquareText, Star } from "lucide-react";
import { toast } from "sonner";
import { GoogleMark } from "./rating-pills";
import { RatingStars } from "@/components/shared/rating-stars";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/date";
import { reviewService } from "@/services/review-service";
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
  const user = useSession();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    if (!rating || title.trim().length < 3 || body.trim().length < 10) {
      toast.error("Complete the review", { description: "Choose a star rating, add a short title, and write at least 10 characters." });
      return;
    }
    setSaving(true);
    try {
      await reviewService.create({ businessId: b.id, author: user.name, rating, title: title.trim(), body: body.trim() });
      toast.success("Review submitted", { description: "Your demo review is now visible on this profile." });
      setRating(0); setTitle(""); setBody("");
    } catch (error) {
      toast.error("Couldn't submit the review", { description: error instanceof Error ? error.message : undefined });
    } finally { setSaving(false); }
  }

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

      {user?.role === "user" ? (
        <form onSubmit={submitReview} className="mt-8 rounded-lg border border-olive-200 bg-olive-50/60 p-5" noValidate>
          <div>
            <h3 className="font-semibold text-olive-950">Leave a review</h3>
            <p className="mt-1 text-sm text-muted-foreground">Share your experience as {user.name}. This preview saves the review to your browser only.</p>
          </div>
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-olive-950">Star rating <span className="text-destructive" aria-hidden>*</span></legend>
            <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} star${value === 1 ? "" : "s"}`} onClick={() => setRating(value)} className="rounded p-1 focus-visible:ring-3 focus-visible:ring-ring/50">
                  <Star className={value <= rating ? "size-6 fill-brass text-brass" : "size-6 text-sand-400"} />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Review title" htmlFor="review-title" required><Input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What stood out?" /></FormField>
            <FormField label="Your review" htmlFor="review-body" required hint="At least 10 characters."><Textarea id="review-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tell the community about your experience." /></FormField>
          </div>
          <Button type="submit" className="mt-4" disabled={saving}>{saving ? <><Loader2 className="animate-spin" /> Saving…</> : "Submit demo review"}</Button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Sign in as a member to leave a review.</p>
      )}
    </section>
  );
}
