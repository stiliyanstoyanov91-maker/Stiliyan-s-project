import { AppShell } from "@/components/app-shell"
import { EconomicCalendar } from "@/components/economic-calendar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchCalendarEvents } from "@/lib/queries"
import {
  prepareCalendarEvents,
  type DecoratedCalendarEvent,
} from "@/lib/kobeissi-calendar"
import { sofiaDayKey } from "@/lib/market-hours"
import { publicErrorMessage } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default async function CalendarPage() {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  let events: DecoratedCalendarEvent[] = []
  let error: string | null = null
  const todayKey = sofiaDayKey()

  try {
    events = prepareCalendarEvents(
      await fetchCalendarEvents(
        from.toISOString(),
        "2027-01-01T00:00:00.000Z"
      )
    )
  } catch (err) {
    console.error("Calendar feed failed", err)
    error = publicErrorMessage(err, "Could not load the calendar.")
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="font-heading text-lg font-semibold tracking-tight">
            Economic calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Desk calendar in Sofia time. Key week events refresh each Monday.
            Past days are not stored.
          </p>
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Calendar unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <EconomicCalendar events={events} todayKey={todayKey} />
        )}
      </div>
    </AppShell>
  )
}
