import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

type Category = "crypto" | "fuels" | "traditional_markets" | "stocks"
type Region = "us" | "world"
type Sentiment = "positive" | "negative" | "neutral"

const POS =
  /\b(rally|surge|soars?|beats?|growth|cut(s|ting)? rates?|ceasefire|record high|cooling inflation|risk-on|bullish|beats estimates|strong(er)? jobs|payrolls beat)\b/i
const NEG =
  /\b(war|crash|plunge|miss(es)?|recession|hawkish|layoff|default|tariff|selloff|risk-off|bearish|invasion|sanctions|shortage|sell-off|job cuts?)\b/i
const WORLD =
  /\b(china|europe|eu|ukraine|russia|iran|opec|global|japan|yen|ecb|boe|uk |germany|middle east|hormuz|yemen|kremlin)\b/i
const CRYPTO = /\b(bitcoin|ethereum|crypto|btc|eth|solana)\b/i
const FUELS = /\b(oil|crude|opec|gasoline|diesel|natural gas|brent|wti|petrol)\b/i
const STOCKS = /\b(earnings|nasdaq|s&p|equity|stock|shares|ipo|nvidia|broadcom)\b/i

const RSS_FEEDS: { url: string; source: string; region: Region }[] = [
  {
    url: "https://feeds.reuters.com/reuters/businessNews",
    source: "Reuters",
    region: "world",
  },
  {
    url: "https://www.cnbc.com/id/10001147/device/rss/rss.html",
    source: "CNBC",
    region: "us",
  },
  {
    url: "https://www.marketwatch.com/rss/topstories",
    source: "MarketWatch",
    region: "us",
  },
  {
    url: "https://finance.yahoo.com/news/rssindex",
    source: "Yahoo Finance",
    region: "us",
  },
  {
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    source: "Federal Reserve",
    region: "us",
  },
  {
    url: "https://www.zerohedge.com/fullrss2.xml",
    source: "zerohedge",
    region: "us",
  },
]

function classifySentiment(text: string): Sentiment {
  const pos = POS.test(text)
  const neg = NEG.test(text)
  if (pos && !neg) return "positive"
  if (neg && !pos) return "negative"
  return "neutral"
}

function classifyCategory(text: string): Category | null {
  if (CRYPTO.test(text)) return "crypto"
  if (FUELS.test(text)) return "fuels"
  if (STOCKS.test(text)) return "stocks"
  if (/\b(fed|fomc|cpi|ppi|jobs|pmi|payroll|pce|unemployment)\b/i.test(text)) {
    return "traditional_markets"
  }
  return "traditional_markets"
}

function classifyRegion(text: string, fallback: Region): Region {
  if (WORLD.test(text)) return "world"
  if (/\b(fed|fomc|wall street|u\.s\.|united states|labor day|treasury)\b/i.test(text)) {
    return "us"
  }
  return fallback
}

function decode(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function tag(block: string, name: string): string {
  const match = block.match(
    new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i")
  )
  return match ? decode(match[1]) : ""
}

async function parseRss(xml: string) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1])
  return items.map((block) => {
    const title = tag(block, "title")
    const summary = tag(block, "description")
    const url = tag(block, "link") || tag(block, "guid")
    const pub = tag(block, "pubDate")
    return {
      title,
      summary: summary.slice(0, 600),
      url,
      published_at: pub ? new Date(pub).toISOString() : new Date().toISOString(),
    }
  })
}

async function ingestRss(supabase: ReturnType<typeof createClient>) {
  let count = 0
  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { "user-agent": "MarketBrief/1.0" },
      })
      if (!res.ok) continue
      const xml = await res.text()
      const items = await parseRss(xml)
      const rows = items
        .filter((item) => item.title && item.url)
        .slice(0, 20)
        .map((item) => {
          const blob = `${item.title} ${item.summary}`
          return {
            title: item.title.slice(0, 280),
            summary: item.summary,
            source: feed.source,
            url: item.url,
            published_at: item.published_at,
            region: classifyRegion(blob, feed.region),
            sentiment: classifySentiment(blob),
            category: classifyCategory(blob),
            origin: "rss" as const,
          }
        })
      if (rows.length) {
        const { error } = await supabase.from("news").upsert(rows, {
          onConflict: "url",
        })
        if (!error) count += rows.length
      }
    } catch {
      // keep other feeds going
    }
  }
  return count
}

async function ingestQuotes(supabase: ReturnType<typeof createClient>) {
  let count = 0
  try {
    const cg = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1",
      { headers: { "user-agent": "MarketBrief/1.0" } }
    )
    if (cg.ok) {
      const coins = (await cg.json()) as Array<{
        symbol: string
        name: string
        current_price: number
        price_change_percentage_24h: number
      }>
      const rows = coins.map((coin) => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change_pct: coin.price_change_percentage_24h ?? 0,
        asset_class: "crypto" as const,
        updated_at: new Date().toISOString(),
      }))
      const { error } = await supabase.from("market_quotes").upsert(rows)
      if (!error) count += rows.length
    }
  } catch {
    // ignore
  }

  for (const [symbol, name] of [
    ["NVDA", "NVIDIA"],
    ["AAPL", "Apple"],
    ["MSFT", "Microsoft"],
    ["AMZN", "Amazon"],
    ["GOOGL", "Alphabet"],
    ["META", "Meta"],
    ["TSLA", "Tesla"],
    ["BRK-B", "Berkshire"],
    ["AVGO", "Broadcom"],
    ["JPM", "JPMorgan"],
    ["^IXIC", "NASDAQ"],
    ["^GSPC", "S&P 500"],
    ["GC=F", "Gold"],
    ["SI=F", "Silver"],
    ["CL=F", "WTI Crude"],
  ] as const) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`
      const res = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0 MarketBrief" },
      })
      if (!res.ok) continue
      const json = await res.json()
      const meta = json?.chart?.result?.[0]?.meta
      const price = Number(meta?.regularMarketPrice)
      const prev = Number(meta?.chartPreviousClose ?? meta?.previousClose)
      if (!price) continue
      const change = prev ? ((price - prev) / prev) * 100 : 0
      const { error } = await supabase.from("market_quotes").upsert({
        symbol,
        name,
        price,
        change_pct: change,
        asset_class: "index",
        updated_at: new Date().toISOString(),
      })
      if (!error) count += 1
    } catch {
      // ignore
    }
  }
  return count
}

async function prunePast(supabase: ReturnType<typeof createClient>) {
  const now = new Date()
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Sofia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
  const offsetName =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Sofia",
      timeZoneName: "longOffset",
      hour: "numeric",
    })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT+03:00"
  const offset = offsetName.replace("GMT", "").replace(/(\d{2})(\d{2})/, "$1:$2")
  const cutoff = new Date(`${day}T00:00:00${offset}`).toISOString()
  await supabase.from("news").delete().lt("published_at", cutoff)
  await supabase.from("calendar_events").delete().lt("starts_at", cutoff)
}

async function writeBriefings(supabase: ReturnType<typeof createClient>) {
  const now = new Date()
  const sofia = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Sofia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now)
  const date = `${sofia.find((p) => p.type === "year")?.value}-${sofia.find((p) => p.type === "month")?.value}-${sofia.find((p) => p.type === "day")?.value}`
  const weekday = sofia.find((p) => p.type === "weekday")?.value

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .gte("starts_at", `${date}T00:00:00+03:00`)
    .lte("starts_at", `${date}T23:59:59+03:00`)
    .order("starts_at")

  const { data: weekEvents } = await supabase
    .from("calendar_events")
    .select("*")
    .gte("starts_at", `${date}T00:00:00+03:00`)
    .lte("starts_at", new Date(now.getTime() + 7 * 86400000).toISOString())
    .eq("is_holiday", false)
    .order("starts_at")
    .limit(12)

  const { data: news } = await supabase
    .from("news")
    .select("*")
    .neq("sentiment", "neutral")
    .order("published_at", { ascending: false })
    .limit(20)

  const holiday = (events ?? []).find((e: { is_holiday: boolean }) => e.is_holiday)
  const headlines = (news ?? [])
    .slice(0, 12)
    .map((n: { title: string; source: string }) => `- ${n.title} (${n.source})`)
  const remainingEvents = (events ?? [])
    .filter(
      (e: { is_holiday: boolean; starts_at: string }) =>
        !e.is_holiday && new Date(e.starts_at) >= now
    )
    .map(
      (e: { title: string; starts_at: string }) =>
        `- ${e.title} (${new Date(e.starts_at).toLocaleTimeString("en-GB", {
          timeZone: "Europe/Sofia",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        })} Sofia)`
    )

  const dailyBody = [
    holiday
      ? `US cash session is closed (${holiday.title}).`
      : "US cash session is scheduled as usual — 15:00 Sofia wrap of the day so far and what is still on the tape into the close.",
    headlines.length
      ? `Day so far:\n${headlines.join("\n")}`
      : "Day so far:\n- Waiting on the next RSS/X pull.",
    remainingEvents.length
      ? `Still ahead today:\n${remainingEvents.join("\n")}`
      : "Still ahead today:\n- No scheduled high-impact prints left after 15:00 Sofia.",
  ].join("\n")

  await supabase.from("briefings").upsert(
    {
      briefing_date: date,
      kind: "daily",
      headline: holiday
        ? `Labor Day tape — markets closed, week still loaded`
        : `Daily futures briefing · ${date}`,
      body: dailyBody,
      updated_at: now.toISOString(),
    },
    { onConflict: "briefing_date,kind" }
  )

  if (weekday === "Mon") {
    const weekLines = (weekEvents ?? []).map(
      (e: { title: string; starts_at: string }) =>
        `- ${e.title} (${new Date(e.starts_at).toISOString().slice(0, 10)})`
    )
    await supabase.from("briefings").upsert(
      {
        briefing_date: date,
        kind: "weekly",
        headline: "Week ahead for futures",
        body: [
          "Highest-impact prints this week for the cash open and index futures:",
          weekLines.join("\n") || "- Calendar still filling.",
          "Crypto:",
          "- BTC weekly options expiry — Fri 11 Sep, into the CPI print",
          "- CME Bitcoin and Ether futures: positioning around Friday CPI and next week's FOMC",
          "- Watch BTC vs DXY and real yields if CPI prints hot",
          "Watch CPI/PPI, the FOMC decision, crude inventories, and any Middle East supply headlines.",
        ].join("\n"),
        updated_at: now.toISOString(),
      },
      { onConflict: "briefing_date,kind" }
    )
  }
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  )
  const started = new Date().toISOString()
  const { data: run } = await supabase
    .from("ingest_runs")
    .insert({ status: "running", started_at: started })
    .select("id")
    .single()

  try {
    await prunePast(supabase)
    const newsCount = await ingestRss(supabase)
    const quoteCount = await ingestQuotes(supabase)
    await writeBriefings(supabase)
    await supabase
      .from("ingest_runs")
      .update({
        status: "ok",
        finished_at: new Date().toISOString(),
        news_count: newsCount,
        quote_count: quoteCount,
      })
      .eq("id", run?.id)
    return new Response(
      JSON.stringify({ ok: true, newsCount, quoteCount }),
      { headers: { "content-type": "application/json" } }
    )
  } catch (error) {
    await supabase
      .from("ingest_runs")
      .update({
        status: "error",
        finished_at: new Date().toISOString(),
        error: String(error),
      })
      .eq("id", run?.id)
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
})
