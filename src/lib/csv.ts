import { z } from "zod";
import { categories } from "@/data/categories";
import type { BusinessInput } from "@/services/business-service";
import type { BranchOfService } from "@/types";

/** RFC 4180-style CSV parser: quoted fields, escaped quotes, CRLF, BOM. */
export function parseCSV(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

export function toCSV(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((v) => (/[",\n\r]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v))).join(","))
    .join("\r\n");
}

export const CSV_COLUMNS = [
  "name", "category", "tagline", "description", "address", "city", "state", "zip", "lat", "lng",
  "phone", "email", "website", "branch", "year_founded", "services", "keywords", "hours",
] as const;
export const REQUIRED_COLUMNS = ["name", "category", "address", "city", "state", "email"] as const;

const BRANCHES: BranchOfService[] = ["Army", "Navy", "Marine Corps", "Air Force", "Space Force", "Coast Guard", "National Guard"];

const rowSchema = z.object({
  name: z.string().trim().min(2, "Name is required (min 2 characters)"),
  category: z.string().trim().min(1, "Category is required"),
  address: z.string().trim().min(3, "Address is required"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().length(2, "State must be a 2-letter code"),
  email: z.email("Invalid email"),
  website: z.string().trim().refine((v) => !v || /^https?:\/\/\S+\.\S+$/i.test(v), "Website must start with http(s)://"),
  zip: z.string().trim().refine((v) => !v || /^\d{5}(-\d{4})?$/.test(v), "Invalid ZIP"),
  lat: z.string().trim().refine((v) => !v || (Number.isFinite(+v) && Math.abs(+v) <= 90), "Invalid latitude"),
  lng: z.string().trim().refine((v) => !v || (Number.isFinite(+v) && Math.abs(+v) <= 180), "Invalid longitude"),
  year_founded: z.string().trim().refine((v) => !v || (/^\d{4}$/.test(v) && +v >= 1900 && +v <= new Date().getFullYear()), "Invalid year"),
});

export interface ParsedRow {
  line: number; // 1-based line in the file (header = 1)
  raw: Record<string, string>;
  errors: string[];
  warnings: string[];
  business?: BusinessInput;
}

export interface CsvAnalysis {
  headers: string[];
  missingColumns: string[];
  unknownColumns: string[];
  rows: ParsedRow[];
  validCount: number;
  failedCount: number;
  warningCount: number;
}

function matchCategory(input: string) {
  const s = input.trim().toLowerCase();
  return categories.find((c) => c.id === s || c.name.toLowerCase() === s || c.name.toLowerCase().replace(/&/g, "and") === s);
}

export function analyzeCSV(text: string, existingNames: string[]): CsvAnalysis {
  const table = parseCSV(text);
  const headers = (table[0] ?? []).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const missingColumns = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  const unknownColumns = headers.filter((h) => h && !(CSV_COLUMNS as readonly string[]).includes(h));

  const seen = new Set(existingNames.map((n) => n.toLowerCase()));
  const rows: ParsedRow[] = [];

  if (missingColumns.length === 0) {
    table.slice(1).forEach((cells, idx) => {
      const raw: Record<string, string> = {};
      headers.forEach((h, i) => (raw[h] = (cells[i] ?? "").trim()));
      const errors: string[] = [];
      const warnings: string[] = [];

      const parsed = rowSchema.safeParse({ ...Object.fromEntries(CSV_COLUMNS.map((c) => [c, ""])), ...raw });
      if (!parsed.success) parsed.error.issues.forEach((i) => errors.push(i.message));

      const cat = matchCategory(raw.category ?? "");
      if (raw.category && !cat) errors.push(`Unknown category "${raw.category}"`);

      const key = (raw.name ?? "").toLowerCase();
      if (key) {
        if (seen.has(key)) errors.push("Duplicate business name");
        else seen.add(key);
      }

      const branch = BRANCHES.find((b) => b.toLowerCase() === (raw.branch ?? "").toLowerCase());
      if (raw.branch && !branch) warnings.push(`Unknown branch "${raw.branch}" — defaulted to Army`);
      if (!raw.lat || !raw.lng) warnings.push("No coordinates — map pin uses a default position");

      let business: BusinessInput | undefined;
      if (errors.length === 0 && cat) {
        business = {
          name: raw.name,
          slug: "",
          category: cat.id,
          tagline: raw.tagline || `${cat.name} in ${raw.city}, ${raw.state.toUpperCase()}`,
          description: raw.description || `${raw.name} is a veteran-owned business in ${raw.city}, ${raw.state.toUpperCase()}. (Imported sample listing — add a full description.)`,
          services: (raw.services ?? "").split(/[;|]/).map((s) => s.trim()).filter(Boolean),
          keywords: (raw.keywords ?? "").split(/[;|,]/).map((s) => s.trim()).filter(Boolean),
          address: raw.address,
          city: raw.city,
          state: raw.state.toUpperCase(),
          zip: raw.zip ?? "",
          lat: raw.lat ? Number(raw.lat) : 39.5,
          lng: raw.lng ? Number(raw.lng) : -98.35,
          phone: raw.phone ?? "",
          email: raw.email,
          website: raw.website ?? "",
          rating: 0,
          reviewCount: 0,
          branch: branch ?? "Army",
          yearFounded: raw.year_founded ? Number(raw.year_founded) : new Date().getFullYear(),
          hours: raw.hours ?? "",
          coverImage: cat.image,
          featured: false,
          status: "pending",
        };
      }
      rows.push({ line: idx + 2, raw, errors, warnings, business });
    });
  }

  return {
    headers,
    missingColumns: [...missingColumns],
    unknownColumns,
    rows,
    validCount: rows.filter((r) => r.errors.length === 0).length,
    failedCount: rows.filter((r) => r.errors.length > 0).length,
    warningCount: rows.filter((r) => r.errors.length === 0 && r.warnings.length > 0).length,
  };
}

export const SAMPLE_CSV = toCSV([
  [...CSV_COLUMNS],
  ["Granite State Printing", "Creative & Media", "Print, signage and promo products", "Family-run print shop founded by a retired Navy yeoman.", "18 Mill Street", "Manchester", "NH", "03101", 42.9956, -71.4548, "(555) 010-0201", "print@granitestate.example", "https://granitestate.example", "Navy", 2015, "Signage;Business cards;Banners", "print;signs;promo", "Mon–Fri 8a–5p"],
  ["Pelican Bay Paddle Co.", "Outdoors & Recreation", "Kayak rentals and guided paddles", "Guided kayak tours and rentals on the gulf coast.", "402 Gulf Boulevard", "Pensacola", "FL", "32502", 30.4213, -87.2169, "(555) 010-0202", "paddle@pelicanbay.example", "https://pelicanbay.example", "Coast Guard", 2018, "Kayak rentals;Guided tours", "kayak;paddle;tours", "Daily 8a–6p"],
  ["Cornerstone HVAC Services", "Construction & Trades", "Heating, cooling and air quality", "Licensed HVAC installation and repair.", "77 Commerce Drive", "Omaha", "NE", "68102", 41.2565, -95.9345, "(555) 010-0203", "service@cornerstonehvac.example", "https://cornerstonehvac.example", "Air Force", 2012, "Installation;Repair;Maintenance plans", "hvac;heating;cooling", "Mon–Sat 7a–6p"],
  ["Lantern Lane Books", "Personal Services", "", "", "9 Lantern Lane", "Savannah", "GA", "31401", "", "", "(555) 010-0204", "hello@lanternbooks.example", "", "Army", 2020, "", "", ""],
]);

export const SAMPLE_CSV_WITH_ERRORS = toCSV([
  [...CSV_COLUMNS],
  ["Harbor Point Welding", "Construction & Trades", "Marine and structural welding", "Certified welders serving the harbor district.", "12 Dockside Road", "Baltimore", "MD", "21201", 39.2904, -76.6122, "(555) 010-0301", "weld@harborpoint.example", "https://harborpoint.example", "Navy", 2016, "Welding;Fabrication", "welding;marine", "Mon–Fri 7a–4p"],
  ["", "Technology", "Missing a name", "", "5 Main Street", "Austin", "TX", "78701", "", "", "", "oops@example.com", "", "Army", "", "", "", ""],
  ["Ridgeline IT", "Technology", "IT support", "Managed IT for small teams.", "88 Ridge Road", "Boise", "ID", "83702", 43.615, -116.2023, "(555) 010-0303", "not-an-email", "https://ridgeline.example", "Army", 2019, "", "", ""],
  ["Sunrise Cafe & Bakery", "Food & Drink", "Breakfast and baked goods", "Neighborhood bakery and café.", "301 Sunrise Ave", "Tucson", "AZ", "85701", 32.2226, -110.9747, "(555) 010-0304", "hi@sunrisecafe.example", "https://sunrisecafe.example", "Marine Corps", 2017, "Breakfast;Bakery", "cafe;bakery", ""],
  ["Ironwood Coffee Roasters", "Food & Drink", "Duplicate of an existing listing", "", "214 Hay Street", "Fayetteville", "NC", "28301", "", "", "", "dupe@example.com", "", "Army", 2017, "", "", ""],
  ["Cedar Creek Farm Stand", "Agriculture", "Unknown category", "", "1 County Road 9", "Lincoln", "NE", "68508", "", "", "", "farm@cedarcreek.example", "", "Army", 2014, "", "", ""],
]);
