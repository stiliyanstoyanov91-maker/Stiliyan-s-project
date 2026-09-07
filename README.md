# Market Brief

Weekday futures briefing for the NASDAQ cash open. English UI. Next.js 16 + shadcn/ui only, fed by a Supabase project that stores **today and future** data.

## What it shows

- **Home** — Sofia/New York session clock (15:30 vs 16:30 when DST gaps), S&P 500 + NASDAQ + top 10 crypto, daily briefing (weekly on Monday), news split United States / World / All and Positive / Negative.
- **Data Center** — economic calendar with Monthly / Weekly / Daily views and type filter (crypto, fuels, traditional markets, stocks). US market holidays are circled in red.

Briefings are aimed at **30 minutes before the cash open** in Sofia time.

## Run locally

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

App: http://127.0.0.1:43123

This repo is already wired to the `market-briefing` Supabase project in org **my project** (`eu-central-1`).

## Data

| Table | Purpose |
| --- | --- |
| `news` | RSS + X headlines (`origin` = rss \| x) |
| `calendar_events` | FOMC, CPI/NFP/PPI, EIA inventories, holidays |
| `market_quotes` | indices + top crypto |
| `briefings` | daily + Monday weekly |
| `ingest_runs` | ops log (not public) |

RLS: `anon` can **SELECT** news, calendar, quotes, briefings. Writes go through the Edge Function service role.

## Ingest

**Edge Function** `ingest-markets` — every 2 hours Monday–Friday (`pg_cron` `0 */2 * * 1-5` UTC):

- Reuters, CNBC, MarketWatch, Yahoo Finance, Federal Reserve, ZeroHedge RSS
- CoinGecko top 10 + Yahoo `^GSPC` / `^IXIC`
- Prune rows before the current Sofia day
- Rebuild today’s daily briefing (and the weekly briefing on Monday)

**X / Twitter** — no API keys. The connected Cursor X plugin is the source. A Cursor timer (`0 */2 * * 1-5`) should pull the watchlist into `news`. Official accounts (`@federalreserve`, `@Reuters`, `@business`, `@WSJmarkets`, `@CNBC`) are treated as primary; squawk handles are labeled with the handle.

## Market hours (Sofia)

Regular session is always 09:30–16:00 America/New_York.

- **16:30** Sofia when both zones are on DST or both off (7h).
- **15:30** Sofia only in the mismatch windows (6h): after the US springs forward and before EU DST, and after EU falls back until the US does.

## Honest limits

RSS lags paid terminals. Sentiment is keyword-based. The economic calendar is public-schedule (Fed, BLS-style prints, EIA, NYSE holidays), not a Bloomberg terminal dump.
