import type { Metadata } from "next";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import RefreshStatsButton from "@/components/RefreshStatsButton";
import GamesNotConfigured from "@/components/GamesNotConfigured";
import { BIcon } from "@/components/icons";
import type { UserStats } from "@/lib/games/types";

const MEDAL = ["#e3b341", "#c0c5cc", "#cd7f32"]; // gold, silver, bronze

export const metadata: Metadata = {
  title: "Streak Survivor — GitHub streak leaderboard",
  description:
    "The global GitHub contribution-streak leaderboard. Keep your streak alive and climb the ranks.",
};

export const dynamic = "force-dynamic";

export default async function StreakLeaderboard() {
  if (!isSupabaseConfigured()) return <GamesNotConfigured />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from("user_stats")
    .select("*")
    .order("streak_current", { ascending: false })
    .order("streak_longest", { ascending: false })
    .order("contributions_total", { ascending: false })
    .limit(100);

  const stats = (rows ?? []) as UserStats[];
  const myId = user?.id;

  return (
    <main className="container">
      <header className="games-subhero">
        <div>
          <Link href="/games" className="back-link">
            ← Games
          </Link>
          <h1>
            <BIcon name="fire" size={26} /> Streak Survivor
          </h1>
          <p>Ranked by current streak, then longest streak.</p>
        </div>
        {user && <RefreshStatsButton />}
      </header>

      {stats.length === 0 ? (
        <div className="games-empty">
          <p>No players yet. Be the first — sign in with GitHub!</p>
        </div>
      ) : (
        <div className="lb">
          <div className="lb-head">
            <span className="lb-rank">#</span>
            <span className="lb-user">Developer</span>
            <span className="lb-num">Current</span>
            <span className="lb-num">Longest</span>
            <span className="lb-num">Total</span>
          </div>
          {stats.map((s, i) => (
            <div
              key={s.user_id}
              className={`lb-row${s.user_id === myId ? " me" : ""}${
                i < 3 ? " top" : ""
              }`}
            >
              <span
                className="lb-rank"
                style={i < 3 ? { color: MEDAL[i] } : undefined}
              >
                {i < 3 ? <BIcon name="trophy-fill" size={18} /> : i + 1}
              </span>
              <Link href={`/${s.github_login}`} className="lb-user">
                {s.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.avatar_url} alt="" width={28} height={28} />
                )}
                <span>{s.github_login}</span>
              </Link>
              <span className="lb-num lb-streak">
                {s.streak_current}{" "}
                <BIcon name="fire" size={14} className="fire-ico" />
              </span>
              <span className="lb-num">{s.streak_longest}</span>
              <span className="lb-num">
                {s.contributions_total.toLocaleString("en-US")}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
