import type { Metadata } from "next";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import GamesNotConfigured from "@/components/GamesNotConfigured";
import RefreshStatsButton from "@/components/RefreshStatsButton";
import { BIcon } from "@/components/icons";
import {
  CHALLENGES,
  DIFFICULTY_COLOR,
  isAchieved,
} from "@/lib/games/challenges";
import type { UserStats } from "@/lib/games/types";

export const metadata: Metadata = {
  title: "Challenges — hard GitHub goals to conquer",
  description:
    "Take on hard contribution challenges. Track your progress and see who's already conquered each one.",
};

export const dynamic = "force-dynamic";

export default async function Challenges() {
  if (!isSupabaseConfigured()) return <GamesNotConfigured />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from("user_stats")
    .select("*")
    .limit(1000);
  const all = (rows ?? []) as UserStats[];

  // Resolve the signed-in user's snapshot reliably (they may rank outside the
  // fetched slice, or have just signed in with no snapshot yet).
  let me: UserStats | null = user
    ? all.find((s) => s.user_id === user.id) ?? null
    : null;
  if (user && !me) {
    const { data: meRow } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    me = (meRow as UserStats) ?? null;
  }

  return (
    <main className="container">
      <header className="games-subhero">
        <div>
          <Link href="/games" className="back-link">
            ← Games
          </Link>
          <h1>
            <BIcon name="flag-fill" size={24} /> Challenges
          </h1>
          <p>Hard goals built from real GitHub activity. How many can you conquer?</p>
        </div>
        {user && <RefreshStatsButton />}
      </header>

      <div className="challenge-grid">
        {CHALLENGES.map((c) => {
          const achievers = all.filter((s) => isAchieved(c, s));
          const mineValue = me ? c.value(me) : 0;
          const done = me ? isAchieved(c, me) : false;
          const pct = Math.min(100, Math.round((mineValue / c.target) * 100));
          const color = DIFFICULTY_COLOR[c.difficulty];

          return (
            <div
              key={c.id}
              className={`challenge-card${done ? " done" : ""}`}
              style={{ borderColor: done ? color : undefined }}
            >
              <div className="challenge-top">
                <span className="challenge-ico" style={{ color }}>
                  <BIcon name={c.icon} size={26} />
                </span>
                <span
                  className="challenge-diff"
                  style={{ color, borderColor: color }}
                >
                  {c.difficulty}
                </span>
                {done && (
                  <span className="challenge-check" style={{ color }}>
                    <BIcon name="check-circle-fill" size={20} />
                  </span>
                )}
              </div>

              <h3>{c.title}</h3>
              <p className="challenge-desc">{c.desc}</p>

              {me ? (
                <div className="challenge-progress">
                  <div className="challenge-bar">
                    <span
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <div className="challenge-progress-label">
                    {mineValue.toLocaleString("en-US")} /{" "}
                    {c.target.toLocaleString("en-US")}
                  </div>
                </div>
              ) : user ? (
                <p className="challenge-signin">
                  No snapshot yet — hit “Refresh my stats” above.
                </p>
              ) : (
                <p className="challenge-signin">Sign in to track your progress.</p>
              )}

              <div className="challenge-achievers">
                <BIcon name="people-fill" size={14} />{" "}
                {achievers.length === 0
                  ? "Be the first to conquer this"
                  : `${achievers.length} conquered`}
                {achievers.length > 0 && (
                  <span className="challenge-faces">
                    {achievers.slice(0, 5).map(
                      (a) =>
                        a.avatar_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={a.user_id}
                            src={a.avatar_url}
                            alt={a.github_login}
                            title={a.github_login}
                            width={22}
                            height={22}
                          />
                        )
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
