"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Images, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sampleImages } from "@/data/images";
import { fileToResizedDataUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

interface Props {
  value?: string;
  onChange: (value: string) => void;
  label: string;
  id: string;
  aspect?: "wide" | "square";
  error?: string;
  hint?: string;
}

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Image upload UI. Files are resized client-side and stored as data URLs for
 * the demo; in Phase 2 this posts to the API and stores the returned URL.
 */
export function ImageUpload({ value, onChange, label, id, aspect = "wide", error, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showSamples, setShowSamples] = useState(false);

  async function handleFile(file?: File | null) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      toast.error("Unsupported file type", { description: "Please upload a JPG, PNG, WebP or GIF image." });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image is too large", { description: "Maximum size is 8 MB." });
      return;
    }
    setBusy(true);
    try {
      onChange(await fileToResizedDataUrl(file, aspect === "square" ? 600 : 1400));
      toast.success("Image added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-olive-950">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed bg-white transition-colors",
          dragging ? "border-olive-500 bg-olive-50" : "border-sand-300",
          error && "border-destructive/60",
          aspect === "square" ? "aspect-square max-w-[200px]" : "aspect-[16/9]",
        )}
      >
        {value ? (
          <>
            <Image src={value} alt={`${label} preview`} fill sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-olive-950/80 to-transparent p-3">
              <Button type="button" size="sm" variant="light" onClick={() => inputRef.current?.click()}>
                Replace
              </Button>
              <Button type="button" size="sm" variant="light" onClick={() => onChange("")} aria-label={`Remove ${label}`}>
                <Trash2 /> Remove
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground hover:bg-sand-50"
          >
            {busy ? (
              <span className="animate-pulse">Processing…</span>
            ) : (
              <>
                <UploadCloud className="size-7 text-olive-600" aria-hidden />
                <span>
                  <span className="font-semibold text-olive-700">Click to upload</span> or drag and drop
                </span>
                <span className="text-xs">JPG, PNG or WebP · up to 8 MB</span>
              </>
            )}
          </button>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => setShowSamples((s) => !s)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-olive-700 underline-offset-2 hover:underline"
          aria-expanded={showSamples}
        >
          <Images className="size-3.5" aria-hidden /> {showSamples ? "Hide sample images" : "Choose a sample image"}
        </button>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {showSamples && (
        <ul className="mt-3 grid max-h-52 grid-cols-4 gap-2 overflow-y-auto rounded-md border bg-white p-2 sm:grid-cols-5" aria-label="Sample images">
          {sampleImages.map((src) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => {
                  onChange(src);
                  setShowSamples(false);
                }}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-md ring-offset-1 transition hover:ring-2 hover:ring-olive-500",
                  value === src && "ring-2 ring-olive-700",
                )}
                aria-label={`Use sample image ${src.split("/").pop()}`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-destructive">
          <ImagePlus className="size-3.5" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}
