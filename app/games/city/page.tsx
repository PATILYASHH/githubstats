import type { Metadata } from "next";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import GamesNotConfigured from "@/components/GamesNotConfigured";
import CityGameClient from "@/components/CityGameClient";
import type { GamePlot } from "@/components/CityGame";
import { BIcon } from "@/components/icons";
import { sanitizeLayout, type Layout } from "@/lib/games/store";
import { availableCoins } from "@/lib/games/coins";

export const metadata: Metadata = {
  title: "Git City — build & explore in first person",
  description:
    "Walk a Minecraft-style city built from GitHub contributions. Spend contribution coins to place blocks on your plot.",
};

export const dynamic = "force-dynamic";

const CITY_TARGET = 5; // show a 5-plot city even with few registered users

export default async function CityGamePage() {
  if (!isSupabaseConfigured()) return <GamesNotConfigured />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const myLogin = (user?.user_metadata?.user_name ??
    user?.user_metadata?.preferred_username) as string | undefined;

  // All built plots.
  const { data: rows } = await supabase
    .from("plots")
    .select("github_login, layout")
    .limit(50);

  const cityPlots: GamePlot[] = (rows ?? []).map((p) => ({
    login: p.github_login as string,
    layout: sanitizeLayout(p.layout),
    mine: !!myLogin && p.github_login === myLogin,
  }));

  // Ensure the signed-in user has an (editable) plot in the city.
  let budget = 0;
  if (myLogin) {
    if (!cityPlots.some((p) => p.mine)) {
      cityPlots.unshift({ login: myLogin, layout: [] as Layout, mine: true });
    }
    // Coins follow LIVE contributions so today's commits immediately raise the
    // balance (e.g. 1000 → 1040), never dropping below the stored snapshot.
    // Live also means the game is playable before stats are populated.
    const { data: stats } = await supabase
      .from("user_stats")
      .select("contributions_total")
      .eq("user_id", user!.id)
      .maybeSingle();
    budget = await availableCoins(myLogin, stats?.contributions_total ?? null);
  }

  // Pad to a 5-plot city with reserved plots.
  let reserved = 1;
  while (cityPlots.length < CITY_TARGET) {
    cityPlots.push({ login: `Available ${reserved++}`, layout: [], mine: false });
  }

  return (
    <main className="container">
      <header className="games-subhero">
        <div>
          <Link href="/games" className="back-link">
            ← Games
          </Link>
          <h1>
            <BIcon name="buildings-fill" size={24} /> Git City
          </h1>
          <p>
            {myLogin
              ? "Click to play. Walk the city and build on your plot with contribution coins."
              : "Click to walk the city. Sign in to claim a plot and build."}
          </p>
        </div>
      </header>

      <CityGameClient plots={cityPlots} budget={budget} canBuild={!!myLogin} />
    </main>
  );
}
