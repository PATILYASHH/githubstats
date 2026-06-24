import type { GithubStats } from "./types";

type CoreStats = Omit<GithubStats, "topRepos">;

function pick(lines: string[], n: number): string[] {
  return lines.slice(0, n);
}

export function getRoasts(stats: CoreStats): string[] {
  const c = stats.contributions;
  const langs = stats.languages;
  const ageYears = c.accountAgeDays / 365.25;
  const out: string[] = [];

  if (c.total > 1000 && c.currentStreak < 10) {
    out.push(
      `${c.total.toLocaleString()} contributions but a ${c.currentStreak}-day streak? Commitment issues — literally.`
    );
  }
  if (langs[0] && langs[0].percentage > 70) {
    out.push(`${langs[0].percentage}% ${langs[0].name}. We get it, you have a type.`);
  }
  if (stats.user.followers < 10) {
    out.push(`${stats.user.followers} followers — your code is a well-kept secret.`);
  }
  if (stats.user.following > stats.user.followers * 3 && stats.user.following > 20) {
    out.push(
      `Following ${stats.user.following}, followed by ${stats.user.followers}. The math is… one-sided.`
    );
  }
  if (stats.totalStars < 5) {
    out.push(`${stats.totalStars} stars. Even your repos forgot to star themselves.`);
  }
  if (ageYears > 5 && c.total < 500) {
    out.push(`${ageYears.toFixed(0)} years on GitHub for ${c.total} contributions. No rush, huh?`);
  }
  if (c.activeDays && c.total / c.activeDays < 2) {
    out.push(`Averaging under 2 contributions per active day. Pacing yourself, I see.`);
  }
  if (stats.user.publicRepos > 30 && stats.totalStars < 50) {
    out.push(`${stats.user.publicRepos} repos, ${stats.totalStars} stars. Quantity over… quantity.`);
  }

  if (out.length === 0) {
    out.push("Honestly? Hard to roast. Suspiciously solid stats. 🤨");
  }
  return pick(out, 4);
}

export function getHypes(stats: CoreStats): string[] {
  const c = stats.contributions;
  const langs = stats.languages;
  const out: string[] = [];

  if (c.total >= 1000) {
    out.push(`${c.total.toLocaleString()} contributions — that's a serious body of work. 💪`);
  } else if (c.total > 0) {
    out.push(`${c.total.toLocaleString()} contributions and just getting started. 🌱`);
  }
  if (c.longestStreak >= 30) {
    out.push(`A ${c.longestStreak}-day streak? That's elite discipline. 🔥`);
  }
  if (langs.length >= 5) {
    out.push(`${langs.length} languages — a true polyglot. 🧠`);
  }
  if (stats.totalStars >= 100) {
    out.push(`${stats.totalStars.toLocaleString()} stars earned. People love what you build. ⭐`);
  }
  if (stats.user.followers >= 50) {
    out.push(`${stats.user.followers.toLocaleString()} followers — you've built an audience. 👑`);
  }
  if (c.activeDays >= 300) {
    out.push(`${c.activeDays.toLocaleString()} active days. You show up. Every. Time. 🗓️`);
  }

  if (out.length === 0) {
    out.push("Every legend starts somewhere — keep shipping! 🚀");
  }
  return pick(out, 4);
}
