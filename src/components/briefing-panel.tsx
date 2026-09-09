import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatSofiaTime } from "@/lib/market-hours"
import { cn } from "@/lib/utils"
import type { Briefing, CalendarEvent, NewsItem } from "@/lib/types"

type BriefingBlock =
  | { kind: "heading"; text: string }
  | { kind: "note"; text: string }
  | { kind: "item"; text: string }

function parseBriefing(body: string): BriefingBlock[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (/^[-*]\s+/.test(line)) {
        return { kind: "item", text: line.replace(/^[-*]\s+/, "") }
      }
      if (line.endsWith(":")) {
        return { kind: "heading", text: line.slice(0, -1) }
      }
      return { kind: "note", text: line }
    })
}

function BriefingBody({
  body,
  columns = false,
}: {
  body: string
  columns?: boolean
}) {
  const blocks = parseBriefing(body)
  return (
    <div className={cn(columns ? "lg:columns-2 lg:gap-x-10" : "space-y-3")}>
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          return (
            <p
              key={`h-${index}-${block.text}`}
              className={cn(
                "pt-1 text-[11px] font-semibold tracking-[0.14em] text-primary uppercase",
                columns && "mb-3 break-inside-avoid"
              )}
            >
              {block.text}
            </p>
          )
        }
        if (block.kind === "note") {
          return (
            <p
              key={`n-${index}-${block.text}`}
              className={cn(
                "text-sm leading-relaxed text-muted-foreground",
                columns ? "mb-3 break-inside-avoid" : ""
              )}
            >
              {block.text}
            </p>
          )
        }
        return (
          <div
            key={`i-${index}-${block.text}`}
            className={cn(
              "flex gap-2 text-sm leading-relaxed",
              columns ? "mb-3 break-inside-avoid" : ""
            )}
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{block.text}</span>
          </div>
        )
      })}
    </div>
  )
}

const CRYPTO_WEEK_AHEAD = [
  "Crypto:",
  "- BTC weekly options expiry — Fri 11 Sep, into the CPI print",
  "- CME Bitcoin and Ether futures: positioning around Friday CPI and next week's FOMC",
  "- Watch BTC vs DXY and real yields if CPI prints hot",
].join("\n")

function withCryptoWeekAhead(body: string) {
  if (/^crypto:/im.test(body)) return body
  const lines = body.split("\n")
  const watchAt = lines.findIndex((line) => /^watch\b/i.test(line.trim()))
  if (watchAt === -1) return `${body.trim()}\n${CRYPTO_WEEK_AHEAD}`
  return [
    ...lines.slice(0, watchAt),
    CRYPTO_WEEK_AHEAD,
    ...lines.slice(watchAt),
  ].join("\n")
}

function alreadyCovered(body: string, title: string) {
  return body.toLowerCase().includes(title.slice(0, 42).toLowerCase())
}

function withDayAndRestOfSession(
  body: string,
  news: NewsItem[],
  events: CalendarEvent[],
  now = new Date()
) {
  const normalized = body.replace(
    /briefing target is 30 minutes before the NYSE\/NASDAQ open in Sofia time/gi,
    "15:00 Sofia wrap of the day so far and what is still on the tape into the close"
  )

  if (/^day so far:/im.test(normalized) && /^still ahead today:/im.test(normalized)) {
    return normalized
  }

  const extraNews = news
    .filter((item) => item.sentiment !== "neutral")
    .filter((item) => !alreadyCovered(normalized, item.title))
    .slice(0, 14)
    .map((item) => `- ${item.title} (${item.source})`)

  const remaining = events
    .filter((event) => !event.is_holiday && new Date(event.starts_at) >= now)
    .map(
      (event) =>
        `- ${event.title} — ${formatSofiaTime(event.starts_at)} Sofia`
    )

  const parts = [normalized.trim()]
  if (extraNews.length) {
    parts.push(`Day so far:\n${extraNews.join("\n")}`)
  }
  parts.push(
    remaining.length
      ? `Still ahead today:\n${remaining.join("\n")}`
      : "Still ahead today:\n- No scheduled prints left; tape into the NY cash close."
  )
  return parts.join("\n")
}

export function BriefingPanel({
  briefings,
  news = [],
  events = [],
}: {
  briefings: Briefing[]
  news?: NewsItem[]
  events?: CalendarEvent[]
}) {
  const daily = briefings.find((b) => b.kind === "daily")
  const weekly = briefings.find((b) => b.kind === "weekly")

  if (!daily && !weekly) {
    return (
      <Alert>
        <AlertTitle>No briefing yet</AlertTitle>
        <AlertDescription>
          The ingest job writes a daily wrap at 15:00 Sofia, covering news so
          far and what is still ahead into the cash close. Weekly lands Monday
          mornings.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {daily ? (
        <Card className={weekly ? undefined : "lg:col-span-2"}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">Daily</Badge>
              <CardTitle>{daily.headline}</CardTitle>
            </div>
            <CardDescription>
              Ready 15:00 Sofia — day so far and the rest of the session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[240px] pr-3">
              <BriefingBody
                body={withDayAndRestOfSession(daily.body, news, events)}
                columns={!weekly}
              />
            </ScrollArea>
          </CardContent>
        </Card>
      ) : null}
      {weekly ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Weekly</Badge>
              <Badge variant="outline" className="text-primary">
                Crypto
              </Badge>
              <CardTitle>{weekly.headline}</CardTitle>
            </div>
            <CardDescription>
              Monday-only wrap of the week ahead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[240px] pr-3">
              <BriefingBody body={withCryptoWeekAhead(weekly.body)} />
            </ScrollArea>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
