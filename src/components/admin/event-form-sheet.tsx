"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";
import { Button } from "@/components/ui/button";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { eventCategories } from "@/data/events";
import { daysFromToday } from "@/lib/date";
import { eventSchema, type EventFormOutput, type EventFormValues } from "@/schemas/event";
import { eventService, type EventInput } from "@/services/event-service";
import type { CommunityEvent } from "@/types";

function defaults(e?: CommunityEvent | null): EventFormValues {
  if (!e) {
    return {
      title: "", category: "" as never, summary: "", description: "", agenda: "", date: daysFromToday(14),
      startTime: "18:00", endTime: "20:00", venue: "", address: "", city: "", state: "", organizer: "SITREP Events Team",
      price: "Free", capacity: 100, image: "", status: "draft",
    };
  }
  return { ...e, agenda: e.agenda.join("\n") } as EventFormValues;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  event?: CommunityEvent | null;
}

export function EventFormSheet({ open, onOpenChange, event }: Props) {
  const editing = !!event;
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues, unknown, EventFormOutput>({ resolver: zodResolver(eventSchema), defaultValues: defaults(event) });

  useEffect(() => {
    if (open) reset(defaults(event));
  }, [open, event, reset]);

  const err = (k: keyof EventFormValues) => errors[k]?.message as string | undefined;
  const aria = (k: keyof EventFormValues) => ({ "aria-invalid": !!errors[k], "aria-describedby": describedBy(`ev-${k}`, err(k)) });

  async function onSubmit(v: EventFormOutput) {
    const input: EventInput = {
      ...v,
      state: v.state.toUpperCase(),
      agenda: v.agenda.split("\n").map((s) => s.trim()).filter(Boolean),
      lat: event?.lat ?? 39.5,
      lng: event?.lng ?? -98.35,
      registered: event?.registered ?? 0,
    };
    try {
      if (editing && event) {
        await eventService.update(event.id, input);
        toast.success("Event updated", { description: v.title });
      } else {
        await eventService.create(input);
        toast.success(v.status === "published" ? "Event published" : "Event saved as draft", { description: v.title });
      }
      onOpenChange(false);
    } catch (e) {
      toast.error("Couldn't save the event", { description: e instanceof Error ? e.message : undefined });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-sand-200 p-5">
          <SheetTitle>{editing ? "Edit event" : "Add event"}</SheetTitle>
          <SheetDescription>{editing ? "Update the details below." : "Fill in the details. Save as a draft or publish immediately."}</SheetDescription>
        </SheetHeader>

        <form
          id="event-form"
          onSubmit={handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields"))}
          noValidate
          className="flex-1 space-y-5 overflow-y-auto p-5"
        >
          <FormField label="Title" htmlFor="ev-title" error={err("title")} required>
            <Input id="ev-title" {...aria("title")} {...register("title")} />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Category" htmlFor="ev-category" error={err("category")} required>
              <NativeSelect id="ev-category" {...aria("category")} {...register("category")}>
                <option value="">Select…</option>
                {eventCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Status" htmlFor="ev-status" error={err("status")}>
              <NativeSelect id="ev-status" {...register("status")}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </NativeSelect>
            </FormField>
          </div>
          <FormField label="Summary" htmlFor="ev-summary" error={err("summary")} required>
            <Input id="ev-summary" {...aria("summary")} {...register("summary")} />
          </FormField>
          <FormField label="Description" htmlFor="ev-description" error={err("description")} required>
            <Textarea id="ev-description" rows={5} {...aria("description")} {...register("description")} />
          </FormField>
          <FormField label="Agenda" htmlFor="ev-agenda" error={err("agenda")} hint="One item per line">
            <Textarea id="ev-agenda" rows={4} placeholder={"6:00 PM — Welcome\n6:30 PM — Panel"} {...register("agenda")} />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="Date" htmlFor="ev-date" error={err("date")} required>
              <Input id="ev-date" type="date" {...aria("date")} {...register("date")} />
            </FormField>
            <FormField label="Start" htmlFor="ev-startTime" error={err("startTime")} required>
              <Input id="ev-startTime" type="time" {...aria("startTime")} {...register("startTime")} />
            </FormField>
            <FormField label="End" htmlFor="ev-endTime" error={err("endTime")} required>
              <Input id="ev-endTime" type="time" {...aria("endTime")} {...register("endTime")} />
            </FormField>
          </div>

          <FormField label="Venue" htmlFor="ev-venue" error={err("venue")} required>
            <Input id="ev-venue" {...aria("venue")} {...register("venue")} />
          </FormField>
          <FormField label="Street address" htmlFor="ev-address" error={err("address")} required>
            <Input id="ev-address" {...aria("address")} {...register("address")} />
          </FormField>
          <div className="grid gap-5 sm:grid-cols-[1fr_100px]">
            <FormField label="City" htmlFor="ev-city" error={err("city")} required>
              <Input id="ev-city" {...aria("city")} {...register("city")} />
            </FormField>
            <FormField label="State" htmlFor="ev-state" error={err("state")} required>
              <Input id="ev-state" maxLength={2} className="uppercase" {...aria("state")} {...register("state")} />
            </FormField>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <FormField label="Organizer" htmlFor="ev-organizer" error={err("organizer")} required className="sm:col-span-3">
              <Input id="ev-organizer" {...aria("organizer")} {...register("organizer")} />
            </FormField>
            <FormField label="Price" htmlFor="ev-price" error={err("price")} required hint="e.g. Free or $20" className="sm:col-span-1">
              <Input id="ev-price" {...aria("price")} {...register("price")} />
            </FormField>
            <FormField label="Capacity" htmlFor="ev-capacity" error={err("capacity")} required className="sm:col-span-1">
              <Input id="ev-capacity" type="number" min={1} {...aria("capacity")} {...register("capacity", { valueAsNumber: true })} />
            </FormField>
          </div>

          <Controller
            control={control}
            name="image"
            render={({ field }) => (
              <ImageUpload id="ev-image" label="Event image *" value={field.value} onChange={field.onChange} error={err("image")} />
            )}
          />
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="event-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" /> Saving…
              </>
            ) : editing ? (
              "Save changes"
            ) : (
              "Create event"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
