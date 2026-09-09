export type SessionKind = "premarket" | "regular" | "afterhours" | "closed"

export type MarketStatus = {
  session: SessionKind
  sofiaNow: string
  nyNow: string
  regularOpenSofia: string
  regularCloseSofia: string
  briefingReadySofia: string
  offsetHours: number
  isDstMismatch: boolean
  mismatchNote: string | null
  isWeekend: boolean
}

const SOFIA = "Europe/Sofia"
const NY = "America/New_York"

function gmtOffsetMinutes(timeZone: string, date: Date): number {
  const name =
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
      hour: "numeric",
    })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT+00:00"
  const match = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  if (!match) return 0
  const sign = match[1] === "-" ? -1 : 1
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0))
}

function zonedParts(date: Date, timeZone: string) {
  const map = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )
  const hour = Number(map.hour) % 24
  return {
    weekday: map.weekday,
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
  }
}

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

/** Civil wall clock in a zone, without locale-sensitive hour tokens. */
export function zoneWallClock(date: Date, timeZone: string) {
  const offsetMin = gmtOffsetMinutes(timeZone, date)
  const local = new Date(date.getTime() + offsetMin * 60_000)
  return {
    weekday: WEEKDAYS_SHORT[local.getUTCDay()],
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    second: local.getUTCSeconds(),
  }
}

function formatHm(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hour = Math.floor(normalized / 60)
  const minute = normalized % 60
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function clockMinutes(hour: number, minute: number): number {
  return hour * 60 + minute
}

export function getMarketStatus(now = new Date()): MarketStatus {
  const sofiaOffset = gmtOffsetMinutes(SOFIA, now)
  const nyOffset = gmtOffsetMinutes(NY, now)
  const offsetHours = (sofiaOffset - nyOffset) / 60
  const isDstMismatch = offsetHours === 6

  const regularOpenMinutes = clockMinutes(9, 30) + (sofiaOffset - nyOffset)
  const regularCloseMinutes = clockMinutes(16, 0) + (sofiaOffset - nyOffset)
  const briefingReadyMinutes = clockMinutes(15, 0)

  const ny = zonedParts(now, NY)
  const nyMinutes = clockMinutes(ny.hour, ny.minute)
  const isWeekend = ny.weekday === "Sat" || ny.weekday === "Sun"

  let session: SessionKind = "closed"
  if (!isWeekend) {
    if (nyMinutes >= clockMinutes(4, 0) && nyMinutes < clockMinutes(9, 30)) {
      session = "premarket"
    } else if (
      nyMinutes >= clockMinutes(9, 30) &&
      nyMinutes < clockMinutes(16, 0)
    ) {
      session = "regular"
    } else if (
      nyMinutes >= clockMinutes(16, 0) &&
      nyMinutes < clockMinutes(20, 0)
    ) {
      session = "afterhours"
    }
  }

  const sofiaFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: SOFIA,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
  const nyFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: NY,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  })

  return {
    session,
    sofiaNow: sofiaFmt.format(now),
    nyNow: nyFmt.format(now),
    regularOpenSofia: formatHm(regularOpenMinutes),
    regularCloseSofia: formatHm(regularCloseMinutes),
    briefingReadySofia: formatHm(briefingReadyMinutes),
    offsetHours,
    isDstMismatch,
    mismatchNote: isDstMismatch
      ? "US still on daylight time while Bulgaria is on standard time — cash open is 15:30 Sofia until the US falls back."
      : null,
    isWeekend,
  }
}

export function sessionLabel(session: SessionKind): string {
  switch (session) {
    case "premarket":
      return "Pre-market"
    case "regular":
      return "Regular session"
    case "afterhours":
      return "After-hours"
    default:
      return "Cash session closed"
  }
}

export function formatSofiaTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SOFIA,
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso))
}

export function sofiaDayKey(date = new Date()): string {
  const parts = zonedParts(date, SOFIA)
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`
}

export function isSofiaMonday(date = new Date()): boolean {
  return zonedParts(date, SOFIA).weekday === "Mon"
}

export { zonedParts }
