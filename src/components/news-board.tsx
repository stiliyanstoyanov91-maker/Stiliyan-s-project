"use client"

import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { NewsItem, NewsRegion } from "@/lib/types"
import { formatSofiaTime } from "@/lib/market-hours"

type RegionFilter = NewsRegion | "all"

export function NewsBoard({ news }: { news: NewsItem[] }) {
  const [region, setRegion] = useState<RegionFilter>("all")

  const filtered = useMemo(() => {
    const items = region === "all" ? news : news.filter((item) => item.region === region)
    return [...items].sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    )
  }, [news, region])

  if (!news.length) {
    return (
      <Alert>
        <AlertTitle>No headlines for today</AlertTitle>
        <AlertDescription>
          Past days are dropped on each ingest. Fresh RSS and X headlines land
          here after the next update.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <Tabs
        value={region}
        onValueChange={(value) => setRegion(value as RegionFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="us">United States</TabsTrigger>
          <TabsTrigger value="world">World</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card>
        <CardContent className="pt-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No headlines in this slice yet.
            </p>
          ) : (
            <ScrollArea className="h-[640px] pr-3">
              <ul className="space-y-3">
                {filtered.map((item) => (
                  <li
                    key={item.id}
                    className="space-y-1 border-b border-border/60 pb-3 last:border-0"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>@{item.source.replace(/^@/, "")}</span>
                      <span>·</span>
                      <span>{formatSofiaTime(item.published_at)} Sofia</span>
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        {item.origin === "x" ? "X" : "RSS"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="h-4 px-1 uppercase text-[10px]"
                      >
                        {item.region}
                      </Badge>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm font-medium leading-snug hover:text-primary"
                    >
                      {item.title}
                    </a>
                    {item.summary ? (
                      <p className="line-clamp-3 text-xs text-muted-foreground">
                        {item.summary}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
