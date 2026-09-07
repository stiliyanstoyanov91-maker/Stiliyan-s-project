import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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

function QuoteTile({ quote }: { quote: MarketQuote }) {
  const up = quote.change_pct >= 0
  return (
    <Card size="sm" className="min-w-[148px] shrink-0">
      <CardContent className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {quote.name}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {quote.asset_class === "index" ? "Index" : "Crypto"}
          </Badge>
        </div>
        <p className="font-heading text-base font-medium tabular-nums">
          {formatPrice(Number(quote.price), quote.symbol)}
        </p>
        <p
          className={`text-xs tabular-nums ${up ? "text-primary" : "text-destructive"}`}
        >
          {up ? "+" : ""}
          {Number(quote.change_pct).toFixed(2)}%
        </p>
      </CardContent>
    </Card>
  )
}

export function QuotesStrip({
  quotes,
  loading,
}: {
  quotes: MarketQuote[]
  loading?: boolean
}) {
  const indices = quotes.filter((q) => q.asset_class === "index")
  const crypto = quotes.filter((q) => q.asset_class === "crypto")

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-40 shrink-0" />
        ))}
      </div>
    )
  }

  if (!quotes.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Quotes have not landed yet. The weekday ingest fills NASDAQ, S&amp;P 500
        and the top 10 coins every two hours.
      </p>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {indices.map((quote) => (
        <QuoteTile key={quote.symbol} quote={quote} />
      ))}
      {crypto.map((quote) => (
        <QuoteTile key={quote.symbol} quote={quote} />
      ))}
    </div>
  )
}
