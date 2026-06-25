import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import GamesNotConfigured from "@/components/GamesNotConfigured";
import { fetchDays, sumInRange, todayUTC } from "@/lib/games/contributions";
import { duelPhase, PHASE_LABEL } from "@/lib/games/duel";
import DuelActions from "@/components/DuelActions";
import { BIcon } from "@/components/icons";
import type { Duel } from "@/lib/games/types";

export const metadata: Metadata = {
  title: "Duel — GitHub contribution challenge",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function scoreFor(
  login: string | null,
  start: string,
  end: string,
  today: string
): Promise<number | null> {
  if (!login) return null;
  try {
    const days = await fetchDays(login);
    const upTo = today < end ? today : end;
    if (upTo < start) return 0;
    return sumInRange(days, start, upTo);
  } catch {
    return null;
  }
}

export default async function DuelDetail({ params }: Props) {
  if (!isSupabaseConfigured()) return <GamesNotConfigured />;

  const { id } = await params;
  const supabase = await createClient();

  const { data: duelRow } = await supabase
    .from("duels")
    .select("*")
    .eq("id", id)
    .single<Duel>();
  if (!duelRow) notFound();
  const duel = duelRow;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = todayUTC();
  const phase = duelPhase(duel, today);

  // Live scores (skip while still waiting for an opponent).
  const [challengerScore, opponentScore] =
    phase === "pending"
      ? [null, null]
      : await Promise.all([
          scoreFor(duel.challenger_login, duel.start_date, duel.end_date, today),
          scoreFor(duel.opponent_login, duel.start_date, duel.end_date, today),
        ]);

  let winner: string | null = null;
  if (
    phase === "finished" &&
    challengerScore !== null &&
    opponentScore !== null
  ) {
    if (challengerScore > opponentScore) winner = duel.challenger_login;
    else if (opponentScore > challengerScore) winner = duel.opponent_login;
    else winner = "tie";
  }

  const isChallenger = user?.id === duel.challenger_id;
  const canAccept = !!user && phase === "pending" && !isChallenger;
  const canCancel =
    isChallenger && ["pending", "upcoming", "active"].includes(phase);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const inviteUrl =
    phase === "pending" && isChallenger
      ? `${proto}://${host}/games/duel/${duel.id}`
      : undefined;

  return (
    <main className="container">
      <header className="games-subhero">
        <div>
          <Link href="/games/duel" className="back-link">
            ← Duels
          </Link>
          <h1>
            <BIcon name="lightning-charge-fill" size={24} /> Duel
          </h1>
          <p>
            <span className={`duel-badge ${phase}`}>{PHASE_LABEL[phase]}</span>{" "}
            · {duel.start_date} → {duel.end_date}
          </p>
        </div>
      </header>

      <div className="duel-board">
        <Side
          login={duel.challenger_login}
          score={challengerScore}
          isWinner={winner === duel.challenger_login}
        />
        <div className="duel-vs-mark">VS</div>
        <Side
          login={duel.opponent_login ?? "—"}
          score={opponentScore}
          isWinner={winner === duel.opponent_login}
          placeholder={!duel.opponent_login}
        />
      </div>

      {winner === "tie" && (
        <p className="duel-result">
          <BIcon name="emoji-neutral" /> It&apos;s a tie!
        </p>
      )}
      {winner && winner !== "tie" && (
        <p className="duel-result">
          <BIcon name="trophy-fill" /> {winner} wins!
        </p>
      )}
      {phase === "pending" && (
        <p className="duel-result muted">
          Share the invite link to find an opponent. The duel goes live once
          someone accepts.
        </p>
      )}

      <DuelActions
        duelId={duel.id}
        canAccept={canAccept}
        canCancel={canCancel}
        inviteUrl={inviteUrl}
      />
    </main>
  );
}

function Side({
  login,
  score,
  isWinner,
  placeholder,
}: {
  login: string;
  score: number | null;
  isWinner?: boolean;
  placeholder?: boolean;
}) {
  return (
    <div className={`duel-side${isWinner ? " winner" : ""}`}>
      <div className="duel-side-name">
        {placeholder ? <em>open invite</em> : login}
      </div>
      <div className="duel-side-score">{score === null ? "—" : score}</div>
      <div className="duel-side-label">contributions</div>
    </div>
  );
}
