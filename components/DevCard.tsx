"use client";

import { useMemo, useState } from "react";
import type { ContribDay, GithubStats } from "@/lib/types";
import ShareCard from "./ShareCard";
import MiniHeatmap from "./MiniHeatmap";
import AnimatedNumber from "./AnimatedNumber";
import { FireIcon, GraphIcon, StarIcon } from "./icons";

const THEMES = [
  { id: "default", label: "Dark", className: "" },
  { id: "midnight", label: "Midnight", className: "theme-midnight" },
  { id: "ocean", label: "Ocean", className: "theme-ocean" },
  { id: "forest", label: "Forest", className: "theme-forest" },
  { id: "sunset", label: "Sunset", className: "theme-sunset" },
];

const ALL = "all";

function longestStreakOf(days: ContribDay[]): number {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.count > 0) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }
  return longest;
}

export default function DevCard({ stats }: { stats: GithubStats }) {
  const { user, contributions: c, rank, funFacts } = stats;
  const [theme, setTheme] = useState(THEMES[0]);
  const [year, setYear] = useState<string>(ALL);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const d of c.days) set.add(d.date.slice(0, 4));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [c.days]);

  const scoped = useMemo(
    () => (year === ALL ? c.days : c.days.filter((d) => d.date.startsWith(year))),
    [c.days, year]
  );

  const isAll = year === ALL;
  const contribs = isAll ? c.total : scoped.reduce((a, d) => a + d.count, 0);
  const activeDays = scoped.filter((d) => d.count > 0).length;
  const trackedDays = scoped.length;
  const activePct =
    trackedDays > 0 ? Math.round((activeDays / trackedDays) * 100) : 0;
  const streakVal = isAll ? c.currentStreak : longestStreakOf(scoped);
  const streakLabel = isAll ? "current streak" : "best streak";

  return (
    <ShareCard
      title="Dev Card"
      icon={<GraphIcon />}
      filename={`${user.login}-devcard${isAll ? "" : `-${year}`}`}
      className={`devcard span-all ${theme.className}`}
    >
      <div className="devcard-top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="devcard-avatar" src={user.avatarUrl} alt="" />
        <div className="devcard-id">
          <div className="devcard-name">{user.name || user.login}</div>
          <div className="devcard-handle">@{user.login}</div>
        </div>
        <div className="devcard-rank" style={{ borderColor: rank.color }}>
          <span className="devcard-rank-emoji">{rank.emoji}</span>
          <span className="devcard-rank-text">
            <span className="devcard-rank-title" style={{ color: rank.color }}>
              {rank.title}
            </span>
            <span className="devcard-rank-blurb">Lv.{rank.level} · {rank.blurb}</span>
          </span>
        </div>
      </div>

      <div className="devcard-yearbar">
        <span className="devcard-scope">
          {isAll ? "All-time stats" : `${year} stats`}
        </span>
        <select
          className="year-select"
          data-exclude="true"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Select year"
        >
          <option value={ALL}>All time</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="devcard-stats">
        <Stat
          icon={<GraphIcon />}
          value={<AnimatedNumber value={contribs} />}
          label="contributions"
        />
        <Stat
          icon={<FireIcon />}
          value={<AnimatedNumber value={streakVal} suffix="d" />}
          label={streakLabel}
        />
        <Stat
          icon={<StarIcon />}
          value={<AnimatedNumber value={stats.totalStars} />}
          label="stars"
        />
        <Stat
          value={<AnimatedNumber value={activePct} suffix="%" />}
          label="active days"
        />
      </div>

      <MiniHeatmap days={scoped} weeks={isAll ? 30 : 53} />

      {(funFacts.bestWeekday || funFacts.busiestMonth) && (
        <div className="devcard-facts">
          {funFacts.bestWeekday && (
            <span>🗓️ Most active on <strong>{funFacts.bestWeekday}s</strong></span>
          )}
          {funFacts.busiestMonth && (
            <span>🔥 Busiest in <strong>{funFacts.busiestMonth}</strong></span>
          )}
          <span>⚡ Longest streak <strong>{c.longestStreak}d</strong></span>
        </div>
      )}

      <div className="devcard-themes" data-exclude="true">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={`devcard-swatch ${t.className || "swatch-default"} ${
              theme.id === t.id ? "active" : ""
            }`}
            title={t.label}
            aria-label={`${t.label} theme`}
            onClick={() => setTheme(t)}
          />
        ))}
      </div>
    </ShareCard>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon?: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="devcard-stat">
      <div className="devcard-stat-value">{value}</div>
      <div className="devcard-stat-label">
        {icon}
        {label}
      </div>
    </div>
  );
}
