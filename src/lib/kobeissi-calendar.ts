import { sofiaDayKey, zoneWallClock } from "@/lib/market-hours"
import type { CalendarEvent } from "@/lib/types"

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export type DecoratedCalendarEvent = CalendarEvent & {
  sofia_day: string
  sofia_clock: string
  when_label: string
}

export function decorateCalendarEvent(event: CalendarEvent): DecoratedCalendarEvent {
  const wall = zoneWallClock(new Date(event.starts_at), "Europe/Sofia")
  const clock = `${String(wall.hour).padStart(2, "0")}:${String(wall.minute).padStart(2, "0")}`
  const month = MONTHS_SHORT[wall.month - 1]
  return {
    ...event,
    sofia_day: `${wall.year}-${String(wall.month).padStart(2, "0")}-${String(wall.day).padStart(2, "0")}`,
    sofia_clock: clock,
    when_label: event.is_holiday
      ? `${wall.weekday} ${wall.day} ${month}`
      : `${wall.weekday} ${wall.day} ${month} ${wall.year} · ${clock}`,
  }
}

/** Test overlay from the public Kobeissi Letter "Key Events This Week" list. */
export const KOBEISSI_TEST_EVENTS: CalendarEvent[] = [
  {
    id: "kobeissi-2026-09-07-labor",
    title: "US markets closed — Labor Day",
    starts_at: "2026-09-07T00:00:00+03:00",
    category: "traditional_markets",
    region: "us",
    is_holiday: true,
    impact: "high",
    source: "Kobeissi Letter",
  },
  {
    id: "kobeissi-2026-09-09-10y",
    title: "US 10Y note auction",
    starts_at: "2026-09-09T20:00:00+03:00",
    category: "traditional_markets",
    region: "us",
    is_holiday: false,
    impact: "medium",
    source: "Kobeissi Letter",
  },
  {
    id: "kobeissi-2026-09-10-ppi",
    title: "August PPI inflation",
    starts_at: "2026-09-10T15:30:00+03:00",
    category: "traditional_markets",
    region: "us",
    is_holiday: false,
    impact: "high",
    source: "Kobeissi Letter",
  },
  {
    id: "kobeissi-2026-09-10-homes",
    title: "August existing home sales",
    starts_at: "2026-09-10T17:00:00+03:00",
    category: "traditional_markets",
    region: "us",
    is_holiday: false,
    impact: "medium",
    source: "Kobeissi Letter",
  },
  {
    id: "kobeissi-2026-09-11-cpi",
    title: "August CPI inflation",
    starts_at: "2026-09-11T15:30:00+03:00",
    category: "traditional_markets",
    region: "us",
    is_holiday: false,
    impact: "high",
    source: "Kobeissi Letter",
  },
  {
    id: "kobeissi-2026-09-11-mi-inf",
    title: "September MI inflation expectations",
    starts_at: "2026-09-11T17:00:00+03:00",
    category: "traditional_markets",
    region: "us",
    is_holiday: false,
    impact: "medium",
    source: "Kobeissi Letter",
  },
  {
    id: "kobeissi-2026-09-11-mi-sent",
    title: "September MI consumer sentiment",
    starts_at: "2026-09-11T17:05:00+03:00",
    category: "traditional_markets",
    region: "us",
    is_holiday: false,
    impact: "medium",
    source: "Kobeissi Letter",
  },
]

function tokens(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function isDuplicate(existing: CalendarEvent, incoming: CalendarEvent) {
  if (sofiaDayKey(new Date(existing.starts_at)) !== sofiaDayKey(new Date(incoming.starts_at))) {
    return false
  }
  const a = tokens(existing.title)
  const b = tokens(incoming.title)
  if (a.includes("labor") && b.includes("labor")) return true
  if (a.includes("ppi") && b.includes("ppi")) return true
  if (a.includes("cpi") && b.includes("cpi")) return true
  if (a.includes("home") && b.includes("home")) return true
  if (a.includes("sentiment") && b.includes("sentiment")) return true
  if (a.includes("10y") && b.includes("10y")) return true
  if (a.includes("10 y") && b.includes("10y")) return true
  return a === b
}

export function mergeKobeissiTestEvents(events: CalendarEvent[]): CalendarEvent[] {
  const extra = KOBEISSI_TEST_EVENTS.filter(
    (item) => !events.some((event) => isDuplicate(event, item))
  )
  return [...events, ...extra].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  )
}

export function prepareCalendarEvents(events: CalendarEvent[]): DecoratedCalendarEvent[] {
  return mergeKobeissiTestEvents(events).map(decorateCalendarEvent)
}

export function isKobeissiEvent(event: CalendarEvent) {
  return event.source.toLowerCase().includes("kobeissi")
}
