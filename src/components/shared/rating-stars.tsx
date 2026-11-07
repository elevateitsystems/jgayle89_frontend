import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showDemoLabel?: boolean;
}

export function RatingStars({ rating, reviewCount, size = "sm", className, showDemoLabel }: RatingStarsProps) {
  const px = size === "lg" ? "size-5" : size === "md" ? "size-4" : "size-3.5";
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-0.5", className)}
      role="img"
      aria-label={`Demo rating: ${rating.toFixed(1)} out of 5${reviewCount !== undefined ? ` from ${reviewCount} sample reviews` : ""}`}
    >
      <div className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, rating - (i - 1)));
          return (
            <span key={i} className={cn("relative inline-block", px)}>
              <Star className={cn("absolute inset-0 text-sand-300", px)} fill="currentColor" strokeWidth={0} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("text-brass", px)} fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          );
        })}
      </div>
      <span className={cn("font-semibold text-foreground tabular-nums", size === "lg" ? "text-base" : "text-sm")}>
        {rating.toFixed(1)}
      </span>
      {reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground">({reviewCount})</span>
      )}
      {showDemoLabel && (
        <span className="rounded-sm bg-sand-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sand-700">
          Demo rating
        </span>
      )}
    </div>
  );
}
