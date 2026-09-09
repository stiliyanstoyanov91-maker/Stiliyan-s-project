import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { tickerDisplayName, tickerKind, tickerKindLabel } from "@/lib/ticker"
import type { MarketQuote } from "@/lib/types"

function formatPrice(value: number, symbol: string) {
  if (symbol.startsWith("^") || value >= 1000) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  if (value >= 1) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  }
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

function QuoteChip({ quote }: { quote: MarketQuote }) {
  const up = quote.change_pct >= 0
  const kind = tickerKind(quote)
  return (
    <div className="flex shrink-0 items-center gap-2.5 px-4">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium tracking-wide text-muted-foreground">
          {tickerDisplayName(quote)}
        </span>
        <Badge variant="outline" className="h-4 px-1 text-[10px]">
          {tickerKindLabel(kind)}
        </Badge>
      </div>
      <span
        className={`font-heading text-sm tabular-nums ${
          up ? "text-emerald-400" : ""
        }`}
      >
        {formatPrice(Number(quote.price), quote.symbol)}
      </span>
      <span
        className={`text-xs tabular-nums ${up ? "text-emerald-400" : "text-destructive"}`}
      >
        {up ? "+" : ""}
        {Number(quote.change_pct).toFixed(2)}%
      </span>
    </div>
  )
}

export function QuotesStrip({
  quotes,
  loading,
}: {
  quotes: MarketQuote[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/60 py-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-36 shrink-0" />
        ))}
      </div>
    )
  }

  if (!quotes.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Quotes have not landed yet. The weekday ingest fills mega-cap stocks,
        NASDAQ, S&amp;P 500, top 10 coins, gold, silver and crude.
      </p>
    )
  }

  const tape = [...quotes, ...quotes]

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card/60">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-card to-transparent" />
      <div className="ticker-rtl flex w-max items-center py-2.5 hover:[animation-play-state:paused]">
        {tape.map((quote, index) => (
          <div key={`${quote.symbol}-${index}`} className="flex items-center">
            <QuoteChip quote={quote} />
            <span className="text-white/15" aria-hidden>
              ·
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
