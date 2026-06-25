import type { Metadata } from "next";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import GamesNotConfigured from "@/components/GamesNotConfigured";
import CityWorldClient from "@/components/CityWorldClient";
import { BIcon } from "@/components/icons";
import { sanitizeLayout } from "@/lib/games/store";

export const metadata: Metadata = {
  title: "Git City — explore the shared developer city",
  description:
    "Walk through the shared city built by every developer's contributions. Click to explore, WASD to walk.",
};

export const dynamic = "force-dynamic";

export default async function CityWorldPage() {
  if (!isSupabaseConfigured()) return <GamesNotConfigured />;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("plots")
    .select("github_login, layout")
    .limit(200);

  const plots = (rows ?? [])
    .map((p) => ({
      login: p.github_login as string,
      layout: sanitizeLayout(p.layout),
    }))
    .filter((p) => p.layout.length > 0);

  return (
    <main className="container">
      <header className="games-subhero">
        <div>
          <Link href="/games/city" className="back-link">
            ← Build my city
          </Link>
          <h1>
            <BIcon name="compass" size={24} /> Explore the City
          </h1>
          <p>Every developer&apos;s plot, side by side. Walk the streets.</p>
        </div>
      </header>

      {plots.length === 0 ? (
        <div className="games-empty">
          <p>
            No cities built yet. <Link href="/games/city">Build the first one →</Link>
          </p>
        </div>
      ) : (
        <CityWorldClient plots={plots} />
      )}
    </main>
  );
}
