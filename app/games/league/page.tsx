import type { Metadata } from "next";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import RefreshStatsButton from "@/components/RefreshStatsButton";
import GamesNotConfigured from "@/components/GamesNotConfigured";
import LeaderboardControls from "@/components/LeaderboardControls";
import LocationEditor from "@/components/LocationEditor";
import { BIcon } from "@/components/icons";
import type {
  LeaderboardRow,
  LeaderPeriod,
  LeaderScope,
} from "@/lib/games/types";

export const metadata: Metadata = {
  title: "Rankings — global, country & city leaderboards",
  description:
    "Rank every developer by contributions — globally, by country or by your city, over the current month, this year or all-time.",
};

export const dynamic = "force-dynamic";

const MEDAL = ["#e3b341", "#c0c5cc", "#cd7f32"]; // gold, silver, bronze
const PERIODS: LeaderPeriod[] = ["month", "year", "all"];
const SCOPES: LeaderScope[] = ["global", "country", "city"];

function fmt(n: number): string {
  return Number(n ?? 0).toLocaleString("en-US");
}

export default async function RankingsLeague({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isSupabaseConfigured()) return <GamesNotConfigured />;

  const sp = await searchParams;
  const period = (PERIODS.includes(sp.period as LeaderPeriod)
    ? sp.period
    : "year") as LeaderPeriod;
  const scope = (SCOPES.includes(sp.scope as LeaderScope)
    ? sp.scope
    : "global") as LeaderScope;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const myId = user?.id;

  // Viewer's resolved location — needed for the country/city boards + editor.
  let myCity: string | null = null;
  let myCountry: string | null = null;
  if (user) {
    const { data: me } = await supabase
      .from("user_stats")
      .select("city, country")
      .eq("user_id", user.id)
      .maybeSingle();
    myCity = (me?.city as string | null) ?? null;
    myCountry = (me?.country as string | null) ?? null;
  }

  const year = new Date().getUTCFullYear();
  // A scoped board needs the viewer's location to filter by.
  const locked =
    (scope === "country" && !myCountry) ||
    (scope === "city" && (!myCountry || !myCity));

  let rows: LeaderboardRow[] = [];
  let myRank = 0;
  let myTotal = 0;
  if (!locked) {
    const args = {
      p_period: period,
      p_scope: scope,
      p_country: scope === "global" ? null : myCountry,
      p_city: scope === "city" ? myCity : null,
    };
    const { data } = await supabase.rpc("leaderboard", { ...args, p_limit: 100 });
    rows = (data ?? []) as LeaderboardRow[];

    if (user) {
      const { data: rk } = await supabase.rpc("leaderboard_rank", {
        p_user_id: user.id,
        ...args,
      });
      const r = Array.isArray(rk) ? rk[0] : rk;
      myRank = Number(r?.rank ?? 0);
      myTotal = Number(r?.total ?? 0);
    }
  }

  const scopeLabel =
    scope === "global"
      ? "Global"
      : scope === "country"
      ? myCountry ?? "your country"
      : myCity ?? "your city";
  const periodLabel =
    period === "month"
      ? "this month"
      : period === "year"
      ? `${year}`
      : "all-time";
  // The ranked metric column header.
  const scoreHead =
    period === "month" ? "This month" : period === "year" ? String(year) : "All-time";

  return (
    <main className="container">
      <header className="games-subhero">
        <div>
          <Link href="/games" className="back-link">
            ← Games
          </Link>
          <h1>
            <BIcon name="trophy-fill" size={24} /> Rankings
          </h1>
          <p>
            Every signed-in developer, ranked by contributions. Switch between
            global, your country and your city — over the month, the year or
            all-time.
          </p>
        </div>
        {user && <RefreshStatsButton />}
      </header>

      <LeaderboardControls
        period={period}
        scope={scope}
        country={myCountry}
        city={myCity}
      />

      {user && (
        <LocationEditor
          city={myCity}
          country={myCountry}
          highlight={locked}
        />
      )}

      {myRank > 0 && (
        <div className="league-you">
          You&apos;re <strong>#{myRank}</strong> of {fmt(myTotal)} — {scopeLabel},{" "}
          {periodLabel}.
        </div>
      )}

      {locked ? (
        <div className="games-empty">
          <p>
            Set your {scope === "city" ? "city and country" : "country"} above to
            see the {scopeLabel === "your country" ? "country" : "city"} board.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="games-empty">
          <p>
            {scope === "global"
              ? "No players yet. Sign in with GitHub to enter the rankings!"
              : `No developers in ${scopeLabel} yet — invite some!`}
          </p>
        </div>
      ) : (
        <div className="lb">
          <div className="lb-head">
            <span className="lb-rank">#</span>
            <span className="lb-user">Developer</span>
            <span className="lb-num">{scoreHead}</span>
            <span className="lb-num">
              {period === "all" ? "Best streak" : "All-time"}
            </span>
            <span className="lb-num">Streak</span>
          </div>
          {rows.map((s, i) => (
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
                <span className="lb-user-id">
                  <span className="lb-name">{s.github_login}</span>
                  {scope !== "city" && (s.city || s.country) && (
                    <span className="lb-loc">
                      {[s.city, s.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </span>
              </Link>
              <span className="lb-num lb-streak">{fmt(s.score)}</span>
              <span className="lb-num">
                {period === "all" ? fmt(s.streak_longest) : fmt(s.all_time)}
              </span>
              <span className="lb-num">{fmt(s.streak_current)}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
