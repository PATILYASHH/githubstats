import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshUserStats } from "@/lib/games/refresh";
import { normCity, normCountry } from "@/lib/games/location";

// Let a signed-in user set/correct their city + country override, then
// re-resolve their stats so the new location appears on the boards.
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "games not configured" }, { status: 503 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      {
        error:
          "Server is missing SUPABASE_SERVICE_ROLE_KEY — set it in Vercel and redeploy.",
      },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  let body: { city?: unknown; country?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const rawCity = typeof body.city === "string" ? body.city.trim().slice(0, 80) : "";
  const rawCountry =
    typeof body.country === "string" ? body.country.trim().slice(0, 80) : "";
  const city = rawCity ? normCity(rawCity) : null;
  const country = rawCountry ? normCountry(rawCountry) : null;

  const meta = user.user_metadata ?? {};
  const login = meta.user_name ?? meta.preferred_username;
  if (!login) {
    return NextResponse.json({ error: "no github login" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ city, country })
    .eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await refreshUserStats({
    userId: user.id,
    login,
    avatarUrl: meta.avatar_url,
    name: meta.full_name ?? meta.name,
  });

  return NextResponse.json({ ok: true, city, country });
}
