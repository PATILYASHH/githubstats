# Games — setup guide

The Games feature needs Supabase (database + GitHub OAuth). Code is done; these
are the one-time dashboard steps **you** have to do. ~10 minutes.

## 1. Create the database tables

Supabase dashboard → **SQL Editor** → New query → paste the contents of
[`supabase/schema.sql`](supabase/schema.sql) → **Run**. Safe to re-run.

This creates `profiles`, `user_stats`, `duels`, the row-level-security policies,
and a trigger that auto-creates a profile when someone signs in.

## 2. Create a GitHub OAuth App

GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**:

- **Application name:** GitHubStats Games (anything)
- **Homepage URL:** `https://githubstatss.vercel.app`
- **Authorization callback URL:**
  `https://puucwpfqgcqmwfnlabit.supabase.co/auth/v1/callback`
  (this is the **Supabase** callback, not your app's)

Click **Register**, then **Generate a client secret**. Copy the **Client ID**
and **Client Secret**.

## 3. Enable GitHub in Supabase

Supabase dashboard → **Authentication → Providers → GitHub**:

- Toggle **Enable**
- Paste the **Client ID** and **Client Secret** from step 2
- Save

## 4. Set the redirect URLs

Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://githubstatss.vercel.app`
- **Redirect URLs** (add both):
  - `http://localhost:3000/**`
  - `https://githubstatss.vercel.app/**`

## 5. Environment variables

`.env.local` is already filled in for local dev. For production, add these to
**Vercel → Project → Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key (server only!) |
| `CRON_SECRET` | the value from `.env.local` |

No GitHub token is needed — contribution data comes from a free public API.

## 6. Daily snapshot (cron)

[`vercel.json`](vercel.json) already schedules `/api/games/snapshot` daily at
00:30 UTC. Vercel automatically sends `CRON_SECRET` as a Bearer token, so once
the env var is set in Vercel the cron is authenticated. Vercel Hobby allows one
cron run per day, which is exactly what this uses.

To trigger a snapshot manually:
`https://your-site/api/games/snapshot?secret=YOUR_CRON_SECRET`

## How it works

- **Sign in** is GitHub OAuth only — proves you own the account, so streaks
  can't be faked.
- Each user's contributions are fetched server-side and stored in `user_stats`,
  refreshed nightly by the cron or on demand via **↻ Refresh my stats**.
- **Streak Survivor** reads `user_stats`. **Duels** compute scores live from the
  contributions API (no stored per-day data needed in v1).
- **Group League** is scaffolded as "coming soon" — Phase 3.

## Security note

The **service-role key** bypasses all row-level security. Keep it server-side
only, never in a `NEXT_PUBLIC_` variable, never committed. Rotate it before
launch (Supabase → Settings → API → Reset service_role key) since it was shared
in chat during development.
