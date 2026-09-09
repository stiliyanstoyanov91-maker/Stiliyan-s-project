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
  const [status, setStatus] = useState<MarketStatus | null>(null)

  useEffect(() => {
    const tick = () => setStatus(getMarketStatus())
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])

  const closedForHoliday = Boolean(holidayName)
  const session = closedForHoliday ? "closed" : (status?.session ?? "closed")

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
          {closedForHoliday
            ? "Holiday"
            : status
              ? sessionLabel(status.session)
              : "—"}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-1 space-y-1 text-muted-foreground">
        <p>
          {status ? (
            <>
              Sofia {status.sofiaNow} · New York {status.nyNow}. Regular session{" "}
              <span className="text-foreground">
                {status.regularOpenSofia}–{status.regularCloseSofia}
              </span>{" "}
              Sofia ({status.offsetHours}h offset).
            </>
          ) : (
            <span className="inline-block h-4 w-[min(100%,32rem)] rounded bg-muted/70" />
          )}
        </p>
        <p>
          Daily briefing target:{" "}
          <span className="text-foreground">
            {status?.briefingReadySofia ?? "15:00"}
          </span>{" "}
          Sofia — day so far and what is still ahead into the cash close.
        </p>
        {closedForHoliday ? (
          <p className="text-destructive">
            US cash markets are closed today ({holidayName}).
          </p>
        ) : null}
        {status?.mismatchNote ? <p>{status.mismatchNote}</p> : null}
      </AlertDescription>
    </Alert>
  )
}
