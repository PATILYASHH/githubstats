import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchDays,
  computeStreaks,
  totalContributions,
  sumCalendarYear,
  monthlyBuckets,
} from "./contributions";
import { parseLocation } from "./location";

interface RefreshInput {
  userId: string;
  login: string;
  avatarUrl?: string | null;
  name?: string | null;
}

// Fetch the user's GitHub "location" free-text field (used to derive city/
// country when the user hasn't set an override). Tolerant of failure.
async function fetchGithubLocation(login: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "githubstats-app",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(login)}`,
      { headers, next: { revalidate: 60 * 30 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json.location as string | null) ?? null;
  } catch {
    return null;
  }
}

// Fetch a user's contributions and upsert their user_stats row + this year's
// monthly rollups. Runs with the service-role key (bypasses RLS). Returns the
// computed snapshot, or null on failure so callers (cron) can keep going.
export async function refreshUserStats(input: RefreshInput) {
  try {
    const admin = createAdminClient();

    const [days, locationRaw, profileRes] = await Promise.all([
      fetchDays(input.login),
      fetchGithubLocation(input.login),
      admin
        .from("profiles")
        .select("city, country")
        .eq("id", input.userId)
        .maybeSingle(),
    ]);

    const { current, longest } = computeStreaks(days);
    const total = totalContributions(days);
    const thisYear = new Date().getUTCFullYear();
    const year = sumCalendarYear(days, thisYear);

    // Resolved location: the user's manual override wins, else parse the
    // GitHub free-text location field.
    const override = profileRes.data as { city?: string | null; country?: string | null } | null;
    const parsed = parseLocation(locationRaw);
    const city = override?.city?.trim() || parsed.city || null;
    const country = override?.country?.trim() || parsed.country || null;

    const row = {
      user_id: input.userId,
      github_login: input.login,
      avatar_url: input.avatarUrl ?? null,
      name: input.name ?? null,
      contributions_total: total,
      contributions_year: year, // calendar year-to-date
      streak_current: current,
      streak_longest: longest,
      city,
      country,
      location_raw: locationRaw,
      updated_at: new Date().toISOString(),
    };

    // Self-heal: ensure the profile row exists (FK target for user_stats) even
    // if the signup trigger never ran. Does not touch city/country so a user's
    // override is preserved.
    await admin.from("profiles").upsert(
      {
        id: input.userId,
        github_login: input.login,
        avatar_url: input.avatarUrl ?? null,
        name: input.name ?? null,
      },
      { onConflict: "id" }
    );

    const { error } = await admin
      .from("user_stats")
      .upsert(row, { onConflict: "user_id" });
    if (error) throw error;

    // Upsert this calendar year's 12 monthly buckets (powers Month + Year boards).
    const buckets = monthlyBuckets(days, thisYear).map((b) => ({
      user_id: input.userId,
      year: b.year,
      month: b.month,
      count: b.count,
    }));
    const { error: mErr } = await admin
      .from("monthly_contributions")
      .upsert(buckets, { onConflict: "user_id,year,month" });
    if (mErr) throw mErr;

    return row;
  } catch (err) {
    console.error(`refreshUserStats failed for ${input.login}:`, err);
    return null;
  }
}
