import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { sanitizeLayout, layoutCost } from "@/lib/games/store";
import { availableCoins } from "@/lib/games/coins";

// Save the signed-in user's plot. Prices and the coin budget are enforced here
// (server-side) so a client can't overspend or place unknown/out-of-bounds items.
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "games not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const layout = sanitizeLayout(body?.layout);
  const cost = layoutCost(layout);

  const meta = user.user_metadata ?? {};
  const login = meta.user_name ?? meta.preferred_username ?? null;

  // Coins = lifetime contributions, from LIVE data (so today's commits count)
  // and never below the stored snapshot. Must match the page's budget so a build
  // the player just funded isn't rejected here.
  const { data: stats } = await supabase
    .from("user_stats")
    .select("contributions_total")
    .eq("user_id", user.id)
    .maybeSingle();
  const coins = await availableCoins(login, stats?.contributions_total ?? null);

  if (cost > coins) {
    return NextResponse.json(
      { error: "not enough coins", cost, coins },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("plots").upsert(
    {
      user_id: user.id,
      github_login: meta.user_name ?? meta.preferred_username ?? "you",
      avatar_url: meta.avatar_url ?? null,
      layout,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, spent: cost, balance: coins - cost });
}
