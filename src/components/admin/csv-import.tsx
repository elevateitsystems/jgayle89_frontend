"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Download, FileSpreadsheet, FileUp, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCategories } from "@/hooks/use-categories";
import { analyzeCSV, CSV_COLUMNS, REQUIRED_COLUMNS, SAMPLE_CSV, SAMPLE_CSV_WITH_ERRORS, toCSV, type CsvAnalysis } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { businessService } from "@/services/business-service";

const MAX_BYTES = 2 * 1024 * 1024;
const PREVIEW_ROWS = 10;

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);

interface Loaded {
  name: string;
  size: number;
  text: string;
}

export function CsvImport() {
  const { businesses } = useBusinesses();
  const { categories } = useCategories();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<Loaded | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);
  const [showAll, setShowAll] = useState(false);

  const analysis: CsvAnalysis | null = useMemo(
    () => (file ? analyzeCSV(file.text, businesses.map((b) => b.name), categories) : null),
    [file, businesses, categories],
  );

  async function handleFile(f?: File | null) {
    if (!f) return;
    setResult(null);
    setFileError(null);
    setShowAll(false);
    if (!/\.csv$/i.test(f.name) && !/csv|excel|text\/plain/.test(f.type)) {
      setFile(null);
      setFileError("That doesn't look like a CSV file. Please upload a .csv file.");
      toast.error("Unsupported file type");
      return;
    }
    if (f.size > MAX_BYTES) {
      setFile(null);
      setFileError(`File is too large (${fmtSize(f.size)}). The limit is ${fmtSize(MAX_BYTES)}.`);
      toast.error("File is too large");
      return;
    }
    if (f.size === 0) {
      setFile(null);
      setFileError("The file is empty.");
      return;
    }
    const text = await f.text();
    setFile({ name: f.name, size: f.size, text });
    toast.success("File loaded", { description: "Review the preview below before importing." });
  }

  function loadSample(withErrors: boolean) {
    const text = withErrors ? SAMPLE_CSV_WITH_ERRORS : SAMPLE_CSV;
    setResult(null);
    setFileError(null);
    setShowAll(false);
    setFile({ name: withErrors ? "sample-with-errors.csv" : "sample-businesses.csv", size: new Blob([text]).size, text });
  }

  function reset() {
    setFile(null);
    setResult(null);
    setFileError(null);
  }

  async function runImport() {
    if (!analysis) return;
    const valid = analysis.rows.filter((r) => r.business).map((r) => r.business!);
    if (valid.length === 0) return;
    setImporting(true);
    try {
      await businessService.createMany(valid);
      setResult({ imported: valid.length, failed: analysis.failedCount });
      toast.success(`Imported ${valid.length} ${valid.length === 1 ? "business" : "businesses"}`, {
        description: analysis.failedCount ? `${analysis.failedCount} rows were skipped.` : "They were added as Pending for review.",
      });
    } catch {
      toast.error("Import failed", { description: "Please try again." });
    } finally {
      setImporting(false);
    }
  }

  function downloadErrors() {
    if (!analysis) return;
    const rows = analysis.rows.filter((r) => r.errors.length);
    download(
      "import-errors.csv",
      toCSV([["line", "name", "errors"], ...rows.map((r) => [r.line, r.raw.name ?? "", r.errors.join("; ")])]),
    );
  }

  const failed = analysis?.rows.filter((r) => r.errors.length > 0) ?? [];
  const previewRows = analysis ? (showAll ? analysis.rows : analysis.rows.slice(0, PREVIEW_ROWS)) : [];
  const blocked = !!analysis && analysis.missingColumns.length > 0;

  return (
    <>
      <PageHeader
        title="CSV import"
        description="Upload a spreadsheet of businesses. Everything is parsed and validated in your browser — nothing is uploaded to a server."
        actions={
          <>
            <Button variant="outline" onClick={() => download("sitrep-sample-businesses.csv", SAMPLE_CSV)}>
              <Download /> Sample CSV
            </Button>
            <Button variant="outline" onClick={() => download("sitrep-sample-with-errors.csv", SAMPLE_CSV_WITH_ERRORS)}>
              <Download /> Sample with errors
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {/* Dropzone */}
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
              "rounded-lg border-2 border-dashed bg-white p-8 text-center transition-colors sm:p-12",
              dragging ? "border-olive-500 bg-olive-50" : "border-sand-300",
              fileError && "border-destructive/50",
            )}
          >
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-olive-100 text-olive-700">
              <UploadCloud className="size-7" aria-hidden />
            </span>
            <h2 className="mt-4 font-sans text-lg font-semibold text-olive-950">Drag and drop your CSV here</h2>
            <p className="mt-1 text-sm text-muted-foreground">or choose a file from your computer · .csv up to {fmtSize(MAX_BYTES)}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button onClick={() => inputRef.current?.click()}>
                <FileUp /> Choose file
              </Button>
              <Button variant="outline" onClick={() => loadSample(false)}>
                Try sample data
              </Button>
              <Button variant="outline" onClick={() => loadSample(true)}>
                Try sample with errors
              </Button>
            </div>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Upload CSV file" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
            {fileError && (
              <p role="alert" className="mt-5 inline-flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                <AlertCircle className="size-4" aria-hidden /> {fileError}
              </p>
            )}
          </div>

          {/* File info + validation */}
          {file && analysis && (
            <section className="rounded-lg border bg-card p-5 shadow-card" aria-label="File details">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex size-11 items-center justify-center rounded-md bg-olive-100 text-olive-700">
                  <FileSpreadsheet className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-olive-950">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {fmtSize(file.size)} · {analysis.rows.length} data rows · {analysis.headers.length} columns
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <Trash2 /> Remove
                </Button>
              </div>

              {blocked ? (
                <div role="alert" className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-destructive">
                    <AlertCircle className="size-4" aria-hidden /> Missing required columns
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Add these headers and re-upload: <strong>{analysis.missingColumns.join(", ")}</strong>.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Stat icon={CheckCircle2} tone="ok" label="Ready to import" value={analysis.validCount} />
                  <Stat icon={AlertCircle} tone={analysis.failedCount ? "bad" : "muted"} label="Failed rows" value={analysis.failedCount} />
                  <Stat icon={AlertTriangle} tone={analysis.warningCount ? "warn" : "muted"} label="With warnings" value={analysis.warningCount} />
                </div>
              )}
              {analysis.unknownColumns.length > 0 && !blocked && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Ignored unknown columns: {analysis.unknownColumns.join(", ")}
                </p>
              )}
            </section>
          )}

          {/* Preview */}
          {analysis && !blocked && analysis.rows.length > 0 && (
            <section className="rounded-lg border bg-card shadow-card" aria-label="Import preview">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                <div>
                  <h2 className="font-sans text-base font-semibold text-olive-950">Preview</h2>
                  <p className="text-xs text-muted-foreground">
                    Showing {previewRows.length} of {analysis.rows.length} rows · imported listings are added as <strong>Pending</strong>
                  </p>
                </div>
                {analysis.rows.length > PREVIEW_ROWS && (
                  <Button variant="outline" size="sm" onClick={() => setShowAll((s) => !s)}>
                    {showAll ? "Show fewer" : "Show all rows"}
                  </Button>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14 pl-4">Line</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden sm:table-cell">Location</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((r) => (
                    <TableRow key={r.line} className={r.errors.length ? "bg-destructive/[0.03]" : undefined}>
                      <TableCell className="pl-4 tabular-nums text-muted-foreground">{r.line}</TableCell>
                      <TableCell className="max-w-[12rem] truncate font-medium">{r.raw.name || <span className="italic text-muted-foreground">(empty)</span>}</TableCell>
                      <TableCell className="hidden md:table-cell">{r.raw.category}</TableCell>
                      <TableCell className="hidden sm:table-cell">{[r.raw.city, r.raw.state].filter(Boolean).join(", ")}</TableCell>
                      <TableCell className="whitespace-normal">
                        {r.errors.length > 0 ? (
                          <span className="inline-flex items-start gap-1.5 text-xs font-medium text-destructive">
                            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {r.errors.join("; ")}
                          </span>
                        ) : r.warnings.length > 0 ? (
                          <span className="inline-flex items-start gap-1.5 text-xs font-medium text-sand-700">
                            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {r.warnings[0]}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-olive-700">
                            <CheckCircle2 className="size-3.5" aria-hidden /> Valid
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          )}

          {analysis && !blocked && analysis.rows.length === 0 && (
            <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">The file has headers but no data rows.</p>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {analysis && !blocked && analysis.rows.length > 0 && (
            <div className="rounded-lg border bg-card p-5 shadow-card xl:sticky xl:top-24">
              <h2 className="font-sans text-base font-semibold text-olive-950">{result ? "Import summary" : "Ready to import"}</h2>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Total rows</dt><dd className="font-semibold tabular-nums">{analysis.rows.length}</dd></div>
                <div className="flex justify-between"><dt className="text-olive-700">{result ? "Imported successfully" : "Will import"}</dt><dd className="font-semibold tabular-nums text-olive-700">{result ? result.imported : analysis.validCount}</dd></div>
                <div className="flex justify-between"><dt className="text-destructive">{result ? "Failed / skipped" : "Will be skipped"}</dt><dd className="font-semibold tabular-nums text-destructive">{result ? result.failed : analysis.failedCount}</dd></div>
              </dl>

              {!result ? (
                <Button size="lg" className="mt-5 w-full" disabled={analysis.validCount === 0 || importing} onClick={runImport}>
                  {importing ? (
                    <>
                      <Loader2 className="animate-spin" /> Importing…
                    </>
                  ) : (
                    `Import ${analysis.validCount} ${analysis.validCount === 1 ? "business" : "businesses"}`
                  )}
                </Button>
              ) : (
                <div className="mt-5 space-y-2">
                  <p className="flex items-center gap-2 rounded-md bg-olive-100 px-3 py-2 text-sm font-medium text-olive-900">
                    <CheckCircle2 className="size-4" aria-hidden /> Import complete
                  </p>
                  <Link href="/admin/businesses" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
                    View businesses
                  </Link>
                  <Button variant="outline" className="w-full" onClick={reset}>
                    Import another file
                  </Button>
                </div>
              )}

              {failed.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans text-sm font-semibold text-olive-950">Failed rows</h3>
                    <button type="button" onClick={downloadErrors} className="text-xs font-semibold text-olive-700 underline-offset-2 hover:underline">
                      Download report
                    </button>
                  </div>
                  <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs">
                    {failed.map((r) => (
                      <li key={r.line} className="rounded-md bg-destructive/5 p-2.5">
                        <p className="font-semibold text-foreground">Line {r.line}{r.raw.name ? ` · ${r.raw.name}` : ""}</p>
                        <p className="mt-0.5 text-destructive">{r.errors.join("; ")}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border bg-card p-5 shadow-card">
            <h2 className="font-sans text-base font-semibold text-olive-950">CSV format</h2>
            <p className="mt-1 text-sm text-muted-foreground">First row must be headers. Required columns are marked.</p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {CSV_COLUMNS.map((c) => (
                <li
                  key={c}
                  className={cn(
                    "rounded-md px-2 py-1 font-mono text-xs",
                    (REQUIRED_COLUMNS as readonly string[]).includes(c) ? "bg-olive-100 font-semibold text-olive-900" : "bg-sand-100 text-muted-foreground",
                  )}
                >
                  {c}
                  {(REQUIRED_COLUMNS as readonly string[]).includes(c) && "*"}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Use semicolons to separate multiple <code>services</code>. <code>category</code> accepts a category name (e.g. “Food &amp; Drink”).
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof CheckCircle2; label: string; value: number; tone: "ok" | "bad" | "warn" | "muted" }) {
  const tones = {
    ok: "bg-olive-100 text-olive-800",
    bad: "bg-destructive/10 text-destructive",
    warn: "bg-brass-soft text-sand-700",
    muted: "bg-sand-100 text-muted-foreground",
  };
  return (
    <div className={cn("flex items-center gap-3 rounded-md px-4 py-3", tones[tone])}>
      <Icon className="size-5 shrink-0" aria-hidden />
      <div>
        <p className="font-heading text-2xl font-semibold leading-none tabular-nums">{value}</p>
        <p className="mt-1 text-xs font-medium">{label}</p>
      </div>
    </div>
  );
}
