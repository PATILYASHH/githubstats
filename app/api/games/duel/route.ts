import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Duel } from "@/lib/games/types";

// Mutate a duel: accept an open invite, or cancel your own duel.
// Validated against the session, then written with the service-role client.
export async function POST(request: Request) {
  const { duelId, action } = await request.json().catch(() => ({}));
  if (!duelId || !["accept", "cancel"].includes(action)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: duel } = await admin
    .from("duels")
    .select("*")
    .eq("id", duelId)
    .single<Duel>();
  if (!duel) {
    return NextResponse.json({ error: "duel not found" }, { status: 404 });
  }

  if (action === "accept") {
    if (duel.status !== "pending" || duel.opponent_id) {
      return NextResponse.json({ error: "duel not open" }, { status: 409 });
    }
    if (duel.challenger_id === user.id) {
      return NextResponse.json(
        { error: "cannot accept your own duel" },
        { status: 409 }
      );
    }
    const login =
      user.user_metadata?.user_name ?? user.user_metadata?.preferred_username;
    const { error } = await admin
      .from("duels")
      .update({
        opponent_id: user.id,
        opponent_login: login,
        status: "active",
      })
      .eq("id", duelId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // cancel — challenger only
  if (duel.challenger_id !== user.id) {
    return NextResponse.json({ error: "not your duel" }, { status: 403 });
  }
  const { error } = await admin
    .from("duels")
    .update({ status: "cancelled" })
    .eq("id", duelId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
