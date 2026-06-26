import type { ContribDay, GithubStats } from "../types";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, fmt, frame } from "./svg";

interface Range {
  len: number;
  start: string | null;
  end: string | null;
}

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Recompute streak ranges (start/end dates) from the daily series — the core
// stats only carry the lengths.
function streakRanges(days: ContribDay[]): {
  total: number;
  current: Range;
  longest: Range;
  firstYear: number | null;
} {
  let total = 0;
  let longest: Range = { len: 0, start: null, end: null };
  let runLen = 0;
  let runStart: string | null = null;

  for (const d of days) {
    total += d.count;
    if (d.count > 0) {
      if (runLen === 0) runStart = d.date;
      runLen++;
      if (runLen > longest.len) {
        longest = { len: runLen, start: runStart, end: d.date };
      }
    } else {
      runLen = 0;
    }
  }

  // Current streak: walk back from today.
  const todayStr = new Date().toISOString().slice(0, 10);
  let i = days.length - 1;
  while (i >= 0 && days[i].date > todayStr) i--;
  const current: Range = { len: 0, start: null, end: null };
  for (; i >= 0; i--) {
    if (days[i].count > 0) {
      if (current.len === 0) current.end = days[i].date;
      current.len++;
      current.start = days[i].date;
    } else if (current.len === 0 && days[i].date === todayStr) {
      continue; // today empty — keep counting from yesterday
    } else {
      break;
    }
  }

  const firstYear = days.length
    ? new Date(days[0].date + "T00:00:00").getFullYear()
    : null;

  return { total, current, longest, firstYear };
}

// Streak card: total contributions · current streak (ring) · longest streak.
export function renderStreakCard(
  stats: Omit<GithubStats, "topRepos">,
  themeKey?: string
): string {
  const t: CardTheme = cardTheme(themeKey);
  const W = 480;
  const H = 195;
  const [open, close] = frame(W, H, t);

  const { total, current, longest, firstYear } = streakRanges(
    stats.contributions.days
  );
  const yearLabel = firstYear ? `${firstYear} – Present` : "All time";

  const col = (
    x: number,
    big: string,
    label: string,
    sub: string,
    cls: string
  ) => `<g class="${cls}">
    <text x="${x}" y="78" text-anchor="middle" class="big" fill="${t.text}">${escapeXml(big)}</text>
    <text x="${x}" y="108" text-anchor="middle" class="stat" fill="${t.title}">${escapeXml(label)}</text>
    <text x="${x}" y="132" text-anchor="middle" class="sub" fill="${t.text}">${escapeXml(sub)}</text>
  </g>`;

  // Center current-streak ring.
  const cx = 240;
  const cy = 78;
  const r = 44;
  const ring = `<g class="fade2">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.accent}" stroke-width="5"/>
    <text x="${cx}" y="${cy + 9}" text-anchor="middle" class="big" fill="${t.accent}">${current.len}</text>
    <text x="${cx}" y="${cy + 56}" text-anchor="middle" class="stat" fill="${t.title}">Current Streak</text>
    <text x="${cx}" y="${cy + 78}" text-anchor="middle" class="sub" fill="${t.text}">${escapeXml(
      current.len ? `${shortDate(current.start)} – ${shortDate(current.end)}` : "Start one today"
    )}</text>
  </g>`;

  return `${open}
  ${col(120, fmt(total), "Total Contributions", yearLabel, "fade")}
  <line x1="178" y1="48" x2="178" y2="150" stroke="${t.border}"/>
  ${ring}
  <line x1="302" y1="48" x2="302" y2="150" stroke="${t.border}"/>
  ${col(
    380,
    String(longest.len),
    "Longest Streak",
    longest.len ? `${shortDate(longest.start)} – ${shortDate(longest.end)}` : "—",
    "fade3"
  )}
${close}`;
}
