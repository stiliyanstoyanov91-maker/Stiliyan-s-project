"use client"

import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { NewsItem, NewsRegion, NewsSentiment } from "@/lib/types"
import { formatSofiaTime } from "@/lib/market-hours"

type RegionFilter = NewsRegion | "all"

function NewsColumn({
  title,
  items,
  tone,
}: {
  title: string
  items: NewsItem[]
  tone: NewsSentiment
}) {
  return (
    <Card className="min-h-80">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Badge
            variant={tone === "positive" ? "default" : "destructive"}
            className={
              tone === "positive"
                ? "bg-primary text-primary-foreground"
                : undefined
            }
          >
            {items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No {tone} headlines in this slice.
          </p>
        ) : (
          <ScrollArea className="h-[420px] pr-3">
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="space-y-1 border-b border-border/60 pb-3 last:border-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>@{item.source.replace(/^@/, "")}</span>
                    <span>·</span>
                    <span>{formatSofiaTime(item.published_at)} Sofia</span>
                    {item.origin === "x" ? (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        X
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        RSS
                      </Badge>
                    )}
                    <Badge variant="outline" className="h-4 px-1 uppercase text-[10px]">
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
  )
}

export function NewsBoard({ news }: { news: NewsItem[] }) {
  const [region, setRegion] = useState<RegionFilter>("all")

  const filtered = useMemo(() => {
    if (region === "all") return news
    return news.filter((item) => item.region === region)
  }, [news, region])

  const positive = filtered.filter((item) => item.sentiment === "positive")
  const negative = filtered.filter((item) => item.sentiment === "negative")

  if (!news.length) {
    return (
      <Alert>
        <AlertTitle>No headlines for today</AlertTitle>
        <AlertDescription>
          Past days are dropped on each ingest. When RSS and X land, they split
          into United States and World, then positive / negative.
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
      <div className="grid gap-4 lg:grid-cols-2">
        <NewsColumn title="Positive" items={positive} tone="positive" />
        <NewsColumn title="Negative" items={negative} tone="negative" />
      </div>
    </div>
  )
}
