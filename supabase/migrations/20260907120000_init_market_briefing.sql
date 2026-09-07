-- Applied remotely via Supabase MCP as init_market_briefing_schema.
-- Types, tables, indexes, and SELECT policies for anon/authenticated.

create type public.news_region as enum ('us', 'world');
create type public.news_sentiment as enum ('positive', 'negative', 'neutral');
create type public.news_origin as enum ('rss', 'x');
create type public.event_category as enum ('crypto', 'fuels', 'traditional_markets', 'stocks');
create type public.impact_level as enum ('high', 'medium', 'low');
create type public.asset_class as enum ('crypto', 'index');
create type public.briefing_kind as enum ('daily', 'weekly');

create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  source text not null,
  url text not null unique,
  published_at timestamptz not null,
  region public.news_region not null,
  sentiment public.news_sentiment not null default 'neutral',
  category public.event_category,
  origin public.news_origin not null default 'rss',
  created_at timestamptz not null default now()
);

create index news_published_at_idx on public.news (published_at desc);
create index news_region_sentiment_idx on public.news (region, sentiment);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  category public.event_category not null,
  region public.news_region not null default 'us',
  is_holiday boolean not null default false,
  impact public.impact_level not null default 'medium',
  source text not null default '',
  unique (title, starts_at)
);

create index calendar_events_starts_at_idx on public.calendar_events (starts_at);

create table public.market_quotes (
  symbol text primary key,
  name text not null,
  price numeric not null,
  change_pct numeric not null default 0,
  asset_class public.asset_class not null,
  updated_at timestamptz not null default now()
);

create table public.briefings (
  id uuid primary key default gen_random_uuid(),
  briefing_date date not null,
  kind public.briefing_kind not null,
  headline text not null,
  body text not null,
  updated_at timestamptz not null default now(),
  unique (briefing_date, kind)
);

create table public.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  news_count int not null default 0,
  quote_count int not null default 0,
  event_count int not null default 0,
  error text
);

alter table public.news enable row level security;
alter table public.calendar_events enable row level security;
alter table public.market_quotes enable row level security;
alter table public.briefings enable row level security;
alter table public.ingest_runs enable row level security;

create policy "anon_read_news" on public.news for select to anon, authenticated using (true);
create policy "anon_read_calendar" on public.calendar_events for select to anon, authenticated using (true);
create policy "anon_read_quotes" on public.market_quotes for select to anon, authenticated using (true);
create policy "anon_read_briefings" on public.briefings for select to anon, authenticated using (true);

grant select on public.news, public.calendar_events, public.market_quotes, public.briefings to anon, authenticated;
