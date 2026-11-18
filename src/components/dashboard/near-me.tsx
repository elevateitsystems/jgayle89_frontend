"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Info, LocateFixed, MapPinned, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { MapView } from "@/components/shared/map-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NEARBY_KINDS, NEARBY_KIND_LABEL, RADIUS_OPTIONS, buildPlaces, formatMiles, isZip, nearby,
  type LatLng, type NearbyKind, type Radius,
} from "@/features/near-me/rules";
import { useBusinesses } from "@/hooks/use-businesses";
import { useEvents } from "@/hooks/use-events";
import { useSession } from "@/hooks/use-session";
import { todayISO } from "@/lib/date";
import { organizations, zipCentroids } from "@/lib/mock-data/organizations";
import { cn } from "@/lib/utils";

interface Origin extends LatLng {
  label: string;
}

/**
 * Member dashboard → Near Me (client update §3). Two ways to set a location: the browser's current location
 * (asks permission) or a ZIP code. Results within 10 or 25 miles show on a map and in a distance-sorted list.
 * DEMO: ZIP codes resolve from a small built-in table — connect a geocoding/ZIP service for real use.
 */
export function NearMe() {
  const user = useSession();
  const { businesses } = useBusinesses();
  const { events } = useEvents();
  const zipRef = useRef<HTMLInputElement>(null);

  const zipLookup = useMemo(() => {
    const table = new Map(Object.entries(zipCentroids).map(([z, v]) => [z, v]));
    for (const b of businesses) if (!table.has(b.zip.slice(0, 5))) table.set(b.zip.slice(0, 5), { lat: b.lat, lng: b.lng, label: `${b.city}, ${b.state}` });
    return table;
  }, [businesses]);

  const profileZip = user?.location?.zip?.slice(0, 5) ?? "";
  const [zip, setZip] = useState(profileZip);
  const [origin, setOrigin] = useState<Origin | null>(() => {
    const hit = profileZip ? zipCentroids[profileZip] : undefined;
    return hit ? { lat: hit.lat, lng: hit.lng, label: `your profile ZIP ${profileZip} (${hit.label})` } : null;
  });
  const [radius, setRadius] = useState<Radius>(25);
  const [kinds, setKinds] = useState<NearbyKind[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const places = useMemo(() => buildPlaces({ businesses, events, organizations, today: todayISO() }), [businesses, events]);
  const results = useMemo(() => (origin ? nearby(places, origin, radius, kinds) : []), [places, origin, radius, kinds]);
  const counts = useMemo(() => (origin ? nearby(places, origin, radius).reduce<Record<string, number>>((a, p) => ({ ...a, [p.kind]: (a[p.kind] ?? 0) + 1 }), {}) : {}), [places, origin, radius]);

  function searchZip(e?: React.FormEvent) {
    e?.preventDefault();
    const z = zip.trim();
    if (!isZip(z)) return setMessage("Enter a 5-digit ZIP code.");
    const hit = zipLookup.get(z);
    if (!hit) return setMessage(`We couldn't place ZIP ${z} yet — the demo ZIP lookup covers a limited set of areas (try 28301, 80903, 78205, 33611 or 23510).`);
    setMessage(null);
    setOrigin({ lat: hit.lat, lng: hit.lng, label: `ZIP ${z} (${hit.label})` });
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMessage("Your browser can't share its location. Enter a ZIP code instead.");
      zipRef.current?.focus();
      return;
    }
    setLocating(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "your current location" });
      },
      (err) => {
        setLocating(false);
        setMessage(err.code === err.PERMISSION_DENIED ? "Location permission was denied — no problem, enter a ZIP code instead." : "We couldn't get your location. Enter a ZIP code instead.");
        zipRef.current?.focus();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  const markers = results.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, title: r.name, subtitle: `${NEARBY_KIND_LABEL[r.kind]} · ${formatMiles(r.miles)}`, href: r.external ? undefined : r.href }));

  return (
    <>
      <PageHeader title="Near Me" description="Veteran-owned and veteran-friendly businesses, events, VFW and American Legion posts, nonprofits and community resources near you." />

      <section aria-label="Search location" className="mb-6 rounded-lg border bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <Button type="button" variant="outline" onClick={useMyLocation} disabled={locating} className="lg:w-auto">
            <LocateFixed /> {locating ? "Finding you…" : "Use My Current Location"}
          </Button>
          <span className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:pb-3">or</span>
          <form onSubmit={searchZip} className="flex flex-1 gap-2" role="search">
            <label className="flex-1">
              <span className="mb-1 block text-sm font-medium text-olive-950">Enter ZIP Code</span>
              <Input ref={zipRef} inputMode="numeric" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 28301" aria-describedby={message ? "near-msg" : undefined} />
            </label>
            <Button type="submit" className="self-end"><Search /> Search</Button>
          </form>
          <div role="group" aria-label="Search radius" className="inline-flex self-start rounded-md border border-input bg-white p-0.5 lg:self-end">
            {RADIUS_OPTIONS.map((r) => (
              <button key={r} type="button" aria-pressed={radius === r} onClick={() => setRadius(r)} className={cn("h-9 rounded-[5px] px-4 text-sm font-medium transition-colors", radius === r ? "bg-olive-700 text-white" : "hover:bg-sand-100")}>
                {r} miles
              </button>
            ))}
          </div>
        </div>
        {message && <p id="near-msg" role="status" className="mt-3 flex items-start gap-2 text-sm text-sand-700"><Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {message}</p>}
        {origin && <p className="mt-3 text-sm text-muted-foreground">Showing places within <strong className="text-foreground">{radius} miles</strong> of {origin.label}.</p>}
      </section>

      {origin && (
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          <Chip active={kinds.length === 0} onClick={() => setKinds([])} label="Everything" count={Object.values(counts).reduce((a, b) => a + b, 0)} />
          {NEARBY_KINDS.map((k) => (
            <Chip key={k} active={kinds.includes(k)} onClick={() => setKinds((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]))} label={NEARBY_KIND_LABEL[k]} count={counts[k] ?? 0} />
          ))}
        </div>
      )}

      {!origin ? (
        <EmptyState icon={MapPinned} title="Choose a location" description="Use your current location or enter a ZIP code to see what's near you." />
      ) : results.length === 0 ? (
        <EmptyState icon={MapPinned} title={`Nothing within ${radius} miles`} description={radius === 10 ? "Try 25 miles, or another ZIP code." : "Try another ZIP code or clear the type filters."} actionLabel={kinds.length ? "Show everything" : undefined} onAction={kinds.length ? () => setKinds([]) : undefined} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <ol className="order-2 space-y-3 lg:order-1 lg:max-h-[620px] lg:overflow-y-auto lg:pr-1" aria-label="Nearby results">
            {results.map((r) => (
              <li key={r.id} onMouseEnter={() => setSelected(r.id)} className={cn("rounded-lg border bg-card p-4 shadow-card transition-colors", selected === r.id && "border-olive-500 ring-1 ring-olive-500")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-olive-700">{NEARBY_KIND_LABEL[r.kind]}</p>
                    <p className="mt-1 font-semibold text-olive-950">{r.name}</p>
                    <p className="text-sm text-muted-foreground">{r.subtitle}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-olive-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-olive-800">{formatMiles(r.miles)}</span>
                </div>
                {r.external ? (
                  <a href={r.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-olive-700 hover:underline">
                    View listing <ExternalLink className="size-3.5" aria-hidden /><span className="sr-only"> for {r.name} (opens in a new tab)</span>
                  </a>
                ) : (
                  <Link href={r.href} className="mt-3 inline-flex text-sm font-semibold text-olive-700 hover:underline">View listing<span className="sr-only"> for {r.name}</span></Link>
                )}
              </li>
            ))}
          </ol>
          <MapView markers={markers} selectedId={selected} onSelect={setSelected} className="order-1 h-[320px] sm:h-[420px] lg:sticky lg:top-24 lg:order-2 lg:h-[620px]" />
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">Organizations listed here are sample data for the preview. Distances are straight-line estimates.</p>
    </>
  );
}

function Chip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors", active ? "border-olive-700 bg-olive-700 text-white" : "border-input bg-white hover:bg-sand-100")}>
      {label}<span className={cn("text-xs tabular-nums", active ? "text-olive-100" : "text-muted-foreground")}>{count}</span>
    </button>
  );
}
