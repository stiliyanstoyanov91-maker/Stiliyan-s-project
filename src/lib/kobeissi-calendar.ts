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

export function prepareCalendarEvents(events: CalendarEvent[]): DecoratedCalendarEvent[] {
  const merged: CalendarEvent[] = []
  for (const event of events) {
    const hit = merged.find((row) => isDuplicate(row, event))
    if (!hit) {
      merged.push({ ...event })
      continue
    }
    if (isKobeissiEvent(event) && !isKobeissiEvent(hit)) {
      hit.source = event.source
    }
  }
  return merged
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    )
    .map(decorateCalendarEvent)
}

export function isKobeissiEvent(event: CalendarEvent) {
  return event.source.toLowerCase().includes("kobeissi")
}
