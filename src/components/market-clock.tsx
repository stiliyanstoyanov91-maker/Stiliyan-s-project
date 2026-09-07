"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  getMarketStatus,
  sessionLabel,
  type MarketStatus,
} from "@/lib/market-hours"

export function MarketClock({ holidayName }: { holidayName?: string | null }) {
  const [status, setStatus] = useState<MarketStatus>(() => getMarketStatus())

  useEffect(() => {
    const id = window.setInterval(() => setStatus(getMarketStatus()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const closedForHoliday = Boolean(holidayName)
  const session = closedForHoliday ? "closed" : status.session

  return (
    <Alert className="border-primary/20 bg-card">
      <Clock />
      <AlertTitle className="flex flex-wrap items-center gap-2">
        NASDAQ cash hours
        <Badge
          variant={session === "regular" ? "default" : "outline"}
          className={
            session === "regular"
              ? "bg-primary text-primary-foreground"
              : undefined
          }
        >
          {closedForHoliday ? "Holiday" : sessionLabel(session)}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-1 space-y-1 text-muted-foreground">
        <p>
          Sofia {status.sofiaNow} · New York {status.nyNow}. Regular session{" "}
          <span className="text-foreground">
            {status.regularOpenSofia}–{status.regularCloseSofia}
          </span>{" "}
          Sofia ({status.offsetHours}h offset).
        </p>
        <p>
          Daily briefing target:{" "}
          <span className="text-foreground">{status.briefingReadySofia}</span>{" "}
          Sofia — 30 minutes before the cash open.
        </p>
        {closedForHoliday ? (
          <p className="text-destructive">
            US cash markets are closed today ({holidayName}).
          </p>
        ) : null}
        {status.mismatchNote ? <p>{status.mismatchNote}</p> : null}
      </AlertDescription>
    </Alert>
  )
}
