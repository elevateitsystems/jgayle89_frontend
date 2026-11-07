"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin, Save } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";
import { PageHeader } from "./page-header";
import { BusinessCard } from "@/components/directory/business-card";
import { MapView } from "@/components/shared/map-view";
import { BusinessAvatar } from "@/components/shared/monogram";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { categories } from "@/data/categories";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { businessSchema, type BusinessFormOutput, type BusinessFormValues } from "@/schemas/business";
import { businessService, type BusinessInput } from "@/services/business-service";
import type { Business } from "@/types";

const branches = ["Army", "Navy", "Marine Corps", "Air Force", "Space Force", "Coast Guard", "National Guard"] as const;

const csv = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

function toFormValues(b?: Business): BusinessFormValues {
  if (!b) {
    return {
      name: "", slug: "", category: "" as never, tagline: "", description: "", services: "", keywords: "",
      address: "", city: "", state: "", zip: "", lat: 39.5, lng: -98.35, phone: "", email: "", website: "",
      rating: 0, reviewCount: 0, branch: "Army", yearFounded: 2020, hours: "", coverImage: "", profileImage: "",
      featured: false, status: "pending",
    };
  }
  return {
    ...b,
    services: b.services.join(", "),
    keywords: b.keywords.join(", "),
    profileImage: b.profileImage ?? "",
  };
}

export function BusinessForm({ business }: { business?: Business }) {
  const router = useRouter();
  const editing = !!business;
  const [slugTouched, setSlugTouched] = useState(editing);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BusinessFormValues, unknown, BusinessFormOutput>({
    resolver: zodResolver(businessSchema),
    defaultValues: toFormValues(business),
  });

  const v = useWatch({ control });
  const nameField = register("name");

  const preview: Business = useMemo(
    () => ({
      id: business?.id ?? "preview",
      slug: v.slug || slugify(v.name ?? "") || "preview",
      name: v.name || "Business name",
      category: v.category || "food-drink",
      tagline: v.tagline || "Your tagline appears here.",
      description: v.description ?? "",
      services: [],
      keywords: [],
      address: v.address ?? "",
      city: v.city || "City",
      state: (v.state || "ST").toUpperCase(),
      zip: v.zip ?? "",
      lat: Number(v.lat) || 0,
      lng: Number(v.lng) || 0,
      phone: v.phone ?? "",
      email: v.email ?? "",
      website: v.website ?? "",
      rating: Number.isFinite(v.rating) ? Math.min(5, Math.max(0, Number(v.rating))) : 0,
      reviewCount: Number.isFinite(v.reviewCount) ? Number(v.reviewCount) : 0,
      branch: (v.branch as Business["branch"]) || "Army",
      yearFounded: Number(v.yearFounded) || 2020,
      hours: v.hours ?? "",
      coverImage: v.coverImage || "/images/handshake.jpg",
      featured: !!v.featured,
      status: v.status ?? "pending",
      createdAt: "",
    }),
    [v, business?.id],
  );

  const hasCoords = Number.isFinite(v.lat) && Number.isFinite(v.lng) && (v.lat !== 0 || v.lng !== 0);
  const markers = hasCoords ? [{ id: "pick", lat: Number(v.lat), lng: Number(v.lng), title: v.name || "Selected location" }] : [];

  async function onSubmit(values: BusinessFormOutput) {
    const input: BusinessInput = {
      ...values,
      category: values.category,
      services: csv(values.services),
      keywords: csv(values.keywords),
      profileImage: values.profileImage || undefined,
      slug: values.slug || slugify(values.name),
    };
    try {
      if (editing && business) {
        await businessService.update(business.id, input);
        toast.success("Business updated", { description: `${values.name} was saved.` });
      } else {
        await businessService.create(input);
        toast.success("Business created", { description: `${values.name} was added to the directory.` });
      }
      router.push("/admin/businesses");
    } catch (e) {
      toast.error("Couldn't save the business", { description: e instanceof Error ? e.message : "Please try again." });
    }
  }

  function onInvalid() {
    toast.error("Please fix the highlighted fields", { description: "Some required information is missing or invalid." });
  }

  const err = (k: keyof BusinessFormValues) => errors[k]?.message as string | undefined;
  const aria = (k: keyof BusinessFormValues, hint?: string) => ({
    "aria-invalid": !!errors[k],
    "aria-describedby": describedBy(k, err(k), hint),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <PageHeader
        title={editing ? `Edit ${business?.name}` : "Add a business"}
        description={editing ? "Update the listing details. Changes appear in the public directory immediately." : "Create a new directory listing. Fields marked * are required."}
        actions={
          <Link href="/admin/businesses" className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Section title="Basic information" description="How the business appears in the directory.">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Business name" htmlFor="name" error={err("name")} required className="sm:col-span-2">
                <Input
                  id="name"
                  placeholder="e.g. Ironwood Coffee Roasters"
                  {...aria("name")}
                  {...nameField}
                  onChange={(e) => {
                    nameField.onChange(e);
                    if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldValidate: false });
                  }}
                />
              </FormField>
              <FormField label="URL slug" htmlFor="slug" error={err("slug")} hint={`Public URL: /directory/${v.slug || slugify(v.name ?? "") || "your-business"}`} className="sm:col-span-2">
                <Input id="slug" placeholder="auto-generated-from-name" {...aria("slug", "hint")} {...register("slug", { onChange: () => setSlugTouched(true) })} />
              </FormField>
              <FormField label="Category" htmlFor="category" error={err("category")} required>
                <NativeSelect id="category" {...aria("category")} {...register("category")}>
                  <option value="">Select a category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="Branch of service" htmlFor="branch" error={err("branch")} required>
                <NativeSelect id="branch" {...aria("branch")} {...register("branch")}>
                  {branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="Tagline" htmlFor="tagline" error={err("tagline")} required className="sm:col-span-2" hint={`${(v.tagline ?? "").length}/120`}>
                <Input id="tagline" placeholder="One line that describes the business" {...aria("tagline", "hint")} {...register("tagline")} />
              </FormField>
              <FormField label="Description" htmlFor="description" error={err("description")} required className="sm:col-span-2" hint={`${(v.description ?? "").length}/2000 · Separate paragraphs with a blank line.`}>
                <Textarea id="description" rows={6} placeholder="Tell customers what makes this business special…" {...aria("description", "hint")} {...register("description")} />
              </FormField>
              <FormField label="Year founded" htmlFor="yearFounded" error={err("yearFounded")} required>
                <Input id="yearFounded" type="number" inputMode="numeric" {...aria("yearFounded")} {...register("yearFounded", { valueAsNumber: true })} />
              </FormField>
              <div className="flex items-end">
                <Controller
                  control={control}
                  name="featured"
                  render={({ field }) => (
                    <label className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-input bg-white px-3">
                      <span className="text-sm font-medium">Featured on homepage</span>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </label>
                  )}
                />
              </div>
            </div>
          </Section>

          <Section title="Location" description="Address details and map position. Click the map to place the pin.">
            <div className="grid gap-5 sm:grid-cols-6">
              <FormField label="Street address" htmlFor="address" error={err("address")} required className="sm:col-span-6">
                <Input id="address" autoComplete="street-address" {...aria("address")} {...register("address")} />
              </FormField>
              <FormField label="City" htmlFor="city" error={err("city")} required className="sm:col-span-3">
                <Input id="city" {...aria("city")} {...register("city")} />
              </FormField>
              <FormField label="State" htmlFor="state" error={err("state")} required className="sm:col-span-1">
                <Input id="state" maxLength={2} placeholder="VA" className="uppercase" {...aria("state")} {...register("state")} />
              </FormField>
              <FormField label="ZIP" htmlFor="zip" error={err("zip")} required className="sm:col-span-2">
                <Input id="zip" inputMode="numeric" placeholder="22201" {...aria("zip")} {...register("zip")} />
              </FormField>
              <FormField label="Latitude" htmlFor="lat" error={err("lat")} required className="sm:col-span-3">
                <Input id="lat" type="number" step="any" {...aria("lat")} {...register("lat", { valueAsNumber: true })} />
              </FormField>
              <FormField label="Longitude" htmlFor="lng" error={err("lng")} required className="sm:col-span-3">
                <Input id="lng" type="number" step="any" {...aria("lng")} {...register("lng", { valueAsNumber: true })} />
              </FormField>
            </div>
            <MapView
              markers={markers}
              selectedId="pick"
              onPick={(lat, lng) => {
                setValue("lat", Number(lat.toFixed(5)), { shouldValidate: true, shouldDirty: true });
                setValue("lng", Number(lng.toFixed(5)), { shouldValidate: true, shouldDirty: true });
              }}
              singleZoom={markers.length ? 10 : 4}
              className="mt-5 h-64 cursor-crosshair sm:h-72"
            />
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden /> Click anywhere on the map to set latitude and longitude.
            </p>
          </Section>

          <Section title="Contact details">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Phone" htmlFor="phone" error={err("phone")} required>
                <Input id="phone" type="tel" autoComplete="tel" placeholder="(555) 010-0100" {...aria("phone")} {...register("phone")} />
              </FormField>
              <FormField label="Email" htmlFor="email" error={err("email")} required>
                <Input id="email" type="email" autoComplete="email" {...aria("email")} {...register("email")} />
              </FormField>
              <FormField label="Website" htmlFor="website" error={err("website")} className="sm:col-span-2" hint="Include https://">
                <Input id="website" type="url" placeholder="https://example.com" {...aria("website", "hint")} {...register("website")} />
              </FormField>
              <FormField label="Hours" htmlFor="hours" error={err("hours")} className="sm:col-span-2">
                <Input id="hours" placeholder="Mon–Fri 9a–5p · Sat 10a–2p" {...aria("hours")} {...register("hours")} />
              </FormField>
            </div>
          </Section>

          <Section title="Services, keywords & rating" description="Rating fields hold demo values only — they are not real reviews.">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Services" htmlFor="services" error={err("services")} hint="Comma-separated, e.g. Remodels, Estimates" className="sm:col-span-2">
                <Textarea id="services" rows={2} {...aria("services", "hint")} {...register("services")} />
              </FormField>
              <FormField label="Search keywords" htmlFor="keywords" error={err("keywords")} hint="Comma-separated" className="sm:col-span-2">
                <Input id="keywords" placeholder="coffee, roastery, breakfast" {...aria("keywords", "hint")} {...register("keywords")} />
              </FormField>
              <FormField label="Demo rating (0–5)" htmlFor="rating" error={err("rating")} required>
                <Input id="rating" type="number" step="0.1" min={0} max={5} {...aria("rating")} {...register("rating", { valueAsNumber: true })} />
              </FormField>
              <FormField label="Demo review count" htmlFor="reviewCount" error={err("reviewCount")} required>
                <Input id="reviewCount" type="number" min={0} {...aria("reviewCount")} {...register("reviewCount", { valueAsNumber: true })} />
              </FormField>
            </div>
          </Section>

          <Section title="Images" description="Upload files (resized in your browser) or pick a sample image.">
            <div className="grid gap-6 sm:grid-cols-[1fr_200px]">
              <Controller
                control={control}
                name="coverImage"
                render={({ field }) => (
                  <ImageUpload id="coverImage" label="Cover image *" value={field.value} onChange={field.onChange} error={err("coverImage")} hint="Recommended 1600×900" />
                )}
              />
              <Controller
                control={control}
                name="profileImage"
                render={({ field }) => (
                  <ImageUpload id="profileImage" label="Profile image" aspect="square" value={field.value} onChange={field.onChange} hint="Optional — monogram if empty" />
                )}
              />
            </div>
          </Section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-lg border bg-card p-5 shadow-card">
            <h3 className="font-sans text-base font-semibold text-olive-950">Publish</h3>
            <FormField label="Status" htmlFor="status" error={err("status")} className="mt-4" hint="Only Active listings appear publicly.">
              <NativeSelect id="status" {...aria("status", "hint")} {...register("status")}>
                <option value="active">Active</option>
                <option value="pending">Pending review</option>
                <option value="draft">Draft</option>
              </NativeSelect>
            </FormField>
            <Button type="submit" size="lg" className="mt-5 w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save /> {editing ? "Save changes" : "Create business"}
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-5 shadow-card">
            <h3 className="font-sans text-base font-semibold text-olive-950">Live preview</h3>
            <p className="mb-4 text-xs text-muted-foreground">How the card looks in the directory.</p>
            <div className="pointer-events-none" aria-hidden>
              <BusinessCard business={preview} />
            </div>
            <div className="mt-4 flex items-center gap-3 border-t pt-4">
              <BusinessAvatar name={preview.name} src={v.profileImage || undefined} className={cn("size-12 rounded-md")} textClassName="text-base" />
              <p className="text-xs text-muted-foreground">Profile image preview</p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-card sm:p-6">
      <h3 className="font-sans text-base font-semibold text-olive-950">{title}</h3>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
