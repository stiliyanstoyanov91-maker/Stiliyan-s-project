"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Globe } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type {
  CalendarEvent,
  CalendarView,
  EventCategory,
  ImpactLevel,
  NewsRegion,
} from "@/lib/types"
import { categoryLabel } from "@/lib/queries"
import { formatSofiaTime, sofiaDayKey } from "@/lib/market-hours"

const regionLabel: Record<NewsRegion, string> = {
  us: "US",
  world: "World",
}

const impactLabel: Record<ImpactLevel, string> = {
  high: "High impact",
  medium: "Medium impact",
  low: "Low impact",
}

function formatEventWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Sofia",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso))
}

function CalendarEventChip({ event }: { event: CalendarEvent }) {
  return (
    <Tooltip>
      <TooltipTrigger className="flex w-full min-w-0 items-start gap-1.5 overflow-hidden rounded-md bg-muted/40 px-1.5 py-1 text-left hover:bg-muted">
        <span className="mt-0.5 h-3 w-0.5 shrink-0 rounded-full bg-sky-400" />
        <Globe className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-[11px] leading-tight">{event.title}</p>
          <p className="text-[10px] text-muted-foreground">
            {event.is_holiday
              ? "Holiday"
              : `${formatSofiaTime(event.starts_at)} Sofia`}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-72">
        <div className="flex min-w-44 flex-col gap-1 py-0.5">
          <p className="text-sm font-medium leading-snug whitespace-normal">
            {event.title}
          </p>
          <p className="text-xs opacity-70">
            {event.is_holiday
              ? "Market holiday"
              : `${formatEventWhen(event.starts_at)} Sofia`}
          </p>
          <p className="text-xs opacity-80">
            {categoryLabel[event.category]} · {regionLabel[event.region]} ·{" "}
            {impactLabel[event.impact]}
          </p>
          {event.source ? (
            <p className="text-[11px] opacity-70">Source: {event.source}</p>
          ) : null}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

type TypeFilter = "all" | EventCategory

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

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function eventDay(event: CalendarEvent) {
  return new Date(event.starts_at)
}

export function EconomicCalendar({ events }: { events: CalendarEvent[] }) {
  const today = useMemo(() => {
    const [y, m, d] = sofiaDayKey().split("-").map(Number)
    return new Date(y, m - 1, d)
  }, [])
  const [cursor, setCursor] = useState(today)
  const [view, setView] = useState<CalendarView>("month")
  const [type, setType] = useState<TypeFilter>("all")

  const filtered = useMemo(() => {
    return events.filter((event) =>
      type === "all" ? true : event.category === type
    )
  }, [events, type])

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
      ? cursor.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : view === "week"
        ? `Week of ${startOfWeek(cursor).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}`
        : cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  function shift(dir: number) {
    setCursor((prev) => {
      if (view === "day") return addDays(prev, dir)
      if (view === "week") return addDays(prev, dir * 7)
      return new Date(prev.getFullYear(), prev.getMonth() + dir, 1)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-1)}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)}>
            <ChevronRight />
          </Button>
          <h2 className="font-heading text-lg">{title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={view}
            onValueChange={(value) => {
              if (value) setView(value as CalendarView)
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={type}
            onValueChange={(value) => {
              if (value) setType(value as TypeFilter)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Type: all</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="fuels">Fuels</SelectItem>
              <SelectItem value="traditional_markets">
                Traditional markets
              </SelectItem>
              <SelectItem value="stocks">Stocks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {view !== "day" ? (
        <div className="grid grid-cols-7 text-xs text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
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
            : "grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-border"
        }
      >
        {days.map((day) => {
          const inMonth = day.getMonth() === cursor.getMonth()
          const dayEvents = filtered
            .filter((event) => sameDay(eventDay(event), day))
            .slice(0, view === "month" ? 4 : 12)
          const holiday = dayEvents.find((event) => event.is_holiday)
          const isToday = sameDay(day, today)
          return (
            <Card
              key={day.toISOString()}
              size="sm"
              className={`min-h-28 rounded-none border-0 ring-0 ${
                view === "month" && !inMonth ? "opacity-40" : ""
              } ${view === "day" ? "min-h-64 rounded-xl ring-1 ring-foreground/10" : ""}`}
            >
              <CardContent className="space-y-1.5">
                <div className="flex items-center justify-end">
                  <span
                    className={`flex size-7 items-center justify-center text-xs ${
                      holiday
                        ? "rounded-full bg-destructive text-white"
                        : isToday
                          ? "rounded-full bg-primary text-primary-foreground"
                          : ""
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <CalendarEventChip key={event.id} event={event} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!filtered.length ? (
        <Alert>
          <AlertTitle>No events in this filter</AlertTitle>
          <AlertDescription>
            Calendar rows are today-and-forward only. Try another type or jump
            to a later week.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {(Object.keys(categoryLabel) as EventCategory[]).map((key) => (
            <Badge key={key} variant="outline">
              {categoryLabel[key]}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
