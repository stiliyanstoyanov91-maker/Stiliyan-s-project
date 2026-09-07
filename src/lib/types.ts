export type NewsRegion = "us" | "world"
export type NewsSentiment = "positive" | "negative" | "neutral"
export type NewsOrigin = "rss" | "x"
export type EventCategory =
  | "crypto"
  | "fuels"
  | "traditional_markets"
  | "stocks"
export type ImpactLevel = "high" | "medium" | "low"
export type AssetClass = "crypto" | "index"
export type BriefingKind = "daily" | "weekly"
export type CalendarView = "day" | "week" | "month"

export type NewsItem = {
  id: string
  title: string
  summary: string
  source: string
  url: string
  published_at: string
  region: NewsRegion
  sentiment: NewsSentiment
  category: EventCategory | null
  origin: NewsOrigin
}

export type CalendarEvent = {
  id: string
  title: string
  starts_at: string
  category: EventCategory
  region: NewsRegion
  is_holiday: boolean
  impact: ImpactLevel
  source: string
}

export type MarketQuote = {
  symbol: string
  name: string
  price: number
  change_pct: number
  asset_class: AssetClass
  updated_at: string
}

export type Briefing = {
  id: string
  briefing_date: string
  kind: BriefingKind
  headline: string
  body: string
  updated_at: string
}
