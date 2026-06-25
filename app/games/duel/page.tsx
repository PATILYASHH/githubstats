import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CreateDuelForm from "@/components/CreateDuelForm";
import { duelPhase, PHASE_LABEL } from "@/lib/games/duel";
import { todayUTC } from "@/lib/games/contributions";
import type { Duel } from "@/lib/games/types";

export const metadata: Metadata = {
  title: "1v1 Duel — challenge a developer",
  description:
    "Challenge a friend to a GitHub contribution duel. Most contributions over the window wins.",
};

export const dynamic = "force-dynamic";

export default async function DuelHub() {
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
            <h1>⚔️ 1v1 Duel</h1>
          </div>
        </header>
        <div className="games-empty">
          <p>Sign in with GitHub (top bar) to create and accept duels.</p>
        </div>
      </main>
    );
  }

  const login =
    (user.user_metadata?.user_name as string) ??
    (user.user_metadata?.preferred_username as string);

  const { data } = await supabase
    .from("duels")
    .select("*")
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const duels = (data ?? []) as Duel[];
  const today = todayUTC();

  return (
    <main className="container">
      <header className="games-subhero">
        <div>
          <Link href="/games" className="back-link">
            ← Games
          </Link>
          <h1>⚔️ 1v1 Duel</h1>
          <p>Challenge a friend. Most contributions over the window wins.</p>
        </div>
      </header>

      <CreateDuelForm challengerId={user.id} challengerLogin={login} />

      <h3 className="duel-list-title">Your duels</h3>
      {duels.length === 0 ? (
        <div className="games-empty">
          <p>No duels yet. Create one above and share the link.</p>
        </div>
      ) : (
        <div className="duel-list">
          {duels.map((d) => {
            const phase = duelPhase(d, today);
            const vs =
              d.challenger_login === login ? d.opponent_login : d.challenger_login;
            return (
              <Link key={d.id} href={`/games/duel/${d.id}`} className="duel-row">
                <span className={`duel-badge ${phase}`}>
                  {PHASE_LABEL[phase]}
                </span>
                <span className="duel-vs">
                  vs {vs ?? "open invite"}
                </span>
                <span className="duel-dates">
                  {d.start_date} → {d.end_date}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
