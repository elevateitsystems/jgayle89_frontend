"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fileToResizedDataUrl } from "@/lib/image";
import { newId } from "@/lib/slug";
import { cn } from "@/lib/utils";

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  /** Data URL in the demo. Once the API exists, upload the File and store the returned URL here instead. */
  url: string;
}

interface Props {
  id: string;
  label: string;
  value: StoredFile[];
  onChange: (files: StoredFile[]) => void;
  /** "images" = JPG/PNG/WebP. "documents" also allows PDF (up to 1.5 MB in the demo). */
  accept?: "images" | "documents";
  max?: number;
  hint?: string;
  error?: string;
}

const IMAGE = /^image\/(jpeg|png|webp)$/;
const PDF_MAX = 1.5 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Could not read the file"));
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(file);
  });
}

export const formatBytes = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

/** Multi-file upload UI for supporting images and documents (edit requests, badge verification). */
export function AttachmentUploader({ id, label, value, onChange, accept = "images", max = 4, hint, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const allowPdf = accept === "documents";

  async function add(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    if (value.length + files.length > max) {
      toast.error(`You can attach up to ${max} files.`);
      return;
    }
    setBusy(true);
    try {
      const added: StoredFile[] = [];
      for (const file of files) {
        const isImage = IMAGE.test(file.type);
        const isPdf = allowPdf && file.type === "application/pdf";
        if (!isImage && !isPdf) {
          toast.error(`“${file.name}” isn't supported`, { description: allowPdf ? "Use JPG, PNG, WebP or PDF files." : "Use JPG, PNG or WebP images." });
          continue;
        }
        if (isPdf && file.size > PDF_MAX) {
          toast.error(`“${file.name}” is too large`, { description: "PDFs can be up to 1.5 MB in this demo." });
          continue;
        }
        if (isImage && file.size > 8 * 1024 * 1024) {
          toast.error(`“${file.name}” is too large`, { description: "Images can be up to 8 MB." });
          continue;
        }
        const url = isImage ? await fileToResizedDataUrl(file, 1200, 0.8) : await readAsDataUrl(file);
        added.push({ id: newId("file"), name: file.name, size: file.size, type: isImage ? "image/jpeg" : file.type, url });
      }
      if (added.length) onChange([...value, ...added]);
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
          void add(e.dataTransfer.files);
        }}
        className={cn("rounded-lg border-2 border-dashed bg-white p-4 transition-colors", dragging ? "border-olive-500 bg-olive-50" : "border-sand-300", error && "border-destructive/60")}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || value.length >= max}
          className="flex w-full flex-col items-center gap-1.5 rounded-md py-3 text-center text-sm text-muted-foreground hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UploadCloud className="size-6 text-olive-600" aria-hidden />
          {busy ? (
            <span className="animate-pulse">Processing…</span>
          ) : (
            <>
              <span><span className="font-semibold text-olive-700">Click to upload</span> or drag and drop</span>
              <span className="text-xs">{allowPdf ? "JPG, PNG, WebP or PDF" : "JPG, PNG or WebP"} · up to {max} files</span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          id={id}
          type="file"
          multiple
          accept={allowPdf ? "image/jpeg,image/png,image/webp,application/pdf" : "image/jpeg,image/png,image/webp"}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void add(e.target.files);
            e.target.value = "";
          }}
        />

        {value.length > 0 && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label={`${label} — attached files`}>
            {value.map((f) => (
              <li key={f.id} className="flex items-center gap-3 rounded-md border bg-sand-50 p-2">
                <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded bg-sand-200">
                  {f.type.startsWith("image/") && f.url ? (
                    <Image src={f.url} alt="" fill sizes="48px" unoptimized className="object-cover" />
                  ) : (
                    <FileText className="size-5 text-olive-700" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-olive-950">{f.name}</span>
                  <span className="block text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                </span>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${f.name}`} onClick={() => onChange(value.filter((x) => x.id !== f.id))}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      {error && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
