"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { ForSelectedBusiness } from "./owner-pages";
import { ImageUpload } from "@/components/admin/image-upload";
import { CategoryAssignment, MediaEditor, extrasFrom, type ListingExtras } from "@/components/admin/listing-extras-editor";
import { PageHeader } from "@/components/admin/page-header";
import { Panel } from "@/components/dashboard/panel";
import { UpgradePrompt } from "@/components/membership/feature-access";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { mediaAllowance } from "@/features/business/media";
import { cheapestPlanWith } from "@/features/membership/access";
import { useAllPlans, useResolvedPlan } from "@/features/membership/hooks";
import { useCategories } from "@/hooks/use-categories";
import { useSession } from "@/hooks/use-session";
import { useStore } from "@/hooks/use-store";
import { editRequestService, editRequestStore } from "@/services/edit-request-service";
import type { Business } from "@/types";

/** Business owner → Photos, Videos & Categories. Changes are sent to staff as an edit request (client update §4A, §11D). */
export function OwnerMediaPage() {
  return (
    <>
      <PageHeader title="Photos, videos & categories" description="Update your logo, cover, gallery, videos and the categories you appear under. Staff review every change before it goes live." />
      <ForSelectedBusiness>{(b) => <MediaPanel key={b.id} business={b} />}</ForSelectedBusiness>
    </>
  );
}

function MediaPanel({ business }: { business: Business }) {
  const user = useSession();
  const plan = useResolvedPlan("business", business.id);
  const plans = useAllPlans();
  const { categoryName } = useCategories();
  const allowance = mediaAllowance(plan, business);
  const [extras, setExtras] = useState<ListingExtras>(() => extrasFrom(business));
  const [cover, setCover] = useState(business.coverImage);
  const [logo, setLogo] = useState(business.profileImage ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const requests = useStore(editRequestStore);
  const pending = useMemo(() => requests.some((r) => r.businessId === business.id && r.status === "pending"), [requests, business.id]);
  const upgrade = cheapestPlanWith(plans, "business", "cover_image");

  async function submit() {
    if (!user) return;
    if (reason.trim().length < 5) return toast.error("Add a short note for the reviewer");
    setBusy(true);
    try {
      await editRequestService.submit(
        {
          businessId: business.id,
          reason,
          changes: { secondaryCategories: extras.secondaryCategories, subcategories: extras.subcategories, coverImage: cover, profileImage: logo, gallery: extras.gallery, videos: extras.videos },
          attachments: [],
          caps: { gallery: allowance.gallery, videos: allowance.videos },
        },
        user,
      );
      toast.success("Sent for review", { description: "Staff will approve or reply in Edit Requests." });
      setReason("");
    } catch (e) {
      toast.error("Couldn't send the request", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {pending && (
          <p className="rounded-md border border-brass/40 bg-brass-soft px-3 py-2 text-sm text-sand-700">
            You have an edit request waiting for review. <Link href="/dashboard/edit-requests" className="font-semibold underline">View it</Link>
          </p>
        )}
        <Panel title="Profile / logo & cover">
          <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
            <ImageUpload id="own-logo" label="Profile / logo image" aspect="square" value={logo} onChange={setLogo} hint="Included on every plan" />
            {allowance.cover ? (
              <ImageUpload id="own-cover" label="Cover / banner image" value={cover} onChange={setCover} hint="Recommended 1600×900" />
            ) : (
              <UpgradePrompt featureLabel="A cover / banner image, gallery and videos" requiredPlan={upgrade?.name} href="/dashboard/memberships" />
            )}
          </div>
        </Panel>
        {(allowance.gallery !== 0 || allowance.videos !== 0) && (
          <Panel title="Gallery & videos"><MediaEditor value={extras} onChange={setExtras} allowance={allowance} canUpload /></Panel>
        )}
        <Panel title="Categories" subtitle={`Primary category: ${categoryName(business.category)} (changed by staff)`}>
          <CategoryAssignment primary={business.category} value={extras} onChange={setExtras} />
        </Panel>
      </div>
      <div className="space-y-6">
        <Panel title="Send for review">
          <FormField label="Note for the reviewer" htmlFor="own-reason" required hint="What changed and why.">
            <Textarea id="own-reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
          <Button className="mt-4 w-full" onClick={submit} disabled={busy}>{busy ? <><Loader2 className="animate-spin" /> Sending…</> : <><Send /> Submit changes</>}</Button>
          <p className="mt-3 text-xs text-muted-foreground">You can only pick existing categories. New categories, subcategories and badges are created by Mission: SITREP staff.</p>
        </Panel>
      </div>
    </div>
  );
}
