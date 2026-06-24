"use client";

import { useState, type FormEvent } from "react";
import type { GithubStats } from "@/lib/types";
import ShareCard from "@/components/ShareCard";
import ContributionGraph from "@/components/ContributionGraph";
import {
  GithubIcon,
  GraphIcon,
  CalendarIcon,
  FireIcon,
  CodeIcon,
  StarIcon,
  UsersIcon,
} from "@/components/icons";
import { LEVEL_COLORS } from "@/lib/colors";

const EXAMPLES = ["torvalds", "PATILYASHH", "gaearon", "sindresorhus"];

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function years(days: number): string {
  const y = days / 365.25;
  return y >= 1 ? `${y.toFixed(1)} years` : `${days} days`;
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GithubStats | null>(null);

  async function load(name: string) {
    const clean = name.trim().replace(/^@/, "");
    if (!clean) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stats?username=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load.");
      setStats(data as GithubStats);
    } catch (err) {
      setStats(null);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    load(username);
  }

  return (
    <>
      <header className="hero">
        <div className="hero-mark">
          <GithubIcon /> open source · githubstatss.vercel.app
        </div>
        <h1>
          Showcase your <span className="grad">GitHub</span> story
        </h1>
        <p>
          Enter a GitHub username to reveal contributions, account age, active
          days and top languages — then share any card as an image.
        </p>

        <form className="search" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="GitHub username, e.g. torvalds"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="GitHub username"
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Loading…" : "Get stats"}
          </button>
        </form>

        <div className="examples">
          Try:{" "}
          {EXAMPLES.map((ex, i) => (
            <span key={ex}>
              <button
                type="button"
                onClick={() => {
                  setUsername(ex);
                  load(ex);
                }}
              >
                {ex}
              </button>
              {i < EXAMPLES.length - 1 ? " · " : ""}
            </span>
          ))}
        </div>

        {error && <div className="error">{error}</div>}
      </header>

      <main className="container">
        {loading && !stats && <LoadingSkeleton />}
        {stats && <Dashboard stats={stats} />}
      </main>

      <footer className="footer">
        <p>
          Built with Next.js · Open source on{" "}
          <a
            href="https://github.com/PATILYASHH/Githubstats"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          . No login required.
        </p>
      </footer>
    </>
  );
}

function Dashboard({ stats }: { stats: GithubStats }) {
  const { user, contributions: c, languages } = stats;
  const activePct =
    c.trackedDays > 0 ? Math.round((c.activeDays / c.trackedDays) * 100) : 0;
  const handle = user.login;

  return (
    <>
      <section className="profile">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={user.avatarUrl} alt={`${handle} avatar`} />
        <div>
          <p className="name">{user.name || handle}</p>
          <a className="login" href={user.htmlUrl} target="_blank" rel="noreferrer">
            @{handle}
          </a>
          {user.bio && <p className="bio">{user.bio}</p>}
        </div>
      </section>

      <div className="grid">
        {/* Contribution graph spans full width */}
        <ShareCard
          title="Contribution graph"
          icon={<GraphIcon />}
          filename={`${handle}-contributions`}
          className="span-all"
        >
          <ContributionGraph days={c.days} />
          <div className="contrib-legend">
            <span>Less</span>
            {LEVEL_COLORS.map((color, i) => (
              <span
                key={i}
                className="contrib-cell"
                style={{ backgroundColor: color }}
              />
            ))}
            <span>More</span>
          </div>
          <div className="mini-stats">
            <Mini value={fmt(c.total)} label="total contributions" />
            <Mini value={fmt(c.activeDays)} label="active days" />
            <Mini value={`${c.longestStreak}d`} label="longest streak" />
            <Mini value={`${c.currentStreak}d`} label="current streak" />
            {c.busiestDay && (
              <Mini
                value={fmt(c.busiestDay.count)}
                label={`best day (${c.busiestDay.date})`}
              />
            )}
          </div>
        </ShareCard>

        <ShareCard
          title="Total contributions"
          icon={<GraphIcon />}
          filename={`${handle}-total`}
        >
          <div className="stat-value green">{fmt(c.total)}</div>
          <div className="stat-sub">commits, PRs, issues &amp; reviews</div>
        </ShareCard>

        <ShareCard
          title="Account age"
          icon={<CalendarIcon />}
          filename={`${handle}-age`}
        >
          <div className="stat-value">{years(c.accountAgeDays)}</div>
          <div className="stat-sub">
            since {new Date(user.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
            })}{" "}
            · {fmt(c.accountAgeDays)} days
          </div>
        </ShareCard>

        <ShareCard
          title="Active days"
          icon={<FireIcon />}
          filename={`${handle}-active`}
        >
          <div className="stat-value green">{activePct}%</div>
          <div className="stat-sub">
            {fmt(c.activeDays)} of {fmt(c.trackedDays)} tracked days had
            contributions
          </div>
        </ShareCard>

        <ShareCard
          title="Followers"
          icon={<UsersIcon />}
          filename={`${handle}-followers`}
        >
          <div className="stat-value blue">{fmt(user.followers)}</div>
          <div className="stat-sub">
            {fmt(user.following)} following · {fmt(user.publicRepos)} repos
          </div>
        </ShareCard>

        <ShareCard
          title="Total stars"
          icon={<StarIcon />}
          filename={`${handle}-stars`}
        >
          <div className="stat-value" style={{ color: "#e3b341" }}>
            {fmt(stats.totalStars)}
          </div>
          <div className="stat-sub">earned across public repositories</div>
        </ShareCard>

        {languages.length > 0 && (
          <ShareCard
            title="Top languages"
            icon={<CodeIcon />}
            filename={`${handle}-languages`}
            className="span-all"
          >
            <div className="lang-bar">
              {languages.map((l) => (
                <span
                  key={l.name}
                  style={{ width: `${l.percentage}%`, backgroundColor: l.color }}
                  title={`${l.name} ${l.percentage}%`}
                />
              ))}
            </div>
            <div className="lang-list">
              {languages.map((l) => (
                <div className="lang-item" key={l.name}>
                  <span
                    className="lang-dot"
                    style={{ backgroundColor: l.color }}
                  />
                  <span className="lang-name">{l.name}</span>
                  <span className="lang-pct">{l.percentage}%</span>
                </div>
              ))}
            </div>
          </ShareCard>
        )}
      </div>
    </>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div className="mini-stat">
      <div className="v">{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid">
      <div className="skeleton span-all" style={{ height: 180 }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 130 }} />
      ))}
    </div>
  );
}
