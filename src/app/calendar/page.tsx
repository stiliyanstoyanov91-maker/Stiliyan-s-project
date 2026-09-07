import { AppShell } from "@/components/app-shell"
import { EconomicCalendar } from "@/components/economic-calendar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchCalendarEvents } from "@/lib/queries"
import type { CalendarEvent } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function CalendarPage() {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  let events: CalendarEvent[] = []
  let error: string | null = null

  try {
    events = await fetchCalendarEvents(
      from.toISOString(),
      "2027-01-01T00:00:00.000Z"
    )
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load the calendar."
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="font-heading text-lg font-semibold tracking-tight">
            Economic calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            Day, week, or month. Filter by crypto, fuels, traditional markets,
            or stocks. Past days are not stored.
          </p>
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Calendar unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <EconomicCalendar events={events} />
        )}
      </div>
    </AppShell>
  )
}
