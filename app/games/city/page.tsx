import type { Metadata } from "next";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import GamesNotConfigured from "@/components/GamesNotConfigured";
import PlotEditor from "@/components/PlotEditor";
import { BIcon } from "@/components/icons";
import { sanitizeLayout } from "@/lib/games/store";

export const metadata: Metadata = {
  title: "Git City — build your plot with contribution coins",
  description:
    "Spend your GitHub contributions as coins to build a city on your plot, then walk the shared city of every developer.",
};

export const dynamic = "force-dynamic";

export default async function CityBuild() {
  if (!isSupabaseConfigured()) return <GamesNotConfigured />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
            <p>Turn your contributions into coins and build a city.</p>
          </div>
        </header>
        <div className="games-empty">
          <p>
            <strong>Sign in with GitHub</strong> (top bar) to get your coins and
            build your plot.
          </p>
          <p style={{ marginTop: 14 }}>
            <Link href="/games/city/world" className="btn">
              Explore the city →
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const [{ data: stats }, { data: plotRow }] = await Promise.all([
    supabase
      .from("user_stats")
      .select("contributions_total")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("plots").select("layout").eq("user_id", user.id).maybeSingle(),
  ]);

  const budget = stats?.contributions_total ?? 0;
  const initialLayout = sanitizeLayout(plotRow?.layout);

  return (
    <main className="container">
      <header className="games-subhero">
        <div>
          <Link href="/games" className="back-link">
            ← Games
          </Link>
          <h1>
            <BIcon name="buildings-fill" size={24} /> Build your Git City
          </h1>
          <p>
            Every contribution is a coin. Buy from the store and build on your
            8×8 plot.
          </p>
        </div>
        <Link href="/games/city/world" className="btn-ghost">
          <BIcon name="compass" /> Explore the city
        </Link>
      </header>

      <PlotEditor initialLayout={initialLayout} budget={budget} />
    </main>
  );
}
