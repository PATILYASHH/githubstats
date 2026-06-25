import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshUserStats } from "@/lib/games/refresh";

// Let a signed-in user refresh their own stats on demand (so they don't have to
// wait for the nightly cron to appear on the leaderboard).
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  const meta = user.user_metadata ?? {};
  const login = meta.user_name ?? meta.preferred_username;
  if (!login) {
    return NextResponse.json({ error: "no github login" }, { status: 400 });
  }

  const stats = await refreshUserStats({
    userId: user.id,
    login,
    avatarUrl: meta.avatar_url,
    name: meta.full_name ?? meta.name,
  });

  if (!stats) {
    return NextResponse.json({ error: "refresh failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, stats });
}
