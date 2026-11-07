import type { TimeseriesPoint } from "@/types";

/** Vertical bar chart built with plain markup — crisp at every size, no chart lib needed. */
export function BarChart({ data, label }: { data: TimeseriesPoint[]; label: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div role="img" aria-label={`${label}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}>
      <div className="flex h-48 items-end gap-2 border-b border-sand-300 sm:gap-4">
        {data.map((d, i) => (
          <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end">
            <span className="mb-1.5 text-xs font-semibold tabular-nums text-olive-900">{d.value}</span>
            <div
              className="w-full max-w-14 rounded-t-sm bg-olive-600 transition-all hover:bg-olive-500"
              style={{ height: `${(d.value / max) * 82}%`, opacity: i === data.length - 1 ? 1 : 0.78 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-4">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center text-xs text-muted-foreground">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Area/line chart. Axis labels are HTML so text never distorts when the SVG stretches. */
export function AreaChart({ data, label }: { data: TimeseriesPoint[]; label: string }) {
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const pad = (max - min) * 0.25 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const W = 100;
  const H = 50;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * W, H - ((d.value - lo) / (hi - lo)) * H] as const);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <div role="img" aria-label={`${label}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}>
      <div className="relative h-48">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1="0" x2={W} y1={H * t} y2={H * t} stroke="var(--color-sand-300)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />
          ))}
          <path d={area} fill="var(--color-olive-500)" fillOpacity="0.14" />
          <path d={line} fill="none" stroke="var(--color-olive-700)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
        {pts.map(([x, y], i) => (
          <span
            key={i}
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-olive-700 shadow"
            style={{ left: `${x}%`, top: `${(y / H) * 100}%` }}
            title={`${data[i].label}: ${data[i].value.toLocaleString()}`}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function HBarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate pr-2 font-medium">{i.label}</span>
            <span className="tabular-nums text-muted-foreground">{i.value}</span>
          </div>
          <div className="h-2 rounded-full bg-sand-200">
            <div className="h-full rounded-full bg-olive-600" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
