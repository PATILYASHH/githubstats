import type { GithubStats } from "./types";

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  icon: string; // key into the icon registry
  title: string;
  desc: string;
  rarity: Rarity;
  unlocked: boolean;
  current: number;
  target: number;
}

export const RARITY_COLORS: Record<Rarity, { ring: string; glow: string }> = {
  common: { ring: "#56d364", glow: "rgba(86,211,100,0.45)" },
  rare: { ring: "#58a6ff", glow: "rgba(88,166,255,0.45)" },
  epic: { ring: "#bc8cff", glow: "rgba(188,140,255,0.5)" },
  legendary: { ring: "#e3b341", glow: "rgba(227,179,65,0.55)" },
};

// Emoji per icon key — used in OG images (emojis render reliably in next/og).
export const ICON_EMOJI: Record<string, string> = {
  rocket: "🚀",
  lightning: "⚡",
  fire: "🔥",
  gem: "💎",
  calendar: "📅",
  trophy: "🏆",
  graph: "📈",
  award: "🏅",
  code: "💻",
  star: "⭐",
  people: "👥",
  repo: "📦",
  heart: "❤️",
  bookmark: "🔖",
  bullseye: "🎯",
};

type CoreStats = Omit<GithubStats, "topRepos">;

interface Def {
  id: string;
  icon: string;
  title: string;
  desc: string;
  rarity: Rarity;
  target: number;
  value: (s: CoreStats) => number;
}

const DEFS: Def[] = [
  { id: "first", icon: "rocket", title: "First Steps", desc: "Make your first contribution", rarity: "common", target: 1, value: (s) => s.contributions.total },
  { id: "centurion", icon: "lightning", title: "Centurion", desc: "Reach 100 contributions", rarity: "common", target: 100, value: (s) => s.contributions.total },
  { id: "1k", icon: "fire", title: "1K Club", desc: "Reach 1,000 contributions", rarity: "rare", target: 1000, value: (s) => s.contributions.total },
  { id: "5k", icon: "fire", title: "5K Grinder", desc: "Reach 5,000 contributions", rarity: "epic", target: 5000, value: (s) => s.contributions.total },
  { id: "10k", icon: "gem", title: "10K Legend", desc: "Reach 10,000 contributions", rarity: "legendary", target: 10000, value: (s) => s.contributions.total },

  { id: "streak30", icon: "calendar", title: "Consistent", desc: "Hit a 30-day streak", rarity: "rare", target: 30, value: (s) => s.contributions.longestStreak },
  { id: "streak100", icon: "lightning", title: "Streak Master", desc: "Hit a 100-day streak", rarity: "epic", target: 100, value: (s) => s.contributions.longestStreak },
  { id: "streak365", icon: "trophy", title: "Unstoppable", desc: "Hit a 365-day streak", rarity: "legendary", target: 365, value: (s) => s.contributions.longestStreak },

  { id: "active365", icon: "graph", title: "Year of Code", desc: "Log 365 active days", rarity: "rare", target: 365, value: (s) => s.contributions.activeDays },
  { id: "active1000", icon: "award", title: "Dedicated", desc: "Log 1,000 active days", rarity: "epic", target: 1000, value: (s) => s.contributions.activeDays },

  { id: "polyglot", icon: "code", title: "Polyglot", desc: "Use 5+ languages", rarity: "rare", target: 5, value: (s) => s.languages.length },
  { id: "hyperpolyglot", icon: "code", title: "Hyperpolyglot", desc: "Use 8+ languages", rarity: "epic", target: 8, value: (s) => s.languages.length },

  { id: "stars100", icon: "star", title: "Star Collector", desc: "Earn 100 stars", rarity: "rare", target: 100, value: (s) => s.totalStars },
  { id: "stars1k", icon: "star", title: "Star Magnet", desc: "Earn 1,000 stars", rarity: "epic", target: 1000, value: (s) => s.totalStars },
  { id: "stars5k", icon: "gem", title: "Supernova", desc: "Earn 5,000 stars", rarity: "legendary", target: 5000, value: (s) => s.totalStars },

  { id: "followers100", icon: "people", title: "Influencer", desc: "Reach 100 followers", rarity: "rare", target: 100, value: (s) => s.user.followers },
  { id: "followers1k", icon: "people", title: "Celebrity", desc: "Reach 1,000 followers", rarity: "legendary", target: 1000, value: (s) => s.user.followers },

  { id: "veteran", icon: "bookmark", title: "Veteran", desc: "5 years on GitHub", rarity: "rare", target: 5, value: (s) => Math.floor(s.contributions.accountAgeDays / 365.25) },
  { id: "og", icon: "trophy", title: "OG Developer", desc: "10 years on GitHub", rarity: "legendary", target: 10, value: (s) => Math.floor(s.contributions.accountAgeDays / 365.25) },

  { id: "prolific", icon: "repo", title: "Prolific", desc: "Own 20 public repos", rarity: "rare", target: 20, value: (s) => s.user.publicRepos },
  { id: "sourcerer", icon: "repo", title: "Open Sourcerer", desc: "Own 50 public repos", rarity: "epic", target: 50, value: (s) => s.user.publicRepos },

  {
    id: "weekend",
    icon: "heart",
    title: "Weekend Warrior",
    desc: "Code hard on weekends (1,000+ weekend contributions)",
    rarity: "epic",
    target: 1000,
    value: (s) => (s.weekdayHistogram[0] ?? 0) + (s.weekdayHistogram[6] ?? 0),
  },
];

export function getAchievements(stats: CoreStats): Achievement[] {
  return DEFS.map((d) => {
    const current = d.value(stats);
    return {
      id: d.id,
      icon: d.icon,
      title: d.title,
      desc: d.desc,
      rarity: d.rarity,
      current,
      target: d.target,
      unlocked: current >= d.target,
    };
  }).sort((a, b) => {
    if (a.unlocked !== b.unlocked) return Number(b.unlocked) - Number(a.unlocked);
    // among locked, surface the closest-to-complete missions first
    if (!a.unlocked) return b.current / b.target - a.current / a.target;
    return 0;
  });
}

export function getAchievement(
  stats: CoreStats,
  id: string
): Achievement | undefined {
  return getAchievements(stats).find((a) => a.id === id);
}
