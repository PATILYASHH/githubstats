"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GithubStats } from "@/lib/types";

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

interface Metric {
  label: string;
  a: number;
  b: number;
  display: (n: number) => string;
  higherWins?: boolean;
}

function metricsFor(a: GithubStats, b: GithubStats): Metric[] {
  return [
    { label: "Total contributions", a: a.contributions.total, b: b.contributions.total, display: fmt },
    { label: "Current streak", a: a.contributions.currentStreak, b: b.contributions.currentStreak, display: (n) => `${n}d` },
    { label: "Longest streak", a: a.contributions.longestStreak, b: b.contributions.longestStreak, display: (n) => `${n}d` },
    { label: "Active days", a: a.contributions.activeDays, b: b.contributions.activeDays, display: fmt },
    { label: "Total stars", a: a.totalStars, b: b.totalStars, display: fmt },
    { label: "Followers", a: a.user.followers, b: b.user.followers, display: fmt },
    { label: "Public repos", a: a.user.publicRepos, b: b.user.publicRepos, display: fmt },
    { label: "Dev score", a: a.rank.score, b: b.rank.score, display: fmt },
  ];
}

function CompareInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [ua, setUa] = useState(params.get("a") ?? "");
  const [ub, setUb] = useState(params.get("b") ?? "");
  const [a, setA] = useState<GithubStats | null>(null);
  const [b, setB] = useState<GithubStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchUser(name: string): Promise<GithubStats> {
    const res = await fetch(`/api/stats?username=${encodeURIComponent(name)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(`${name}: ${data.error || "failed"}`);
    return data as GithubStats;
  }

  async function run(na: string, nb: string) {
    if (!na.trim() || !nb.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [ra, rb] = await Promise.all([fetchUser(na.trim()), fetchUser(nb.trim())]);
      setA(ra);
      setB(rb);
    } catch (err) {
      setA(null);
      setB(null);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Auto-run when arriving with query params.
  useEffect(() => {
    const qa = params.get("a");
    const qb = params.get("b");
    if (qa && qb) run(qa, qb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    router.push(`/compare?a=${encodeURIComponent(ua)}&b=${encodeURIComponent(ub)}`);
    run(ua, ub);
  }

  const metrics = a && b ? metricsFor(a, b) : [];
  const aWins = metrics.filter((m) => m.a > m.b).length;
  const bWins = metrics.filter((m) => m.b > m.a).length;

  return (
    <>
      <main className="container">
        <div className="compare-hero">
          <h1>⚔️ Compare developers</h1>
          <p>See how two GitHub profiles stack up — then share the result.</p>
          <form className="compare-form" onSubmit={onSubmit}>
            <input
              value={ua}
              onChange={(e) => setUa(e.target.value)}
              placeholder="First username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <span className="compare-vs">vs</span>
            <input
              value={ub}
              onChange={(e) => setUb(e.target.value)}
              placeholder="Second username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Comparing…" : "Compare"}
            </button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>

        {a && b && (
          <div className="card compare-result">
            <div className="compare-heads">
              <CompareHead stats={a} won={aWins > bWins} wins={aWins} />
              <div className="compare-mid">vs</div>
              <CompareHead stats={b} won={bWins > aWins} wins={bWins} right />
            </div>

            <div className="compare-rows">
              {metrics.map((m) => {
                const aLead = m.a > m.b;
                const bLead = m.b > m.a;
                const max = Math.max(m.a, m.b, 1);
                return (
                  <div className="compare-row" key={m.label}>
                    <div className={`compare-cell left ${aLead ? "win" : ""}`}>
                      <span className="compare-num">{m.display(m.a)}</span>
                      <span className="compare-bar">
                        <span
                          className="compare-fill a"
                          style={{ width: `${(m.a / max) * 100}%` }}
                        />
                      </span>
                    </div>
                    <div className="compare-metric">{m.label}</div>
                    <div className={`compare-cell right ${bLead ? "win" : ""}`}>
                      <span className="compare-num">{m.display(m.b)}</span>
                      <span className="compare-bar">
                        <span
                          className="compare-fill b"
                          style={{ width: `${(m.b / max) * 100}%` }}
                        />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="compare-winner">
              {aWins === bWins
                ? "🤝 It's a tie!"
                : `🏆 ${(aWins > bWins ? a : b).user.login} wins ${Math.max(
                    aWins,
                    bWins
                  )}–${Math.min(aWins, bWins)}`}
            </div>
            <span className="card-mark">githubstatss.vercel.app</span>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          <a href="/">← Back to GitHubStats</a>
        </p>
      </footer>
    </>
  );
}

function CompareHead({
  stats,
  won,
  wins,
  right,
}: {
  stats: GithubStats;
  won: boolean;
  wins: number;
  right?: boolean;
}) {
  return (
    <div className={`compare-head ${right ? "right" : ""} ${won ? "won" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={stats.user.avatarUrl} alt="" />
      <div className="compare-head-id">
        <div className="compare-head-name">{stats.user.name || stats.user.login}</div>
        <div className="compare-head-handle">@{stats.user.login}</div>
        <div className="compare-head-rank" style={{ color: stats.rank.color }}>
          {stats.rank.emoji} {stats.rank.title}
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<main className="container" />}>
      <CompareInner />
    </Suspense>
  );
}
