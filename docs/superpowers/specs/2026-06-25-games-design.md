# GitHub Stats — Games & Competition

**Date:** 2026-06-25
**Status:** Approved design, pre-implementation
**Author:** Yash Patil (with Claude)

## Summary

Add a `/games` section to the existing GitHub Stats Next.js app where users compete
on GitHub activity. Three games, built in phases on a shared foundation:

1. **Streak Survivor** — solo contribution-streak leaderboard.
2. **1v1 Duel** — challenge a friend; most contributions in a time window wins.
3. **Group League** — private/public groups with a monthly points table.

All three are different *reads* over one nightly snapshot of every registered user's
contributions. The heavy infrastructure (auth + snapshot + DB) is built once.

## Context

Today the app is **stateless**: it takes a GitHub username, fetches public stats live,
renders, and persists nothing. Games require three new capabilities the app does not
have: identity (accounts), persistence (a database), and writes (challenges, groups).

This is a deliberate architectural expansion, not a tweak.

## Key design decisions

### OAuth is for identity only — not data fetching
Contribution counts are **public**, so the server fetches every user's numbers with a
single **app-level GitHub token** (`GITHUB_PAT`, 5000 req/hr) during the nightly cron.
We do **not** use each user's OAuth token to fetch their data.

OAuth's only job is to prove "you own `github_login = X`", so a user cannot claim
someone else's streak. This keeps rate limits and token handling simple.

### Data is daily, not real-time
GitHub contribution data updates on a delay and is snapshotted once per day. All
competition state is computed from stored history, **not** re-fetched on page load.
Consequence: a duel starting *today* gets its first real data point *tomorrow*; duels
have a 2-day minimum and the UI states this clearly.

### Scores are derived, not stored
Duel scores and league standings are computed by summing `contributions_day` over the
relevant date window. No denormalized score columns to keep in sync.

## Architecture

- **Supabase** — Postgres + GitHub OAuth + Row-Level Security. Free tier to start.
- **Vercel Cron** — runs daily (~00:30 UTC), calls `POST /api/games/snapshot`
  (guarded by `CRON_SECRET`): loops registered users → fetches contributions via GitHub
  GraphQL with `GITHUB_PAT` → upserts `daily_stats` → recomputes streaks.
- **Write APIs** under `/api/games/*` for duels and groups.
- **Reads** (leaderboards, duel scores, league tables) computed from stored `daily_stats`.

```
GitHub GraphQL ──(daily cron, app PAT)──▶ /api/games/snapshot ──▶ daily_stats
                                                                      │
Browser ──(GitHub OAuth via Supabase)──▶ profiles                     │
                                             │                        │
                                             ▼                        ▼
                          /games/* pages read leaderboards, duels, leagues
```

## Data model

All tables protected by Row-Level Security.

### `profiles`
One row per signed-in user. Created on first OAuth login.
- `id` (uuid, PK, = auth uid)
- `github_login` (text, unique)
- `github_id` (bigint, unique)
- `avatar_url` (text)
- `name` (text)
- `created_at` (timestamptz)

### `daily_stats`
Nightly snapshot per user.
- PK (`user_id` → profiles.id, `date`)
- `contributions_total` (int) — lifetime total at snapshot time
- `contributions_day` (int) — contributions on that date
- `streak_current` (int)
- `streak_longest` (int)

### `duels`
- `id` (uuid, PK)
- `challenger_id` (uuid → profiles)
- `opponent_id` (uuid → profiles, nullable until accepted)
- `start_date` (date), `end_date` (date)
- `status` (enum: `pending` | `active` | `finished` | `declined`)
- `winner_id` (uuid → profiles, nullable)
- `created_at` (timestamptz)

### `groups`
- `id` (uuid, PK)
- `name` (text)
- `slug` (text, unique)
- `visibility` (enum: `public` | `private`)
- `invite_code` (text) — for private joins
- `owner_id` (uuid → profiles)
- `created_at` (timestamptz)

### `group_members`
- PK (`group_id` → groups.id, `user_id` → profiles.id)
- `joined_at` (timestamptz)

## Game logic

- **Streak Survivor** — `streak_current` = consecutive days with `contributions_day > 0`
  ending today (today may be pending). Global leaderboard ordered by `streak_current`,
  tiebreak `streak_longest`. Streak computation is a pure function (unit-testable).
- **1v1 Duel** — challenger picks duration → shareable invite link → opponent signs in
  and accepts → score = sum of `contributions_day` in `[start_date, end_date]` → winner
  at end. Live progress while `active`.
- **Group League** — members of a group; rolling monthly season; points = sum of
  `contributions_day` this season; ranked table. Public groups are listed/searchable;
  private groups join via `invite_code`.

## Security

- RLS on every table.
- `profiles` and leaderboard reads are publicly readable (leaderboards are public).
- Users can write only their own rows (`auth.uid() = id` style policies).
- Authenticated users can create duels/groups and join groups.
- Cron/snapshot writes use the Supabase **service-role key** — server-only, never
  shipped to the browser, never in a `NEXT_PUBLIC_` var.
- `/api/games/snapshot` rejects any request without the correct `CRON_SECRET`.

## Routes

| Route | Purpose |
|---|---|
| `/games` | Hub: game cards + sign-in |
| `/games/streak` | Global streak leaderboard + your streak |
| `/games/duel` | Create duel, list your duels |
| `/games/duel/[id]` | Single duel: accept / live progress / result |
| `/games/groups` | List/search/create/join groups |
| `/games/groups/[slug]` | Group league table |

## Environment variables

| Var | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Browser client (RLS-bound) |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Cron/snapshot writes (bypasses RLS) |
| `GITHUB_PAT` | server | App token for fetching public contributions |
| `CRON_SECRET` | server | Guards the snapshot endpoint |

Stored in `.env.local` (gitignored). Mirrored into Vercel project env for production.

## Phasing

- **Phase 1 — Foundation + Streak Survivor.** Supabase setup, GitHub OAuth, `profiles`,
  `daily_stats`, snapshot cron, Streak Survivor leaderboard, `/games` hub. Proves the
  entire pipeline and is independently shippable.
- **Phase 2 — Duels.** `duels` table + create/accept/score flow + UI.
- **Phase 3 — Groups + League.** `groups` + `group_members`, public+private joins,
  league table.

## Out of scope (caveats)

- **Scale:** the snapshot loop is fine for hundreds of users on one 300s Vercel function.
  Thousands of users will need batching or a queue — noted, not built now.
- **No XP/quests layer** in this design (not selected).
- **No real-time updates** — daily cadence by design.

## Testing

- Streak computation and duel/league scoring are pure functions over `daily_stats` —
  unit-tested directly.
- OAuth login and the snapshot cron verified manually end-to-end in Phase 1.
