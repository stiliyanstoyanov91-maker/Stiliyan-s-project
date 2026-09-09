import type { MarketQuote } from "@/lib/types"

export const TICKER_STOCKS = [
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "META", name: "Meta" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "BRK-B", name: "Berkshire" },
  { symbol: "AVGO", name: "Broadcom" },
  { symbol: "JPM", name: "JPMorgan" },
] as const

export const TICKER_INDICES = [
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^GSPC", name: "S&P 500" },
] as const

export const TICKER_COMMODITIES = [
  { symbol: "GC=F", name: "Gold" },
  { symbol: "SI=F", name: "Silver" },
  { symbol: "CL=F", name: "WTI Crude" },
] as const

export const TICKER_YAHOO = [
  ...TICKER_STOCKS,
  ...TICKER_INDICES,
  ...TICKER_COMMODITIES,
] as const

const STOCK_SET = new Set(TICKER_STOCKS.map((item) => item.symbol))
const INDEX_SET = new Set(TICKER_INDICES.map((item) => item.symbol))

export type TickerKind = "stock" | "index" | "crypto" | "metal" | "oil"

export function tickerDisplayName(quote: MarketQuote) {
  const mapped = TICKER_YAHOO.find((item) => item.symbol === quote.symbol)
  return mapped?.name ?? quote.name
}

export function tickerKind(quote: MarketQuote): TickerKind {
  if (quote.asset_class === "crypto") return "crypto"
  if (quote.symbol === "CL=F") return "oil"
  if (quote.symbol === "GC=F" || quote.symbol === "SI=F") return "metal"
  if (STOCK_SET.has(quote.symbol)) return "stock"
  if (INDEX_SET.has(quote.symbol)) return "index"
  return "index"
}

export function tickerKindLabel(kind: TickerKind) {
  switch (kind) {
    case "stock":
      return "Stock"
    case "index":
      return "Index"
    case "crypto":
      return "Crypto"
    case "metal":
      return "Metal"
    case "oil":
      return "Oil"
  }
}

export function sortTickerQuotes(quotes: MarketQuote[]): MarketQuote[] {
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]))
  const stocks = TICKER_STOCKS.map((item) => bySymbol.get(item.symbol)).filter(
    (quote): quote is MarketQuote => Boolean(quote)
  )
  const indices = TICKER_INDICES.map((item) => bySymbol.get(item.symbol)).filter(
    (quote): quote is MarketQuote => Boolean(quote)
  )
  const crypto = quotes.filter((quote) => quote.asset_class === "crypto")
  const commodities = TICKER_COMMODITIES.map((item) =>
    bySymbol.get(item.symbol)
  ).filter((quote): quote is MarketQuote => Boolean(quote))
  const used = new Set(
    [...stocks, ...indices, ...crypto, ...commodities].map((q) => q.symbol)
  )
  const rest = quotes.filter((quote) => !used.has(quote.symbol))
  return [...stocks, ...indices, ...crypto, ...commodities, ...rest]
}

export async function fetchYahooQuote(
  symbol: string,
  name: string
): Promise<MarketQuote | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 MarketBrief" },
      next: { revalidate: 120 },
    })
    if (!res.ok) return null
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    const price = Number(meta?.regularMarketPrice)
    const prev = Number(meta?.chartPreviousClose ?? meta?.previousClose)
    if (!price) return null
    return {
      symbol,
      name,
      price,
      change_pct: prev ? ((price - prev) / prev) * 100 : 0,
      asset_class: "index",
      updated_at: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export async function fillTickerGaps(
  quotes: MarketQuote[]
): Promise<MarketQuote[]> {
  const have = new Set(quotes.map((quote) => quote.symbol))
  const missing = TICKER_YAHOO.filter((item) => !have.has(item.symbol))
  if (!missing.length) return sortTickerQuotes(quotes)
  const extra = (
    await Promise.all(
      missing.map((item) => fetchYahooQuote(item.symbol, item.name))
    )
  ).filter((quote): quote is MarketQuote => Boolean(quote))
  return sortTickerQuotes([...quotes, ...extra])
}
