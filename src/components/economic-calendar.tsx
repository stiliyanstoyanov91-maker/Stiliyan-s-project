"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { zoneWallClock } from "@/lib/market-hours"
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

function formatZoneStamp(iso: string, timeZone: string) {
  const wall = zoneWallClock(new Date(iso), timeZone)
  const clock = `${String(wall.hour).padStart(2, "0")}:${String(wall.minute).padStart(2, "0")}`
  return {
    clock,
    date: `${wall.weekday} ${wall.day} ${MONTHS_SHORT[wall.month - 1]} ${wall.year}`,
  }
}

function CalendarEventChip({
  event,
  onSelect,
}: {
  event: DecoratedCalendarEvent
  onSelect: () => void
}) {
  const kobeissi = isKobeissiEvent(event)

  return (
    <button
      type="button"
      onClick={(click) => {
        click.stopPropagation()
        onSelect()
      }}
      className="flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-muted"
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
    </button>
  )
}

function EventDetailCard({
  event,
  highlighted,
  onFocus,
}: {
  event: DecoratedCalendarEvent
  highlighted: boolean
  onFocus: () => void
}) {
  const sofia = formatZoneStamp(event.starts_at, "Europe/Sofia")
  const ny = formatZoneStamp(event.starts_at, "America/New_York")
  const kobeissi = isKobeissiEvent(event)

  return (
    <button
      type="button"
      onClick={onFocus}
      className={cn(
        "w-full rounded-xl border bg-card p-3 text-left transition-colors",
        highlighted
          ? "border-primary/60 ring-1 ring-primary/40"
          : "border-border hover:bg-muted/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={cn("mt-1.5 size-2 shrink-0 rounded-full", impactDot(event))}
          />
          <div className="min-w-0">
            <p className="font-heading text-sm font-medium leading-snug">
              {event.title}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {event.is_holiday
                ? "US cash markets closed"
                : event.impact === "high"
                  ? "Likely to move NASDAQ / S&P into the cash session"
                  : "Scheduled print"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {event.is_holiday ? (
            <Badge variant="destructive">Holiday</Badge>
          ) : (
            <Badge variant="outline">{impactLabel[event.impact]}</Badge>
          )}
          {kobeissi ? (
            <Badge variant="outline" className="text-primary">
              KL
            </Badge>
          ) : null}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
        <div>
          <dt className="text-[10px] tracking-wide text-muted-foreground uppercase">
            Sofia
          </dt>
          <dd className="tabular-nums">
            {event.is_holiday ? sofia.date : `${sofia.date} · ${sofia.clock}`}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-wide text-muted-foreground uppercase">
            New York
          </dt>
          <dd className="tabular-nums">
            {event.is_holiday ? ny.date : `${ny.date} · ${ny.clock}`}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-wide text-muted-foreground uppercase">
            Category
          </dt>
          <dd>{categoryLabel[event.category]}</dd>
        </div>
        <div>
          <dt className="text-[10px] tracking-wide text-muted-foreground uppercase">
            Region
          </dt>
          <dd>{regionLabel[event.region]}</dd>
        </div>
        {event.source ? (
          <div className="col-span-2">
            <dt className="text-[10px] tracking-wide text-muted-foreground uppercase">
              Source
            </dt>
            <dd>{event.source}</dd>
          </div>
        ) : null}
      </dl>
    </button>
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

function dayHeading(date: Date) {
  return `${WEEKDAYS_LONG[date.getDay()]} ${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`
}

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

type EventDialogState = {
  dayLabel: string
  events: DecoratedCalendarEvent[]
  focusedId: string | null
}

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
  const [dialog, setDialog] = useState<EventDialogState | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

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
      ? dayHeading(cursor)
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

  function openEvents(
    dayEvents: DecoratedCalendarEvent[],
    day: Date,
    focusedId: string | null = null
  ) {
    if (!dayEvents.length) return
    setDialog({
      dayLabel: dayHeading(day),
      events: dayEvents,
      focusedId,
    })
    setDialogOpen(true)
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
          <div className="flex rounded-full bg-secondary/80 p-1 ring-1 ring-border">
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
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium ring-1 ring-border">
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
          const allDayEvents = filtered.filter(
            (event) => event.sofia_day === dayKey
          )
          const dayEvents = allDayEvents.slice(0, view === "month" ? 4 : 12)
          const holiday = allDayEvents.find((event) => event.is_holiday)
          const isToday = sameCivilDay(day, today)
          const extra = allDayEvents.length - dayEvents.length
          const hasEvents = allDayEvents.length > 0
          return (
            <div
              key={dayKey}
              onClick={() => openEvents(allDayEvents, day)}
              className={cn(
                "min-h-28 rounded-2xl border border-border bg-card/55 p-2.5",
                hasEvents && "cursor-pointer hover:bg-muted/40",
                view === "month" && !inMonth && "opacity-35",
                view === "day" && "min-h-64",
                holiday && "border-destructive/30 bg-destructive/8",
                isToday && "border-primary/50 shadow-[inset_3px_0_0_0_var(--primary)]"
              )}
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <button
                  type="button"
                  disabled={!hasEvents}
                  onClick={(click) => {
                    click.stopPropagation()
                    openEvents(allDayEvents, day)
                  }}
                  className={cn(
                    "text-sm tabular-nums",
                    hasEvents && "hover:text-primary",
                    !hasEvents && "cursor-default",
                    isToday && "font-semibold text-primary"
                  )}
                >
                  {day.getDate()}
                </button>
                {holiday ? (
                  <span className="text-[10px] text-destructive">Closed</span>
                ) : null}
              </div>
              <div className="space-y-0.5">
                {dayEvents.map((event) => (
                  <CalendarEventChip
                    key={event.id}
                    event={event}
                    onSelect={() => openEvents(allDayEvents, day, event.id)}
                  />
                ))}
                {extra > 0 ? (
                  <button
                    type="button"
                    className="px-1 text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={(click) => {
                      click.stopPropagation()
                      openEvents(allDayEvents, day)
                    }}
                  >
                    +{extra} more
                  </button>
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

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent className="max-h-[min(36rem,calc(100vh-2rem))] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {dialog?.events.length === 1
                ? dialog.events[0].title
                : dialog?.dayLabel ?? "Calendar events"}
            </DialogTitle>
            <DialogDescription>
              {dialog
                ? dialog.events.length === 1
                  ? dialog.dayLabel
                  : `${dialog.events.length} events · Sofia time`
                : "Event details"}
            </DialogDescription>
          </DialogHeader>
          {dialog ? (
            <div className="max-h-[min(26rem,calc(100vh-10rem))] space-y-2 overflow-y-auto pr-1">
                {dialog.events.map((event) => (
                  <EventDetailCard
                    key={event.id}
                    event={event}
                    highlighted={
                      dialog.events.length > 1 && dialog.focusedId === event.id
                    }
                    onFocus={() =>
                      setDialog((current) =>
                        current
                          ? { ...current, focusedId: event.id }
                          : current
                      )
                    }
                  />
                ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
