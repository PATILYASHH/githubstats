import type { ContribDay, FunFacts, Rank } from "./types";

interface RankInput {
  totalContributions: number;
  totalStars: number;
  followers: number;
  longestStreak: number;
  activeDays: number;
}

const TIERS = [
  { min: 0, title: "Code Explorer", emoji: "🌱", color: "#3fb950", blurb: "Just getting started" },
  { min: 250, title: "Rising Dev", emoji: "🚀", color: "#58a6ff", blurb: "Building real momentum" },
  { min: 1000, title: "Committed Coder", emoji: "💪", color: "#a371f7", blurb: "Showing up consistently" },
  { min: 3000, title: "Code Ninja", emoji: "🥷", color: "#f778ba", blurb: "Serious, steady output" },
  { min: 7500, title: "Code Wizard", emoji: "🧙", color: "#e3b341", blurb: "A prolific contributor" },
  { min: 20000, title: "Open-Source Hero", emoji: "🦸", color: "#ff7b72", blurb: "Major community impact" },
  { min: 50000, title: "Open-Source Legend", emoji: "🏆", color: "#ffd33d", blurb: "Truly legendary" },
];

// A playful, transparent score — not an official GitHub metric.
export function computeRank(input: RankInput): Rank {
  const score = Math.round(
    input.totalContributions +
      input.totalStars * 5 +
      input.followers * 3 +
      input.longestStreak * 8 +
      input.activeDays
  );

  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (score >= TIERS[i].min) idx = i;
  }
  const t = TIERS[idx];
  return {
    title: t.title,
    emoji: t.emoji,
    level: idx + 1,
    score,
    color: t.color,
    blurb: t.blurb,
  };
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function computeFunFacts(days: ContribDay[]): FunFacts {
  if (days.length === 0) return { bestWeekday: null, busiestMonth: null };

  const byWeekday = new Array(7).fill(0);
  const byMonth = new Map<string, number>();

  for (const d of days) {
    const date = new Date(d.date + "T00:00:00");
    byWeekday[date.getDay()] += d.count;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + d.count);
  }

  const bestDayIdx = byWeekday.indexOf(Math.max(...byWeekday));
  const bestWeekday = byWeekday[bestDayIdx] > 0 ? WEEKDAYS[bestDayIdx] : null;

  let busiestMonth: string | null = null;
  let maxMonth = 0;
  for (const [key, count] of byMonth) {
    if (count > maxMonth) {
      maxMonth = count;
      const [y, m] = key.split("-");
      busiestMonth = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
        "en-US",
        { month: "long", year: "numeric" }
      );
    }
  }

  return { bestWeekday, busiestMonth };
}

// Total contributions per weekday (index 0 = Sunday … 6 = Saturday).
export function computeWeekdayHistogram(days: ContribDay[]): number[] {
  const hist = new Array(7).fill(0);
  for (const d of days) {
    hist[new Date(d.date + "T00:00:00").getDay()] += d.count;
  }
  return hist;
}
