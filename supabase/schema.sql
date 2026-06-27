-- GitHub Stats — Games schema (v1)
-- Run this in the Supabase dashboard → SQL Editor → New query → Run.
-- Safe to re-run: uses "if not exists" / "or replace" throughout.

-- ---------------------------------------------------------------------------
-- profiles: one row per signed-in user. Auto-created on GitHub OAuth signup.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  github_login text unique,
  github_id    bigint,
  avatar_url   text,
  name         text,
  created_at   timestamptz not null default now()
);

-- Create a profile automatically whenever a new auth user appears.
-- GitHub OAuth puts the login in raw_user_meta_data->>'user_name'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, github_login, github_id, avatar_url, name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'user_name',
    nullif(new.raw_user_meta_data ->> 'provider_id', '')::bigint,
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users who signed in before this trigger existed.
insert into public.profiles (id, github_login, github_id, avatar_url, name)
select
  id,
  raw_user_meta_data ->> 'user_name',
  nullif(raw_user_meta_data ->> 'provider_id', '')::bigint,
  raw_user_meta_data ->> 'avatar_url',
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name')
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- user_stats: latest snapshot per user, written by the daily cron / refresh.
-- Login + avatar are denormalized so the leaderboard is a single public read.
-- ---------------------------------------------------------------------------
create table if not exists public.user_stats (
  user_id             uuid primary key references public.profiles (id) on delete cascade,
  github_login        text not null,
  avatar_url          text,
  name                text,
  contributions_total int not null default 0,
  contributions_year  int not null default 0,
  streak_current      int not null default 0,
  streak_longest      int not null default 0,
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- duels: 1v1 challenges. Scores are computed live, not stored.
-- ---------------------------------------------------------------------------
create table if not exists public.duels (
  id              uuid primary key default gen_random_uuid(),
  challenger_id   uuid not null references public.profiles (id) on delete cascade,
  challenger_login text not null,
  opponent_id     uuid references public.profiles (id) on delete cascade,
  opponent_login  text,
  start_date      date not null,
  end_date        date not null,
  status          text not null default 'pending'
                  check (status in ('pending','active','finished','declined','cancelled')),
  created_at      timestamptz not null default now()
);
create index if not exists duels_challenger_idx on public.duels (challenger_id);
create index if not exists duels_opponent_idx   on public.duels (opponent_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles   enable row level security;
alter table public.user_stats enable row level security;
alter table public.duels      enable row level security;

-- profiles: world-readable; users may update only their own row.
-- (Inserts happen via the security-definer trigger, not from clients.)
drop policy if exists "profiles readable by all" on public.profiles;
create policy "profiles readable by all"
  on public.profiles for select using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

-- user_stats: world-readable (it's a public leaderboard).
-- Writes come from the server via the service-role key, which bypasses RLS,
-- so no client write policy is granted.
drop policy if exists "stats readable by all" on public.user_stats;
create policy "stats readable by all"
  on public.user_stats for select using (true);

-- duels: world-readable (shareable by link). A user may create a duel as the
-- challenger, and update a duel they are part of (accept / decline / cancel).
drop policy if exists "duels readable by all" on public.duels;
create policy "duels readable by all"
  on public.duels for select using (true);

drop policy if exists "users create own duels" on public.duels;
create policy "users create own duels"
  on public.duels for insert with check (auth.uid() = challenger_id);

drop policy if exists "participants update duels" on public.duels;
create policy "participants update duels"
  on public.duels for update
  using (auth.uid() = challenger_id or auth.uid() = opponent_id);

-- ---------------------------------------------------------------------------
-- plots: a user's Git City plot (what they've built). layout is a JSON array
-- of { item, x, z }. login/avatar are denormalized for the city world view.
-- ---------------------------------------------------------------------------
create table if not exists public.plots (
  user_id      uuid primary key references public.profiles (id) on delete cascade,
  github_login text not null,
  avatar_url   text,
  layout       jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.plots enable row level security;

-- world-readable (everyone explores everyone's city), owner-only writes.
drop policy if exists "plots readable by all" on public.plots;
create policy "plots readable by all"
  on public.plots for select using (true);

drop policy if exists "users insert own plot" on public.plots;
create policy "users insert own plot"
  on public.plots for insert with check (auth.uid() = user_id);

drop policy if exists "users update own plot" on public.plots;
create policy "users update own plot"
  on public.plots for update using (auth.uid() = user_id);

-- ===========================================================================
-- Rankings v2 — location + time-bucketed leaderboards (Phase 1)
-- Scopes: global / country / city.  Periods: month / year (calendar) / all-time.
-- Safe to re-run.
-- ===========================================================================

-- Location override a user can set on their own profile. GitHub's free-text
-- "location" is unreliable, so people can correct their city/country here.
alter table public.profiles add column if not exists city    text;
alter table public.profiles add column if not exists country text;

-- Resolved (denormalized) location on the leaderboard table for single-read
-- filtering. Written by the refresh job: profile override wins, otherwise it's
-- parsed from the GitHub "location" field. location_raw is kept for debugging.
alter table public.user_stats add column if not exists city         text;
alter table public.user_stats add column if not exists country      text;
alter table public.user_stats add column if not exists location_raw text;

create index if not exists user_stats_country_idx
  on public.user_stats (lower(country));
create index if not exists user_stats_city_idx
  on public.user_stats (lower(country), lower(city));

-- Per-user, per-month contribution rollups. The refresh job upserts the
-- current calendar year's 12 buckets — enough for the Month and Year boards
-- (All-time uses user_stats.contributions_total). Full-history backfill is
-- deferred until a feature (e.g. Wrapped) needs it.
create table if not exists public.monthly_contributions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  year    int  not null,
  month   int  not null check (month between 1 and 12),
  count   int  not null default 0,
  primary key (user_id, year, month)
);

alter table public.monthly_contributions enable row level security;

drop policy if exists "monthly readable by all" on public.monthly_contributions;
create policy "monthly readable by all"
  on public.monthly_contributions for select using (true);
-- writes are service-role only (refresh job), which bypasses RLS.

-- ---------------------------------------------------------------------------
-- leaderboard(): one function powering all 9 scope×period boards.
--   p_period : 'month' | 'year' | 'all'
--   p_scope  : 'global' | 'country' | 'city'
-- For 'country'/'city' scope pass the viewer's resolved country (+ city).
-- ---------------------------------------------------------------------------
create or replace function public.leaderboard(
  p_period  text default 'year',
  p_scope   text default 'global',
  p_country text default null,
  p_city    text default null,
  p_limit   int  default 100,
  p_year    int  default null,
  p_month   int  default null
)
returns table (
  user_id        uuid,
  github_login   text,
  avatar_url     text,
  city           text,
  country        text,
  score          bigint,
  all_time       int,
  streak_current int,
  streak_longest int
)
language sql
stable
as $$
  select
    us.user_id,
    us.github_login,
    us.avatar_url,
    us.city,
    us.country,
    case
      when p_period = 'all' then us.contributions_total::bigint
      when p_period = 'month' then coalesce((
        select mc.count
        from public.monthly_contributions mc
        where mc.user_id = us.user_id
          and mc.year  = coalesce(p_year,  extract(year  from now())::int)
          and mc.month = coalesce(p_month, extract(month from now())::int)
      ), 0)::bigint
      else coalesce((
        select sum(mc.count)
        from public.monthly_contributions mc
        where mc.user_id = us.user_id
          and mc.year = coalesce(p_year, extract(year from now())::int)
      ), 0)
    end as score,
    us.contributions_total as all_time,
    us.streak_current,
    us.streak_longest
  from public.user_stats us
  where
    (p_scope <> 'country' or lower(us.country) = lower(p_country))
    and (p_scope <> 'city' or (
      lower(us.country) = lower(p_country) and lower(us.city) = lower(p_city)
    ))
  order by score desc, us.contributions_total desc
  limit greatest(coalesce(p_limit, 100), 1);
$$;

-- A single viewer's rank within a board (1-based, competition ranking).
-- Returns no row when the viewer isn't on that board.
create or replace function public.leaderboard_rank(
  p_user_id uuid,
  p_period  text default 'year',
  p_scope   text default 'global',
  p_country text default null,
  p_city    text default null
)
returns table (rank bigint, score bigint, total bigint)
language sql
stable
as $$
  with board as (
    select * from public.leaderboard(p_period, p_scope, p_country, p_city, 1000000)
  ),
  me as (select score from board where user_id = p_user_id)
  select
    ((select count(*) from board where score > (select score from me)) + 1)::bigint as rank,
    (select score from me)::bigint as score,
    (select count(*) from board)::bigint as total
  where exists (select 1 from me);
$$;
