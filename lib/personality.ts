import type { GithubStats } from "./types";

export interface Trait {
  label: string;
  value: number; // 0..100
}

export interface Personality {
  type: string;
  emoji: string;
  tagline: string;
  color: string;
  traits: Trait[];
}

type CoreStats = Omit<GithubStats, "topRepos">;

export function computePersonality(stats: CoreStats): Personality {
  const c = stats.contributions;

  const consistency = c.trackedDays
    ? Math.round((c.activeDays / c.trackedDays) * 100)
    : 0;

  const hist = stats.weekdayHistogram;
  const histTotal = hist.reduce((a, b) => a + b, 0) || 1;
  const weekend = Math.round(((hist[0] + hist[6]) / histTotal) * 100);

  const diversity = Math.min(100, stats.languages.length * 14);

  const social = Math.min(
    100,
    Math.round((Math.log10(stats.user.followers + 1) / 4) * 100)
  ); // ~10k followers -> 100

  const dedication = Math.min(100, Math.round((c.longestStreak / 200) * 100));

  const perActive = c.activeDays ? c.total / c.activeDays : 0;
  const intensity = Math.min(100, Math.round((perActive / 12) * 100));

  const traits: Trait[] = [
    { label: "Consistency", value: consistency },
    { label: "Intensity", value: intensity },
    { label: "Diversity", value: diversity },
    { label: "Social", value: social },
    { label: "Dedication", value: dedication },
  ];

  const ageYears = c.accountAgeDays / 365.25;

  let type = "The All-Rounder";
  let emoji = "🎯";
  let tagline = "Balanced across the board — a bit of everything.";
  let color = "#58a6ff";

  if (dedication >= 60 || consistency >= 65) {
    type = "The Marathoner";
    emoji = "🏃";
    tagline = "Steady, relentless, always shipping.";
    color = "#39d353";
  } else if (intensity >= 65) {
    type = "The Sprinter";
    emoji = "⚡";
    tagline = "Big bursts of focused, explosive output.";
    color = "#e3b341";
  } else if (diversity >= 70) {
    type = "The Polyglot Explorer";
    emoji = "🧭";
    tagline = "Never met a language you wouldn't try.";
    color = "#bc8cff";
  } else if (social >= 55) {
    type = "The Open-Source Star";
    emoji = "🌟";
    tagline = "The community knows your name.";
    color = "#ffd33d";
  } else if (weekend >= 38) {
    type = "The Weekend Builder";
    emoji = "🛠️";
    tagline = "Weekends are for shipping side projects.";
    color = "#ff7b72";
  } else if (ageYears < 2) {
    type = "The Rising Star";
    emoji = "🚀";
    tagline = "New on the scene and climbing fast.";
    color = "#58a6ff";
  }

  return { type, emoji, tagline, color, traits };
}
