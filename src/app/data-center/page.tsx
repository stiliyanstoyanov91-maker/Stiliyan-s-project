import { AppShell } from "@/components/app-shell"
import { EconomicCalendar } from "@/components/economic-calendar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchCalendarEvents } from "@/lib/queries"

export const dynamic = "force-dynamic"

export default async function DataCenterPage() {
  const from = new Date()
  from.setHours(0, 0, 0, 0)
  let events = []
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
    <AppShell title="Data Center">
      <div className="mx-auto max-w-6xl space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Economic calendar only — day, week, or month. Filter by crypto,
            fuels, traditional markets, or stocks. Past days are not stored.
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
