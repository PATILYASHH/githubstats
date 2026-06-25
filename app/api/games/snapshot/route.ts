import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshUserStats } from "@/lib/games/refresh";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // allow the loop time on Vercel

// Daily cron: re-snapshot every registered user's contributions.
// Protected by CRON_SECRET. Vercel Cron sends it as a Bearer token; a manual
// call may pass ?secret=... instead.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  const provided = auth?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, github_login, avatar_url, name")
    .not("github_login", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let ok = 0;
  let failed = 0;
  // Sequential keeps us friendly to the free contributions API's rate limits.
  for (const p of profiles ?? []) {
    const res = await refreshUserStats({
      userId: p.id,
      login: p.github_login as string,
      avatarUrl: p.avatar_url,
      name: p.name,
    });
    if (res) ok++;
    else failed++;
  }

  return NextResponse.json({ refreshed: ok, failed, total: (profiles ?? []).length });
}
