import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchDays,
  computeStreaks,
  totalContributions,
  sumInRange,
  todayUTC,
} from "./contributions";

interface RefreshInput {
  userId: string;
  login: string;
  avatarUrl?: string | null;
  name?: string | null;
}

// Fetch a user's contributions and upsert their user_stats row. Runs with the
// service-role key (bypasses RLS). Returns the computed snapshot, or null on
// failure so callers (cron) can keep going for other users.
export async function refreshUserStats(input: RefreshInput) {
  try {
    const days = await fetchDays(input.login);
    const { current, longest } = computeStreaks(days);
    const total = totalContributions(days);

    const today = todayUTC();
    const yearAgo = new Date(Date.now() - 365 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const year = sumInRange(days, yearAgo, today);

    const row = {
      user_id: input.userId,
      github_login: input.login,
      avatar_url: input.avatarUrl ?? null,
      name: input.name ?? null,
      contributions_total: total,
      contributions_year: year,
      streak_current: current,
      streak_longest: longest,
      updated_at: new Date().toISOString(),
    };

    const admin = createAdminClient();
    const { error } = await admin
      .from("user_stats")
      .upsert(row, { onConflict: "user_id" });
    if (error) throw error;

    return row;
  } catch (err) {
    console.error(`refreshUserStats failed for ${input.login}:`, err);
    return null;
  }
}
