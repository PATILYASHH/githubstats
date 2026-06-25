import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshUserStats } from "@/lib/games/refresh";

// GitHub OAuth redirects here with a code. Exchange it for a session, seed the
// user's stats, then send them on.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/games";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const meta = user.user_metadata ?? {};
        const login = meta.user_name ?? meta.preferred_username;
        if (login) {
          // Best-effort: don't block the redirect if GitHub is slow.
          await refreshUserStats({
            userId: user.id,
            login,
            avatarUrl: meta.avatar_url,
            name: meta.full_name ?? meta.name,
          });
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/games?error=auth`);
}
