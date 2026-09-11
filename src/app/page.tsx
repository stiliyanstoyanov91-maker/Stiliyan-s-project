import { AppShell } from "@/components/app-shell"
import { MarketClock } from "@/components/market-clock"
import { QuotesStrip } from "@/components/quotes-strip"
import { BriefingPanel } from "@/components/briefing-panel"
import { NewsBoard } from "@/components/news-board"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { IndexCharts } from "@/components/index-charts"
import {
  fetchBriefings,
  fetchCalendarEvents,
  fetchNews,
  fetchQuotes,
  fetchTodayHoliday,
} from "@/lib/queries"
import { fetchIndexSparklines, emptyIndexSparklines, type IndexSparkline } from "@/lib/index-charts"
import { publicErrorMessage } from "@/lib/supabase"
import { sofiaDayKey } from "@/lib/market-hours"
import type { Briefing, CalendarEvent, MarketQuote, NewsItem } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  let quotes: MarketQuote[] = []
  let news: NewsItem[] = []
  let briefings: Briefing[] = []
  let holiday: CalendarEvent | null = null
  let todayEvents: CalendarEvent[] = []
  let indexCharts: IndexSparkline[] = []
  let error: string | null = null

  const today = sofiaDayKey()

  try {
    const [feed, charts] = await Promise.all([
      Promise.all([
        fetchQuotes(),
        fetchNews(),
        fetchBriefings(),
        fetchTodayHoliday(),
        fetchCalendarEvents(`${today}T00:00:00+03:00`, `${today}T23:59:59+03:00`),
      ]),
      fetchIndexSparklines().catch(() => emptyIndexSparklines()),
    ])
    ;[quotes, news, briefings, holiday, todayEvents] = feed
    indexCharts = charts
  } catch (err) {
    console.error("Home feed failed", err)
    error = publicErrorMessage(err, "Could not load market data.")
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Feed unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <MarketClock holidayName={holiday?.title} />
        <section className="space-y-2">
          <h2 className="font-heading text-sm text-muted-foreground">
            Stocks · NASDAQ · S&amp;P 500 · Crypto · Gold · Silver · Oil
          </h2>
          <QuotesStrip quotes={quotes} />
        </section>
        <IndexCharts
          charts={indexCharts.length ? indexCharts : emptyIndexSparklines()}
        />
        <section className="space-y-2">
          <h2 className="font-heading text-sm text-muted-foreground">
            Briefings
          </h2>
          <BriefingPanel
            briefings={briefings}
            news={news}
            events={todayEvents}
          />
        </section>
        <section className="space-y-2">
          <h2 className="font-heading text-sm text-muted-foreground">
            News
          </h2>
          <NewsBoard news={news} />
        </section>
      </div>
    </AppShell>
  )
}
