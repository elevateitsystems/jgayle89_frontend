import type { Metadata } from "next";
import { CsvImport } from "@/components/admin/csv-import";

export const metadata: Metadata = { title: "CSV Import" };

export default function ImportPage() {
  return <CsvImport />;
}
