import type { ContribDay, GithubStats } from "../types";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, fmt, frame, icon } from "./svg";

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
      if (runLen > longest.len) longest = { len: runLen, start: runStart, end: d.date };
    } else {
      runLen = 0;
    }
  }

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
      continue;
    } else {
      break;
    }
  }

  const firstYear = days.length
    ? new Date(days[0].date + "T00:00:00").getFullYear()
    : null;
  return { total, current, longest, firstYear };
}

// Streak card: total contributions · current streak (animated ring) · longest.
export function renderStreakCard(
  stats: Omit<GithubStats, "topRepos">,
  themeKey?: string
): string {
  const t: CardTheme = cardTheme(themeKey);
  const W = 480;
  const H = 200;
  const [open, close] = frame(W, H, t);

  const { total, current, longest, firstYear } = streakRanges(stats.contributions.days);
  const yearLabel = firstYear ? `${firstYear} – Present` : "All time";

  const col = (x: number, big: string, label: string, sub: string, cls: string) =>
    `<g class="${cls}">
    <text x="${x}" y="86" text-anchor="middle" class="big" fill="${t.text}">${escapeXml(big)}</text>
    <text x="${x}" y="114" text-anchor="middle" class="stat" fill="${t.title}">${escapeXml(label)}</text>
    <text x="${x}" y="138" text-anchor="middle" class="sub" fill="${t.text}">${escapeXml(sub)}</text>
  </g>`;

  const cx = 240;
  const cy = 84;
  const r = 46;
  const circ = 2 * Math.PI * r;
  const ring = `<g class="r3">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.border}" stroke-width="5"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#accent)" stroke-width="5"
      stroke-linecap="round" filter="url(#glow)" transform="rotate(-90 ${cx} ${cy})"
      stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="0">
      <animate attributeName="stroke-dashoffset" from="${circ.toFixed(
        2
      )}" to="0" dur="1.4s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.8 0.2 1"/>
    </circle>
    <g class="pop">${icon("fire", cx - 9, cy - 47, t.accent, 18)}</g>
    <text x="${cx}" y="${cy + 11}" text-anchor="middle" class="huge" fill="${t.accent}">${current.len}</text>
    <text x="${cx}" y="${cy + 58}" text-anchor="middle" class="stat" fill="${t.title}">Current Streak</text>
    <text x="${cx}" y="${cy + 80}" text-anchor="middle" class="sub" fill="${t.text}">${escapeXml(
      current.len ? `${shortDate(current.start)} – ${shortDate(current.end)}` : "Start one today"
    )}</text>
  </g>`;

  return `${open}
  ${col(118, fmt(total), "Total Contributions", yearLabel, "r1")}
  <rect x="176" y="48" width="1.5" height="104" fill="url(#accent)" opacity="0.5"/>
  ${ring}
  <rect x="303" y="48" width="1.5" height="104" fill="url(#accent)" opacity="0.5"/>
  ${col(
    382,
    String(longest.len),
    "Longest Streak",
    longest.len ? `${shortDate(longest.start)} – ${shortDate(longest.end)}` : "—",
    "r5"
  )}
${close}`;
}
