import { AppShell } from "@/components/app-shell"
import { MarketClock } from "@/components/market-clock"
import { QuotesStrip } from "@/components/quotes-strip"
import { BriefingPanel } from "@/components/briefing-panel"
import { NewsBoard } from "@/components/news-board"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  fetchBriefings,
  fetchNews,
  fetchQuotes,
  fetchTodayHoliday,
} from "@/lib/queries"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  let quotes = []
  let news = []
  let briefings = []
  let holiday = null
  let error: string | null = null

  try {
    ;[quotes, news, briefings, holiday] = await Promise.all([
      fetchQuotes(),
      fetchNews(),
      fetchBriefings(),
      fetchTodayHoliday(),
    ])
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load market data."
  }

  return (
    <AppShell title="Home">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Feed unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <MarketClock holidayName={holiday?.title} />
        <section className="space-y-2">
          <h2 className="font-heading text-sm text-muted-foreground">
            NASDAQ · S&amp;P 500 · Top 10 crypto
          </h2>
          <QuotesStrip quotes={quotes} />
        </section>
        <section className="space-y-2">
          <h2 className="font-heading text-sm text-muted-foreground">
            Briefings
          </h2>
          <BriefingPanel briefings={briefings} />
        </section>
        <section className="space-y-2">
          <h2 className="font-heading text-sm text-muted-foreground">
            News — United States and world
          </h2>
          <NewsBoard news={news} />
        </section>
      </div>
    </AppShell>
  )
}
