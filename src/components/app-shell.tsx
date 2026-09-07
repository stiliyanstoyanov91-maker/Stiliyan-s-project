"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Home } from "lucide-react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
] as const

function isActive(pathname: string, href: (typeof tabs)[number]["href"]) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

const headerZones = [
  { tz: "Europe/Sofia", label: "Sofia" },
  { tz: "America/New_York", label: "New York" },
  { tz: "Europe/London", label: "London" },
  { tz: "Europe/Madrid", label: "Madrid" },
  { tz: "Asia/Tokyo", label: "Tokyo" },
] as const

function formatZoneTime(now: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now)
}

function HeaderClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="relative hidden size-1.5 shrink-0 sm:flex">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/70 opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
      </span>
      <div className="flex items-center gap-2 sm:gap-2.5">
        {headerZones.map((zone, index) => (
          <div key={zone.tz} className="flex items-center gap-2 sm:gap-2.5">
            {index > 0 ? (
              <span className="h-5 w-px bg-white/10" aria-hidden />
            ) : null}
            <div className="text-center leading-tight">
              <p className="font-mono text-[11px] tabular-nums text-foreground sm:text-xs">
                {formatZoneTime(now, zone.tz)}
              </p>
              <p className="text-[9px] tracking-wide text-muted-foreground uppercase sm:text-[10px]">
                {zone.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <div className="relative min-h-full">
        <header className="sticky top-0 z-40 border-b border-white/6 bg-background/75 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2.5 md:px-6">
            <Link href="/" className="flex min-w-0 items-center gap-2.5 justify-self-start">
              <span className="relative flex size-9 shrink-0 items-center justify-center">
                <span className="absolute inset-0 rounded-xl bg-primary/35 blur-md" />
                <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffb15a] via-primary to-[#c94a00] font-heading text-[11px] font-bold tracking-tight text-primary-foreground shadow-[0_8px_24px_-10px_rgba(255,122,26,0.9)]">
                  MB
                </span>
              </span>
              <span className="hidden min-w-0 sm:flex sm:flex-col">
                <span className="text-sm font-semibold tracking-wide">
                  Market Brief
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Futures desk feed
                </span>
              </span>
            </Link>

            <div className="flex flex-col items-center gap-1.5">
              <nav
                aria-label="Primary"
                className="grid grid-cols-2 rounded-full bg-secondary/80 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-white/8"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const active = isActive(pathname, tab.href)
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all sm:px-5",
                        active
                          ? "bg-primary text-primary-foreground shadow-[0_0_28px_-6px_var(--primary)]"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                      {tab.label}
                    </Link>
                  )
                })}
              </nav>
              <HeaderClock />
            </div>

            <div aria-hidden className="justify-self-end" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </TooltipProvider>
  )
}
