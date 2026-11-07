"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { categories } from "@/data/categories";
import { cn } from "@/lib/utils";

export function DirectorySearch({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (location.trim()) params.set("location", location.trim());
    if (category) params.set("category", category);
    router.push(`/directory${params.size ? `?${params}` : ""}`);
  }

  const fieldWrap =
    "relative flex items-center rounded-md border border-input bg-white transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50";
  const inputCls =
    "h-12 w-full bg-transparent pl-10 pr-3 text-base text-foreground outline-none placeholder:text-muted-foreground";

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label="Search the business directory"
      className={cn(
        "grid gap-3 rounded-lg bg-white p-3 shadow-lift ring-1 ring-black/5 sm:p-4 sm:grid-cols-2",
        className,
      )}
    >
      <label className={cn(fieldWrap, "sm:col-span-1")}>
        <span className="sr-only">Business name or keyword</span>
        <Search className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={inputCls}
          placeholder="Business name or keyword"
          autoComplete="off"
          name="q"
        />
      </label>
      <label className={fieldWrap}>
        <span className="sr-only">Location</span>
        <MapPin className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputCls}
          placeholder="City, state or ZIP"
          autoComplete="off"
          name="location"
        />
      </label>
      <label className={cn(fieldWrap, "[&>div]:w-full")}>
        <span className="sr-only">Category</span>
        <Tag className="pointer-events-none absolute left-3 z-10 size-4 text-olive-600" aria-hidden />
        <NativeSelect
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          name="category"
          className="h-12 border-0 bg-transparent pl-10 text-base focus-visible:ring-0"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </label>
      <Button type="submit" size="lg" className="h-12">
        <Search /> Search
      </Button>
    </form>
  );
}
