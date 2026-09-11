"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type {
  CalendarView,
  ImpactLevel,
  NewsRegion,
} from "@/lib/types"
import { categoryLabel } from "@/lib/queries"
import {
  isKobeissiEvent,
  type DecoratedCalendarEvent,
} from "@/lib/kobeissi-calendar"
import { cn } from "@/lib/utils"

const regionLabel: Record<NewsRegion, string> = {
  us: "US",
  world: "World",
}

const impactLabel: Record<ImpactLevel, string> = {
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
}

function civilDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]
const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

function impactDot(event: DecoratedCalendarEvent) {
  if (event.is_holiday) return "bg-destructive"
  if (event.impact === "high") return "bg-primary"
  if (event.impact === "medium") return "bg-sky-400"
  return "bg-muted-foreground/50"
}

function CalendarEventChip({ event }: { event: DecoratedCalendarEvent }) {
  const kobeissi = isKobeissiEvent(event)
  const hint = [
    event.title,
    event.is_holiday ? "Market holiday" : `${event.when_label} Sofia`,
    `${categoryLabel[event.category]} · ${regionLabel[event.region]} · ${impactLabel[event.impact]}`,
    event.source ? `Source: ${event.source}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div
      title={hint}
      className="flex w-full min-w-0 items-center gap-1.5 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-white/6"
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", impactDot(event))} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] leading-tight">{event.title}</p>
        <p className="text-[10px] text-muted-foreground">
          {event.is_holiday ? "Holiday" : `${event.sofia_clock} Sofia`}
        </p>
      </div>
      {kobeissi ? (
        <span className="shrink-0 rounded bg-primary/15 px-1 text-[9px] font-medium tracking-wide text-primary">
          KL
        </span>
      ) : null}
    </div>
  )
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - day)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function sameCivilDay(a: Date, b: Date) {
  return civilDayKey(a) === civilDayKey(b)
}

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function EconomicCalendar({
  events,
  todayKey,
}: {
  events: DecoratedCalendarEvent[]
  todayKey: string
}) {
  const today = useMemo(() => {
    const [y, m, d] = todayKey.split("-").map(Number)
    return new Date(y, m - 1, d)
  }, [todayKey])
  const [cursor, setCursor] = useState(today)
  const [view, setView] = useState<CalendarView>("month")

  const filtered = events

  const days = useMemo(() => {
    if (view === "day") return [cursor]
    if (view === "week") {
      const start = startOfWeek(cursor)
      return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const gridStart = startOfWeek(monthStart)
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  }, [cursor, view])

  const title =
    view === "day"
      ? `${WEEKDAYS_LONG[cursor.getDay()]} ${cursor.getDate()} ${MONTHS_LONG[cursor.getMonth()]} ${cursor.getFullYear()}`
      : view === "week"
        ? `Week of ${startOfWeek(cursor).getDate()} ${MONTHS_LONG[startOfWeek(cursor).getMonth()]} ${startOfWeek(cursor).getFullYear()}`
        : `${MONTHS_LONG[cursor.getMonth()]} ${cursor.getFullYear()}`

  function shift(dir: number) {
    setCursor((prev) => {
      if (view === "day") return addDays(prev, dir)
      if (view === "week") return addDays(prev, dir * 7)
      return new Date(prev.getFullYear(), prev.getMonth() + dir, 1)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => shift(-1)}
          >
            <ChevronLeft />
          </Button>
          <h2 className="min-w-40 font-heading text-xl tracking-tight">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => shift(1)}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-full text-xs"
            onClick={() => setCursor(today)}
          >
            Today
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-secondary/80 p-1 ring-1 ring-white/8">
            {(["month", "week", "day"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                  view === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {key === "month" ? "Monthly" : key === "week" ? "Weekly" : "Daily"}
              </button>
            ))}
          </div>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/10">
            Macro
          </span>
        </div>
      </div>

      {view !== "day" ? (
        <div className="grid grid-cols-7 px-1 text-[11px] tracking-wide text-muted-foreground uppercase">
          {weekdayLabels.map((label) => (
            <div key={label} className="px-2 py-1">
              {label}
            </div>
          ))}
        </div>
      ) : null}

      <div
        className={
          view === "day"
            ? "grid grid-cols-1"
            : "grid grid-cols-7 gap-1.5"
        }
      >
        {days.map((day) => {
          const inMonth = day.getMonth() === cursor.getMonth()
          const dayKey = civilDayKey(day)
          const dayEvents = filtered
            .filter((event) => event.sofia_day === dayKey)
            .slice(0, view === "month" ? 4 : 12)
          const holiday = dayEvents.find((event) => event.is_holiday)
          const isToday = sameCivilDay(day, today)
          const extra =
            filtered.filter((event) => event.sofia_day === dayKey).length -
            dayEvents.length
          return (
            <div
              key={dayKey}
              className={cn(
                "min-h-28 rounded-2xl border border-white/6 bg-card/55 p-2.5",
                view === "month" && !inMonth && "opacity-35",
                view === "day" && "min-h-64",
                holiday && "border-destructive/30 bg-destructive/8",
                isToday && "border-primary/50 shadow-[inset_3px_0_0_0_var(--primary)]"
              )}
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "text-sm tabular-nums",
                    isToday && "font-semibold text-primary"
                  )}
                >
                  {day.getDate()}
                </span>
                {holiday ? (
                  <span className="text-[10px] text-destructive">Closed</span>
                ) : null}
              </div>
              <div className="space-y-0.5">
                {dayEvents.map((event) => (
                  <CalendarEventChip key={event.id} event={event} />
                ))}
                {extra > 0 ? (
                  <p className="px-1 text-[10px] text-muted-foreground">
                    +{extra} more
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {!filtered.length ? (
        <Alert>
          <AlertTitle>No events in this range</AlertTitle>
          <AlertDescription>
            Calendar rows are today-and-forward only. Jump to a later week.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" /> High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-sky-400" /> Medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-destructive" /> Holiday
          </span>
          <span className="flex items-center gap-1.5">
            <span className="rounded bg-primary/15 px-1 text-[9px] text-primary">
              KL
            </span>
            Kobeissi Letter
          </span>
        </div>
      )}
    </div>
  )
}
