"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlus, Plus, Trash2, Video } from "lucide-react";
import { ImageUpload } from "./image-upload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { allowedSubcategories } from "@/features/categories/rules";
import type { MediaAllowance } from "@/features/business/media";
import { useCategories } from "@/hooks/use-categories";
import { newId } from "@/lib/slug";
import { SOCIAL_PLATFORMS, socialLinkSchema } from "@/schemas/edit-request";
import type { Business, BusinessVideo, SocialLink, SocialPlatform } from "@/types";

/** The listing fields added by the client's 2026-11 update, edited alongside the main business form. */
export interface ListingExtras {
  listingKind: NonNullable<Business["listingKind"]>;
  secondaryCategories: string[];
  subcategories: string[];
  socialLinks: SocialLink[];
  gallery: string[];
  videos: BusinessVideo[];
}

export const extrasFrom = (b?: Business): ListingExtras => ({
  listingKind: b?.listingKind ?? "veteran_owned",
  secondaryCategories: b?.secondaryCategories ?? [],
  subcategories: b?.subcategories ?? [],
  socialLinks: b?.socialLinks ?? [],
  gallery: b?.gallery ?? [],
  videos: b?.videos ?? [],
});

/** Returns an error message for the first invalid social link, or null. */
export function socialLinksError(links: SocialLink[]): string | null {
  for (const [i, l] of links.entries()) {
    const r = socialLinkSchema.safeParse({ platform: l.platform, url: l.url, label: l.label ?? "" });
    if (!r.success) return `Social link ${i + 1}: ${r.error.issues[0]?.message ?? "invalid"}`;
  }
  return null;
}

const toggle = (list: string[], id: string, on: boolean) => (on ? [...new Set([...list, id])] : list.filter((x) => x !== id));
const fmt = (n: number | null) => (n === null ? "unlimited" : String(n));

/** Primary + additional categories, subcategories and listing type (client update §11A, §3). */
export function CategoryAssignment({ primary, value, onChange }: { primary: string; value: ListingExtras; onChange: (v: ListingExtras) => void }) {
  const { allPrimaries, allCategories } = useCategories();
  const catIds = [primary, ...value.secondaryCategories].filter(Boolean);
  const subs = allowedSubcategories(allCategories, catIds);
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-olive-950">Also list under</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {allPrimaries.filter((c) => c.id !== primary).map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={value.secondaryCategories.includes(c.id)}
                onCheckedChange={(on) => {
                  const secondaryCategories = toggle(value.secondaryCategories, c.id, !!on);
                  // Drop subcategories that no longer belong to any chosen category.
                  const keep = allowedSubcategories(allCategories, [primary, ...secondaryCategories]).map((s) => s.id);
                  onChange({ ...value, secondaryCategories, subcategories: value.subcategories.filter((s) => keep.includes(s)) });
                }}
              />
              {c.name}{c.active === false && <span className="text-xs text-muted-foreground">(inactive)</span>}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-olive-950">Subcategories</legend>
        {subs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Choose a category first. Admins (or staff with permission) can add subcategories under Business Categories.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {subs.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={value.subcategories.includes(s.id)} onCheckedChange={(on) => onChange({ ...value, subcategories: toggle(value.subcategories, s.id, !!on) })} />
                {s.name}{s.active === false && <span className="text-xs text-muted-foreground">(inactive)</span>}
              </label>
            ))}
          </div>
        )}
      </fieldset>
      <label className="block text-sm">
        <span className="font-medium text-olive-950">Listing type</span>
        <NativeSelect className="mt-1.5 sm:max-w-xs" value={value.listingKind} onChange={(e) => onChange({ ...value, listingKind: e.target.value as ListingExtras["listingKind"] })}>
          <option value="veteran_owned">Veteran-owned business</option>
          <option value="veteran_friendly">Veteran-friendly business</option>
        </NativeSelect>
      </label>
    </div>
  );
}

/** Staff add and edit social media links directly (client update §4B). */
export function SocialLinksEditor({ links, onChange }: { links: SocialLink[]; onChange: (l: SocialLink[]) => void }) {
  const set = (i: number, patch: Partial<SocialLink>) => onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <div className="space-y-3">
      {links.length === 0 && <p className="text-sm text-muted-foreground">No social links yet.</p>}
      {links.map((l, i) => (
        <div key={i} className="grid gap-2 rounded-md border bg-white p-3 sm:grid-cols-[170px_1fr_auto]">
          <NativeSelect aria-label={`Platform for link ${i + 1}`} value={l.platform} onChange={(e) => set(i, { platform: e.target.value as SocialPlatform })}>
            {SOCIAL_PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </NativeSelect>
          <div className="grid gap-2">
            <Input aria-label={`URL for link ${i + 1}`} type="url" placeholder={SOCIAL_PLATFORMS.find((p) => p.id === l.platform)?.placeholder} value={l.url} onChange={(e) => set(i, { url: e.target.value })} />
            {l.platform === "website" && <Input aria-label={`Name for link ${i + 1}`} placeholder="Link name, e.g. “Online store”" value={l.label ?? ""} onChange={(e) => set(i, { label: e.target.value })} />}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(links.filter((_, j) => j !== i))} aria-label={`Remove link ${i + 1}`}><Trash2 /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...links, { platform: "facebook", url: "" }])}><Plus /> Add social link</Button>
    </div>
  );
}

/** Gallery pictures and videos, limited by the business's plan (client update §4A). */
export function MediaEditor({ value, onChange, allowance, canUpload }: { value: ListingExtras; onChange: (v: ListingExtras) => void; allowance: MediaAllowance; canUpload: boolean }) {
  const [adding, setAdding] = useState("");
  const [video, setVideo] = useState({ url: "", title: "" });
  const galleryFull = allowance.gallery !== null && value.gallery.length >= allowance.gallery;
  const videosFull = allowance.videos !== null && value.videos.length >= allowance.videos;
  return (
    <div className="space-y-6">
      {allowance.governed && (
        <p className="rounded-md border border-sand-300 bg-sand-100 px-3 py-2 text-xs text-sand-700">
          This business&apos;s plan allows: cover image {allowance.cover ? "yes" : "no"} · gallery {fmt(allowance.gallery)} · videos {fmt(allowance.videos)}. Extra items beyond the plan are kept but not shown publicly.
        </p>
      )}
      <div>
        <h4 className="mb-2 text-sm font-medium text-olive-950">Gallery <span className="font-normal text-muted-foreground">({value.gallery.length}{allowance.gallery !== null ? ` / ${allowance.gallery}` : ""})</span></h4>
        {value.gallery.length > 0 && (
          <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {value.gallery.map((src, i) => (
              <li key={`${src}-${i}`} className="group relative aspect-square overflow-hidden rounded-md bg-sand-200">
                <Image src={src} alt={`Gallery image ${i + 1}`} fill sizes="120px" className="object-cover" unoptimized={src.startsWith("data:")} />
                {canUpload && (
                  <button type="button" onClick={() => onChange({ ...value, gallery: value.gallery.filter((_, j) => j !== i) })} className="absolute right-1 top-1 rounded bg-white/90 p-1 text-destructive shadow" aria-label={`Remove gallery image ${i + 1}`}>
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!canUpload ? (
          <p className="text-sm text-muted-foreground">Uploading needs the “Upload business photos” permission.</p>
        ) : galleryFull ? (
          <p className="text-sm text-muted-foreground">{allowance.gallery === 0 ? "This plan doesn't include gallery images." : "The plan's gallery limit is reached."}</p>
        ) : (
          <div className="max-w-md">
            <ImageUpload id="gallery-add" label="Add a gallery image" value={adding} onChange={(src) => { if (src) { onChange({ ...value, gallery: [...value.gallery, src] }); setAdding(""); } }} />
          </div>
        )}
      </div>
      <div>
        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-olive-950"><Video className="size-4" aria-hidden /> Videos <span className="font-normal text-muted-foreground">({value.videos.length}{allowance.videos !== null ? ` / ${allowance.videos}` : ""})</span></h4>
        <ul className="mb-3 space-y-2">
          {value.videos.map((v) => (
            <li key={v.id} className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
              <span className="min-w-0 flex-1"><span className="block truncate font-medium">{v.title}</span><span className="block truncate text-xs text-muted-foreground">{v.url}</span></span>
              {canUpload && <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange({ ...value, videos: value.videos.filter((x) => x.id !== v.id) })} aria-label={`Remove video ${v.title}`}><Trash2 /></Button>}
            </li>
          ))}
        </ul>
        {canUpload && !videosFull && (
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input aria-label="Video title" placeholder="Video title" value={video.title} onChange={(e) => setVideo({ ...video, title: e.target.value })} />
            <Input aria-label="Video link" type="url" placeholder="https://youtube.com/watch?v=…" value={video.url} onChange={(e) => setVideo({ ...video, url: e.target.value })} />
            <Button type="button" variant="outline" disabled={!/^https?:\/\/\S+\.\S+/.test(video.url) || video.title.trim().length < 2} onClick={() => { onChange({ ...value, videos: [...value.videos, { id: newId("vid"), url: video.url.trim(), title: video.title.trim() }] }); setVideo({ url: "", title: "" }); }}>
              <ImagePlus /> Add video
            </Button>
          </div>
        )}
        {canUpload && videosFull && <p className="text-sm text-muted-foreground">{allowance.videos === 0 ? "This plan doesn't include videos." : "The plan's video limit is reached."}</p>}
        <p className="mt-2 text-xs text-muted-foreground">YouTube and Vimeo links play on the profile; other links open in a new tab.</p>
      </div>
    </div>
  );
}
