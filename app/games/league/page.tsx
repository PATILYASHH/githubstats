import type { Metadata } from "next";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import RefreshStatsButton from "@/components/RefreshStatsButton";
import GamesNotConfigured from "@/components/GamesNotConfigured";
import { BIcon } from "@/components/icons";
import type { UserStats } from "@/lib/games/types";

export const metadata: Metadata = {
  title: "Global League — rank against every developer",
  description:
    "The default Global league ranks every signed-in developer by contributions this year. Climb the table.",
};

export const dynamic = "force-dynamic";

const MEDAL = ["#e3b341", "#c0c5cc", "#cd7f32"]; // gold, silver, bronze

export default async function GlobalLeague() {
  if (!isSupabaseConfigured()) return <GamesNotConfigured />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from("user_stats")
    .select("*")
    .order("contributions_year", { ascending: false })
    .order("contributions_total", { ascending: false })
    .limit(100);

  const stats = (rows ?? []) as UserStats[];
  const myId = user?.id;

  // True player count and the user's real rank, independent of the top-100 slice.
  const { count: totalPlayers } = await supabase
    .from("user_stats")
    .select("*", { count: "exact", head: true });

  let myRank = 0;
  if (user) {
    const { data: meRow } = await supabase
      .from("user_stats")
      .select("contributions_year")
      .eq("user_id", user.id)
      .maybeSingle();
    if (meRow) {
      const { count: ahead } = await supabase
        .from("user_stats")
        .select("*", { count: "exact", head: true })
        .gt("contributions_year", meRow.contributions_year);
      myRank = (ahead ?? 0) + 1;
    }
  }

  return (
    <main className="container">
      <header className="games-subhero">
        <div>
          <Link href="/games" className="back-link">
            ← Games
          </Link>
          <h1>
            <BIcon name="trophy-fill" size={24} /> Global League
          </h1>
          <p>
            Every signed-in developer, ranked by contributions this year. Private
            group leagues are coming next.
          </p>
        </div>
        {user && <RefreshStatsButton />}
      </header>

      {myRank > 0 && (
        <div className="league-you">
          You&apos;re <strong>#{myRank}</strong> of {totalPlayers ?? stats.length}{" "}
          this season.
        </div>
      )}

      {stats.length === 0 ? (
        <div className="games-empty">
          <p>No players yet. Sign in with GitHub to enter the league!</p>
        </div>
      ) : (
        <div className="lb">
          <div className="lb-head">
            <span className="lb-rank">#</span>
            <span className="lb-user">Developer</span>
            <span className="lb-num">League pts</span>
            <span className="lb-num">All-time</span>
            <span className="lb-num">Streak</span>
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
                {s.contributions_year.toLocaleString("en-US")}
              </span>
              <span className="lb-num">
                {s.contributions_total.toLocaleString("en-US")}
              </span>
              <span className="lb-num">{s.streak_current}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
