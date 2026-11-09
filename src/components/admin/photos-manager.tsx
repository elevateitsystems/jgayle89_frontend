"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ImagePlus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";
import { PageHeader } from "./page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BusinessAvatar } from "@/components/shared/monogram";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCategories } from "@/hooks/use-categories";
import { businessService } from "@/services/business-service";
import type { Business } from "@/types";

/** Photo-only workflow for staff who can upload photos but not edit listings. */
export function PhotosManager() {
  const { businesses, loading } = useBusinesses();
  const { categoryName } = useCategories();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Business | null>(null);

  const rows = useMemo(() => {
    const s = q.toLowerCase().trim();
    return businesses.filter((b) => !s || `${b.name} ${b.city} ${b.state}`.toLowerCase().includes(s)).sort((a, b) => a.name.localeCompare(b.name));
  }, [businesses, q]);

  return (
    <>
      <PageHeader title="Business photos" description="Upload or replace the cover and profile photo for any listing. Images are resized in your browser." />

      <label className="relative mb-5 flex max-w-md items-center">
        <span className="sr-only">Search businesses</span>
        <Search className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by business, city or state"
          className="h-10 w-full rounded-md border border-input bg-white pl-10 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        />
      </label>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No businesses found" description="Try a different search." actionLabel="Clear search" onAction={() => setQ("")} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((b) => (
            <li key={b.id} className="overflow-hidden rounded-lg border bg-card shadow-card">
              <div className="relative aspect-[16/9] bg-sand-200">
                <Image src={b.coverImage} alt={`${b.name} cover photo`} fill sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-cover" unoptimized={b.coverImage.startsWith("data:")} />
              </div>
              <div className="flex items-center gap-3 p-4">
                <BusinessAvatar name={b.name} src={b.profileImage} className="size-11 shrink-0 rounded-md" textClassName="text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-olive-950">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{categoryName(b.category)} · {b.city}, {b.state}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelected(b)} aria-label={`Change photos for ${b.name}`}>
                  <ImagePlus /> Photos
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PhotosSheet business={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function PhotosSheet({ business, onClose }: { business: Business | null; onClose: () => void }) {
  return (
    <Sheet open={!!business} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-md">
        {/* Keyed so the form state resets for each business without an effect. */}
        {business && <PhotosForm key={business.id} business={business} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function PhotosForm({ business, onClose }: { business: Business; onClose: () => void }) {
  const [cover, setCover] = useState(business.coverImage);
  const [profile, setProfile] = useState(business.profileImage ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!cover) {
      toast.error("A cover image is required");
      return;
    }
    setSaving(true);
    try {
      await businessService.update(business.id, { coverImage: cover, profileImage: profile || undefined });
      toast.success("Photos updated", { description: business.name });
      onClose();
    } catch (e) {
      toast.error("Couldn't save the photos", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SheetHeader className="border-b border-sand-200 p-5">
        <SheetTitle>{business.name}</SheetTitle>
        <SheetDescription>Replace the cover and profile photo.</SheetDescription>
      </SheetHeader>
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <ImageUpload id="photo-cover" label="Cover image *" value={cover} onChange={setCover} hint="Recommended 1600×900" />
        <ImageUpload id="photo-profile" label="Profile image" aspect="square" value={profile} onChange={setProfile} hint="Optional — monogram if empty" />
      </div>
      <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? <><Loader2 className="animate-spin" /> Saving…</> : "Save photos"}
        </Button>
      </SheetFooter>
    </>
  );
}
