import type { IndexSparkline } from "@/lib/index-charts"

function formatIndexPrice(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <div className="h-[88px] w-full bg-black" />
  }

  const width = 320
  const height = 88
  const pad = 6
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((value, index) => {
    const x = pad + (index / (values.length - 1)) * (width - pad * 2)
    const y = pad + (1 - (value - min) / span) * (height - pad * 2)
    return [x, y] as const
  })
  const line = points.map(([x, y]) => `${x},${y}`).join(" ")
  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[88px] w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        fill="none"
        points={line}
        stroke="#ff7a1a"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} fill="#ff7a1a" r="2.4" />
    </svg>
  )
}

function ChartCard({ chart }: { chart: IndexSparkline }) {
  const up = (chart.changePct ?? 0) >= 0

  return (
    <div className="overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-3 px-3 pt-3 pb-1">
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold tracking-wide text-[#ff7a1a]">
            {chart.label}
          </p>
          <p className="truncate text-[10px] tracking-wide text-white/45 uppercase">
            {chart.subtitle}
          </p>
        </div>
        <div className="text-right">
          <p className="font-heading text-sm tabular-nums text-white">
            {chart.price == null ? "—" : formatIndexPrice(chart.price)}
          </p>
          {chart.changePct == null ? (
            <p className="text-[11px] text-white/40">Daily</p>
          ) : (
            <p
              className={`text-[11px] tabular-nums ${
                up ? "text-emerald-400" : "text-[#ff4d6d]"
              }`}
            >
              {up ? "+" : ""}
              {chart.changePct.toFixed(2)}%
            </p>
          )}
        </div>
      </div>
      <Sparkline values={chart.closes} />
    </div>
  )
}

export function IndexCharts({ charts }: { charts: IndexSparkline[] }) {
  return (
    <section className="space-y-2">
      <h2 className="font-heading text-sm text-muted-foreground">
        NDX · NQ1 · MNQ1 — daily, hourly refresh
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {charts.map((chart) => (
          <ChartCard key={chart.label} chart={chart} />
        ))}
      </div>
    </section>
  )
}
