import type { GithubStats } from "./types";

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  unlocked: boolean;
}

export function getAchievements(stats: GithubStats): Achievement[] {
  const c = stats.contributions;
  const ageYears = c.accountAgeDays / 365.25;
  const langs = stats.languages.length;

  const defs: Omit<Achievement, "unlocked">[] = [
    { id: "first", icon: "🌟", title: "First Steps", desc: "Made your first contributions" },
    { id: "centurion", icon: "💯", title: "Centurion", desc: "100+ total contributions" },
    { id: "1k", icon: "🔥", title: "1K Club", desc: "1,000+ contributions" },
    { id: "10k", icon: "🚀", title: "10K Club", desc: "10,000+ contributions" },
    { id: "streak30", icon: "📅", title: "Consistent", desc: "30+ day streak" },
    { id: "streak100", icon: "⚡", title: "Streak Master", desc: "100+ day streak" },
    { id: "active365", icon: "🗓️", title: "Year of Code", desc: "365+ active days" },
    { id: "polyglot", icon: "🌐", title: "Polyglot", desc: "5+ languages used" },
    { id: "stars100", icon: "⭐", title: "Star Collector", desc: "100+ stars earned" },
    { id: "stars1k", icon: "✨", title: "Star Magnet", desc: "1,000+ stars earned" },
    { id: "followers100", icon: "👥", title: "Influencer", desc: "100+ followers" },
    { id: "veteran", icon: "🎂", title: "Veteran", desc: "5+ years on GitHub" },
    { id: "prolific", icon: "📦", title: "Prolific", desc: "20+ public repos" },
  ];

  const unlocked: Record<string, boolean> = {
    first: c.total > 0,
    centurion: c.total >= 100,
    "1k": c.total >= 1000,
    "10k": c.total >= 10000,
    streak30: c.longestStreak >= 30,
    streak100: c.longestStreak >= 100,
    active365: c.activeDays >= 365,
    polyglot: langs >= 5,
    stars100: stats.totalStars >= 100,
    stars1k: stats.totalStars >= 1000,
    followers100: stats.user.followers >= 100,
    veteran: ageYears >= 5,
    prolific: stats.user.publicRepos >= 20,
  };

  return defs
    .map((d) => ({ ...d, unlocked: !!unlocked[d.id] }))
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
}
