export type IndexSparkline = {
  yahooSymbol: string
  label: string
  subtitle: string
  price: number | null
  changePct: number | null
  closes: number[]
}

export const INDEX_CHARTS = [
  {
    yahooSymbol: "^NDX",
    label: "NDX",
    subtitle: "NASDAQ-100",
  },
  {
    yahooSymbol: "NQ=F",
    label: "NQ1",
    subtitle: "E-mini NASDAQ-100",
  },
  {
    yahooSymbol: "MNQ=F",
    label: "MNQ1",
    subtitle: "Micro E-mini NASDAQ-100",
  },
] as const

async function fetchYahooDaily(yahooSymbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    yahooSymbol
  )}?interval=1d&range=3mo`
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 MarketBrief" },
    next: { revalidate: 3600 },
  })
  if (!res.ok) return null
  const json = await res.json()
  const result = json?.chart?.result?.[0]
  if (!result) return null
  const meta = result.meta ?? {}
  const rawCloses: Array<number | null> =
    result.indicators?.quote?.[0]?.close ?? []
  const closes = rawCloses.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value)
  )
  const price = Number(meta.regularMarketPrice)
  const prev = Number(meta.chartPreviousClose ?? meta.previousClose)
  return {
    price: Number.isFinite(price) ? price : null,
    changePct:
      Number.isFinite(price) && prev
        ? ((price - prev) / prev) * 100
        : null,
    closes,
  }
}

export function emptyIndexSparklines(): IndexSparkline[] {
  return INDEX_CHARTS.map((item) => ({
    yahooSymbol: item.yahooSymbol,
    label: item.label,
    subtitle: item.subtitle,
    price: null,
    changePct: null,
    closes: [],
  }))
}

export async function fetchIndexSparklines(): Promise<IndexSparkline[]> {
  return Promise.all(
    INDEX_CHARTS.map(async (item) => {
      const data = await fetchYahooDaily(item.yahooSymbol).catch(() => null)
      return {
        yahooSymbol: item.yahooSymbol,
        label: item.label,
        subtitle: item.subtitle,
        price: data?.price ?? null,
        changePct: data?.changePct ?? null,
        closes: data?.closes ?? [],
      }
    })
  )
}
