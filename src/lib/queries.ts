import { supabase } from "@/lib/supabase"
import { sofiaDayKey } from "@/lib/market-hours"
import type {
  Briefing,
  CalendarEvent,
  EventCategory,
  MarketQuote,
  NewsItem,
} from "@/lib/types"

export async function fetchQuotes(): Promise<MarketQuote[]> {
  const { data, error } = await supabase
    .from("market_quotes")
    .select("*")
    .order("asset_class", { ascending: false })
    .order("symbol")
  if (error) throw error
  return (data ?? []) as MarketQuote[]
}

export async function fetchNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(80)
  if (error) throw error
  return (data ?? []) as NewsItem[]
}

export async function fetchBriefings(): Promise<Briefing[]> {
  const today = sofiaDayKey()
  const { data, error } = await supabase
    .from("briefings")
    .select("*")
    .gte("briefing_date", today)
    .order("kind", { ascending: true })
  if (error) throw error
  return (data ?? []) as Briefing[]
}

export async function fetchCalendarEvents(fromIso: string, toIso: string) {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .gte("starts_at", fromIso)
    .lte("starts_at", toIso)
    .order("starts_at", { ascending: true })
  if (error) throw error
  return (data ?? []) as CalendarEvent[]
}

export async function fetchTodayHoliday(): Promise<CalendarEvent | null> {
  const today = sofiaDayKey()
  const start = `${today}T00:00:00+03:00`
  const end = `${today}T23:59:59+03:00`
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("is_holiday", true)
    .gte("starts_at", start)
    .lte("starts_at", end)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data as CalendarEvent | null) ?? null
}

export const categoryLabel: Record<EventCategory, string> = {
  crypto: "Crypto",
  fuels: "Fuels",
  traditional_markets: "Traditional markets",
  stocks: "Stocks",
}
