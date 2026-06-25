import type { Metadata } from "next";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import RefreshStatsButton from "@/components/RefreshStatsButton";
import GamesNotConfigured from "@/components/GamesNotConfigured";
import { BIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Games — compete on GitHub activity",
  description:
    "Sign in with GitHub and compete: streak leaderboards, 1v1 duels, head-to-head compare and group leagues based on your real contributions.",
};

export const dynamic = "force-dynamic";

interface GameCard {
  href: string;
  icon: string;
  title: string;
  desc: string;
  status: "live" | "soon";
}

const GAMES: GameCard[] = [
  {
    href: "/games/streak",
    icon: "fire",
    title: "Streak Survivor",
    desc: "Keep your contribution streak alive. Climb the global leaderboard by current and longest streak.",
    status: "live",
  },
  {
    href: "/games/duel",
    icon: "lightning-charge-fill",
    title: "1v1 Duel",
    desc: "Challenge a friend for a set number of days. Most contributions in the window wins. Shareable invite link.",
    status: "live",
  },
  {
    href: "/compare",
    icon: "bar-chart-line-fill",
    title: "Compare",
    desc: "Put two developers head-to-head across contributions, streaks, stars and more.",
    status: "live",
  },
  {
    href: "/games",
    icon: "trophy-fill",
    title: "Group League",
    desc: "Private or public groups with a monthly points table. Compete with your batch or team.",
    status: "soon",
  },
];

export default async function GamesHub() {
  if (!isSupabaseConfigured()) return <GamesNotConfigured />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const login = user?.user_metadata?.user_name as string | undefined;

  return (
    <main className="container">
      <header className="games-hero">
        <h1>
          <BIcon name="controller" size={36} />{" "}
          <span className="grad">Games</span>
        </h1>
        <p>
          Compete with other developers using your real GitHub activity. Sign in
          with GitHub once — your streaks and duels are verified, not typed in.
        </p>
        {login ? (
          <div className="games-hero-actions">
            <span className="games-welcome">
              Signed in as <strong>{login}</strong>
            </span>
            <RefreshStatsButton />
          </div>
        ) : (
          <p className="games-hint">
            Use <strong>Sign in</strong> in the top bar to join the competition.
          </p>
        )}
      </header>

      <div className="games-grid">
        {GAMES.map((g) => {
          const card = (
            <>
              <div className="game-card-emoji">
                <BIcon name={g.icon} size={30} />
              </div>
              <div className="game-card-body">
                <h3>
                  {g.title}
                  {g.status === "soon" && (
                    <span className="game-soon">Coming soon</span>
                  )}
                </h3>
                <p>{g.desc}</p>
              </div>
            </>
          );
          return g.status === "live" ? (
            <Link key={g.title} href={g.href} className="game-card">
              {card}
            </Link>
          ) : (
            <div key={g.title} className="game-card disabled">
              {card}
            </div>
          );
        })}
      </div>
    </main>
  );
}
