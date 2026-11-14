/** Date helpers. Everything is UTC date-only so SSR and client always agree. */

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysFromToday(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** `todayISO()` shifted by `n` days (alias of daysFromToday, reads better in analytics code). */
export const addDays = daysFromToday;

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((parse(toISO).getTime() - parse(fromISO).getTime()) / 86_400_000);
}

function parse(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
) {
  return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: "UTC" }).format(parse(iso));
}

export function formatLongDate(iso: string) {
  return formatDate(iso, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function monthShort(iso: string) {
  return formatDate(iso, { month: "short" }).toUpperCase();
}

export function dayNum(iso: string) {
  return formatDate(iso, { day: "numeric" });
}

export function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function isUpcoming(iso: string) {
  return iso >= todayISO();
}

export function timeAgo(iso: string, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(iso);
}
