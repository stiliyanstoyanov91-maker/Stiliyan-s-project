import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Briefing } from "@/lib/types"

function BriefingBody({ body }: { body: string }) {
  const lines = body.split("\n").filter((line) => line.trim().length > 0)
  return (
    <ul className="space-y-2 text-sm leading-relaxed">
      {lines.map((line) => (
        <li key={line} className="flex gap-2">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
          <span>{line.replace(/^[-*]\s*/, "")}</span>
        </li>
      ))}
    </ul>
  )
}

export function BriefingPanel({ briefings }: { briefings: Briefing[] }) {
  const daily = briefings.find((b) => b.kind === "daily")
  const weekly = briefings.find((b) => b.kind === "weekly")

  if (!daily && !weekly) {
    return (
      <Alert>
        <AlertTitle>No briefing yet</AlertTitle>
        <AlertDescription>
          The ingest job writes a daily briefing on every weekday run, and a
          weekly wrap on Monday mornings (Sofia). Check back after the next
          refresh.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {daily ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">Daily</Badge>
              <CardTitle>{daily.headline}</CardTitle>
            </div>
            <CardDescription>
              Ready 30 minutes before the NASDAQ cash open.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BriefingBody body={daily.body} />
          </CardContent>
        </Card>
      ) : null}
      {weekly ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Weekly</Badge>
              <CardTitle>{weekly.headline}</CardTitle>
            </div>
            <CardDescription>
              Monday-only wrap of the week ahead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BriefingBody body={weekly.body} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
