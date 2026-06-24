"use client";

import type { GithubStats } from "@/lib/types";
import ShareCard from "@/components/ShareCard";
import ContributionGraph from "@/components/ContributionGraph";
import ActivityBreakdown from "@/components/ActivityBreakdown";
import DevCard from "@/components/DevCard";
import AnimatedNumber from "@/components/AnimatedNumber";
import {
  GraphIcon,
  CalendarIcon,
  FireIcon,
  CodeIcon,
  StarIcon,
  UsersIcon,
  RepoIcon,
  BarsIcon,
} from "@/components/icons";
import { LEVEL_COLORS, colorForLanguage } from "@/lib/colors";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

export default function Dashboard({ stats }: { stats: GithubStats }) {
  const { user, contributions: c, languages, topRepos } = stats;
  const activePct =
    c.trackedDays > 0 ? Math.round((c.activeDays / c.trackedDays) * 100) : 0;
  const handle = user.login;
  const ageYears = c.accountAgeDays / 365.25;

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
        <DevCard stats={stats} />

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
          title="Contribution breakdown"
          icon={<BarsIcon />}
          filename={`${handle}-breakdown`}
          className="span-all"
        >
          <ActivityBreakdown days={c.days} />
        </ShareCard>

        <ShareCard
          title="Total contributions"
          icon={<GraphIcon />}
          filename={`${handle}-total`}
        >
          <div className="stat-value green">
            <AnimatedNumber value={c.total} />
          </div>
          <div className="stat-sub">commits, PRs, issues &amp; reviews</div>
        </ShareCard>

        <ShareCard
          title="Account age"
          icon={<CalendarIcon />}
          filename={`${handle}-age`}
        >
          <div className="stat-value">
            {ageYears >= 1 ? (
              <>
                <AnimatedNumber
                  value={ageYears}
                  format={(n) => n.toFixed(1)}
                />{" "}
                yrs
              </>
            ) : (
              <AnimatedNumber value={c.accountAgeDays} suffix=" days" />
            )}
          </div>
          <div className="stat-sub">
            since{" "}
            {new Date(user.createdAt).toLocaleDateString("en-US", {
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
          <div className="stat-value green">
            <AnimatedNumber value={activePct} suffix="%" />
          </div>
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
          <div className="stat-value blue">
            <AnimatedNumber value={user.followers} />
          </div>
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
            <AnimatedNumber value={stats.totalStars} />
          </div>
          <div className="stat-sub">earned across public repositories</div>
        </ShareCard>

        {topRepos.items.length > 0 && (
          <ShareCard
            title="Top repositories"
            icon={<RepoIcon />}
            filename={`${handle}-top-repos`}
            className="span-all"
          >
            <p className="repos-sub">
              {topRepos.source === "all-time"
                ? "Ranked by your all-time commits"
                : "Ranked by recent public push activity (set GITHUB_TOKEN for all-time commits)"}
            </p>
            <ol className="repo-list">
              {topRepos.items.map((r, i) => {
                const max = topRepos.items[0].contributions || 1;
                return (
                  <li className="repo-row" key={r.name}>
                    <span className={`repo-rank ${i === 0 ? "top" : ""}`}>
                      {i + 1}
                    </span>
                    <div className="repo-main">
                      <a
                        className="repo-name"
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {r.name}
                      </a>
                      <span className="repo-track">
                        <span
                          className="repo-fill animate-bar"
                          style={{
                            width: `${Math.max(
                              (r.contributions / max) * 100,
                              3
                            )}%`,
                          }}
                        />
                      </span>
                    </div>
                    <div className="repo-meta">
                      <span className="repo-commits">
                        {fmt(r.contributions)}{" "}
                        {topRepos.source === "all-time" ? "commits" : "pushes"}
                      </span>
                      {r.language && (
                        <span className="repo-lang">
                          <span
                            className="lang-dot"
                            style={{
                              backgroundColor: colorForLanguage(r.language),
                            }}
                          />
                          {r.language}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </ShareCard>
        )}

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
                  <span className="lang-dot" style={{ backgroundColor: l.color }} />
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
