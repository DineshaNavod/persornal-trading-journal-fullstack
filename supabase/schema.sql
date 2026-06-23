-- Trading Journal — Supabase schema
-- Run this in your Supabase project SQL editor (Database → SQL Editor).
-- Safe to re-run: every statement uses IF NOT EXISTS / ON CONFLICT DO NOTHING.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------
create table if not exists accounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  starting_balance numeric not null default 6000,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- symbols
-- ---------------------------------------------------------------------------
create table if not exists symbols (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

insert into symbols (name, is_custom)
values ('EURUSD', false), ('GBPUSD', false), ('AUDUSD', false), ('GBPJPY', false)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- strategies
-- ---------------------------------------------------------------------------
create table if not exists strategies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  rules text not null default '',
  entry_conditions text not null default '',
  exit_conditions text not null default '',
  risk_rules text not null default '',
  discipline_checklist jsonb not null default '[]'::jsonb,
  allowed_risk_levels jsonb not null default '[0.25, 0.5, 1]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- trades
-- risk_dollar : manually entered dollars the trader put at risk
-- profit      : manually entered net result in dollars (negative = loss)
-- r_multiple is derived at read-time as profit / risk_dollar, never stored
-- ---------------------------------------------------------------------------
create table if not exists trades (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references accounts(id) on delete cascade,
  symbol_id uuid not null references symbols(id),
  strategy_id uuid references strategies(id),
  date timestamptz not null default now(),
  direction text not null check (direction in ('buy', 'sell')),
  entry_price numeric not null,
  stop_loss_price numeric not null,
  take_profit_price numeric not null,
  risk_dollar numeric not null default 0,
  profit numeric not null default 0,
  notes text,
  checklist jsonb not null default '{}'::jsonb,
  htf_image_url text not null,
  mtf_image_url text not null,
  ltf_image_url text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Migration: if the trades table already existed with old columns, add the
-- new ones and drop the old ones so everything stays consistent.
-- ---------------------------------------------------------------------------
do $$
begin
  -- Add risk_dollar if missing
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'trades' and column_name = 'risk_dollar'
  ) then
    alter table trades add column risk_dollar numeric not null default 0;
  end if;

  -- Add profit if missing
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'trades' and column_name = 'profit'
  ) then
    alter table trades add column profit numeric not null default 0;
  end if;

  -- Drop old exit_price if it exists
  if exists (
    select 1 from information_schema.columns
    where table_name = 'trades' and column_name = 'exit_price'
  ) then
    alter table trades drop column exit_price;
  end if;

  -- Drop old risk_percent if it exists
  if exists (
    select 1 from information_schema.columns
    where table_name = 'trades' and column_name = 'risk_percent'
  ) then
    alter table trades drop column risk_percent;
  end if;
end $$;

create index if not exists trades_date_idx    on trades (date desc);
create index if not exists trades_account_idx on trades (account_id);

-- ---------------------------------------------------------------------------
-- Storage bucket for trade screenshots
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('trade-screenshots', 'trade-screenshots', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security (open — single private user, no auth)
-- ---------------------------------------------------------------------------
alter table accounts   enable row level security;
alter table symbols    enable row level security;
alter table strategies enable row level security;
alter table trades     enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='accounts' and policyname='public read accounts') then
    create policy "public read accounts"  on accounts for select using (true);
    create policy "public write accounts" on accounts for insert with check (true);
    create policy "public update accounts"on accounts for update using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='symbols' and policyname='public read symbols') then
    create policy "public read symbols"  on symbols for select using (true);
    create policy "public write symbols" on symbols for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='strategies' and policyname='public read strategies') then
    create policy "public read strategies"  on strategies for select using (true);
    create policy "public write strategies" on strategies for insert with check (true);
    create policy "public update strategies"on strategies for update using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='trades' and policyname='public read trades') then
    create policy "public read trades"   on trades for select using (true);
    create policy "public write trades"  on trades for insert with check (true);
    create policy "public update trades" on trades for update using (true);
    create policy "public delete trades" on trades for delete using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and policyname='public read screenshots') then
    create policy "public read screenshots"   on storage.objects for select using (bucket_id = 'trade-screenshots');
    create policy "public upload screenshots" on storage.objects for insert with check (bucket_id = 'trade-screenshots');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Seed: create Main Account and Core Strategy if they don't exist yet
-- ---------------------------------------------------------------------------
insert into accounts (name, starting_balance)
select 'Main Account', 6000
where not exists (select 1 from accounts);

insert into strategies (name, rules, entry_conditions, exit_conditions, risk_rules, discipline_checklist, allowed_risk_levels)
select
  'Core Strategy',
  'Trade only the London and New York sessions. Maximum 3 trades per day. Stop trading after 2 consecutive losses.',
  'Price sweeps a clear liquidity level, then shows a structure shift on the lower timeframe in the direction of the higher-timeframe bias.',
  'Take profit at the single defined TP level. Move stop to break-even once price reaches 1R in favor.',
  'Risk per trade is decided manually based on conviction and setup quality.',
  '["Setup matches the written strategy", "Risk is within allowed limits", "High-impact news has been checked", "Stop loss is clearly defined before entry", "This is not a revenge or overtrade"]'::jsonb,
  '[0.25, 0.5, 1]'::jsonb
where not exists (select 1 from strategies);
