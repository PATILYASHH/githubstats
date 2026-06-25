import type { UserStats } from "./types";

export type Difficulty = "easy" | "medium" | "hard" | "insane";

export interface Challenge {
  id: string;
  title: string;
  desc: string; // what to do to achieve it
  icon: string; // bootstrap icon name
  difficulty: Difficulty;
  target: number;
  // The user's current value toward the target (from their snapshot).
  value: (s: UserStats) => number;
}

export const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  easy: "#39d353",
  medium: "#58a6ff",
  hard: "#bc8cff",
  insane: "#e3b341",
};

// Hard, concrete goals computed from a user's snapshot. "Achieved" = value >= target.
export const CHALLENGES: Challenge[] = [
  {
    id: "centurion",
    title: "Centurion",
    desc: "Make 100 total contributions.",
    icon: "lightning-charge-fill",
    difficulty: "easy",
    target: 100,
    value: (s) => s.contributions_total,
  },
  {
    id: "month-of-fire",
    title: "Month of Fire",
    desc: "Reach a 30-day contribution streak (longest streak counts).",
    icon: "fire",
    difficulty: "medium",
    target: 30,
    value: (s) => s.streak_longest,
  },
  {
    id: "1k-club",
    title: "1K Club",
    desc: "Make 1,000 total contributions.",
    icon: "stars",
    difficulty: "medium",
    target: 1000,
    value: (s) => s.contributions_total,
  },
  {
    id: "year-of-code",
    title: "Year of Code",
    desc: "Make 2,000 contributions in the last 365 days.",
    icon: "calendar-heart-fill",
    difficulty: "hard",
    target: 2000,
    value: (s) => s.contributions_year,
  },
  {
    id: "century-streak",
    title: "Century Streak",
    desc: "Reach a 100-day contribution streak.",
    icon: "fire",
    difficulty: "hard",
    target: 100,
    value: (s) => s.streak_longest,
  },
  {
    id: "grinder",
    title: "The Grinder",
    desc: "Make 5,000 total contributions.",
    icon: "hammer",
    difficulty: "hard",
    target: 5000,
    value: (s) => s.contributions_total,
  },
  {
    id: "marathoner",
    title: "Marathoner",
    desc: "Reach a 365-day contribution streak. A full year, no gaps.",
    icon: "trophy-fill",
    difficulty: "insane",
    target: 365,
    value: (s) => s.streak_longest,
  },
  {
    id: "10k-legend",
    title: "10K Legend",
    desc: "Make 10,000 total contributions.",
    icon: "gem",
    difficulty: "insane",
    target: 10000,
    value: (s) => s.contributions_total,
  },
];

export function isAchieved(c: Challenge, s: UserStats): boolean {
  return c.value(s) >= c.target;
}
