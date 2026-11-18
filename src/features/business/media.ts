/**
 * Business photos & videos allowances (client update §4A). Pure.
 * Free: one profile/logo image only. Paid (Growth / Pro / Executive): + cover/banner, gallery and videos, with the
 * number of pictures/videos set per plan in Admin → Membership Plans (no code change needed).
 *
 * Tier limits apply to business *memberships* — listings with an owner account. Staff-maintained listings with no
 * owner have no membership, so their existing media is shown as-is.
 */
import { hasFeature, limitOf } from "../membership/access.ts";
import type { Business, BusinessVideo, MembershipPlan } from "../../types/index.ts";

export interface MediaAllowance {
  /** Whether plan limits govern this listing at all. */
  governed: boolean;
  cover: boolean;
  /** Gallery pictures allowed (null = unlimited). */
  gallery: number | null;
  /** Videos allowed (null = unlimited). */
  videos: number | null;
}

export function mediaAllowance(plan: MembershipPlan | undefined, business: Pick<Business, "ownerId">): MediaAllowance {
  if (!business.ownerId) return { governed: false, cover: true, gallery: null, videos: null };
  return { governed: true, cover: hasFeature(plan, "cover_image"), gallery: limitOf(plan, "business_photos"), videos: limitOf(plan, "business_videos") };
}

const take = <T,>(list: T[], limit: number | null) => (limit === null ? list : list.slice(0, limit));

/** What the public profile may show right now (extra items beyond a downgraded plan are kept but hidden). */
export function visibleMedia(b: Pick<Business, "coverImage" | "gallery" | "videos" | "ownerId">, a: MediaAllowance) {
  return { cover: a.cover ? b.coverImage : null, gallery: take(b.gallery ?? [], a.gallery), videos: take(b.videos ?? [], a.videos) };
}

/** YouTube / Vimeo links become an embeddable URL; anything else is shown as a plain link ("where supported"). */
export function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export const isVideoUrl = (v: Pick<BusinessVideo, "url">) => /^https?:\/\/\S+\.\S+/.test(v.url);
