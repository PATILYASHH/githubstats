import type { GithubStats } from "../types";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, fmt, frame, icon, truncate } from "./svg";

const GRADES = ["C", "C+", "B", "B+", "A", "A+", "S"]; // level 1..7

// Overall stats card: stars, contributions, followers, repos, longest streak —
// plus an animated rank ring (level → letter grade).
export function renderStatsCard(
  stats: Omit<GithubStats, "topRepos">,
  themeKey?: string
): string {
  const t: CardTheme = cardTheme(themeKey);
  const W = 480;
  const H = 200;
  const [open, close] = frame(W, H, t);

  const name = truncate(stats.user.name?.trim() || stats.user.login, 18, 230, true);

  const rows: { icon: string; label: string; value: string }[] = [
    { icon: "star", label: "Total Stars Earned", value: fmt(stats.totalStars) },
    { icon: "commit", label: "Total Contributions", value: fmt(stats.contributions.total) },
    { icon: "people", label: "Followers", value: fmt(stats.user.followers) },
    { icon: "repo", label: "Public Repositories", value: fmt(stats.user.publicRepos) },
    { icon: "fire", label: "Longest Streak", value: `${stats.contributions.longestStreak} days` },
  ];

  const rowSvg = rows
    .map((r, i) => {
      const y = 78 + i * 23;
      return `<g class="r${i + 1}">
    <circle cx="33" cy="${y - 5}" r="13" fill="${t.icon}" fill-opacity="0.16"/>
    ${icon(r.icon, 25, y - 13, t.icon, 16)}
    <text x="54" y="${y}" class="label" fill="${t.text}">${escapeXml(r.label)}</text>
    <text x="312" y="${y}" class="stat" fill="${t.text}" text-anchor="end">${escapeXml(r.value)}</text>
  </g>`;
    })
    .join("\n");

  // Animated rank ring (draws in; static fallback shows the final arc).
  const cx = 398;
  const cy = 112;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, stats.rank.level / 7);
  const offset = circ * (1 - pct);
  const grade = GRADES[Math.min(GRADES.length - 1, stats.rank.level - 1)] ?? "C";

  const ring = `<g transform="translate(${cx} ${cy})">
    <circle r="${r}" fill="none" stroke="${t.border}" stroke-width="8"/>
    <circle r="${r}" fill="none" stroke="url(#accent)" stroke-width="8" stroke-linecap="round"
      filter="url(#glow)" transform="rotate(-90)"
      stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}">
      <animate attributeName="stroke-dashoffset" from="${circ.toFixed(2)}" to="${offset.toFixed(
        2
      )}" dur="1.3s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.8 0.2 1"/>
    </circle>
    <text x="0" y="4" text-anchor="middle" class="big pop" fill="url(#accent)">${grade}</text>
    <text x="0" y="24" text-anchor="middle" class="sub" fill="${t.text}">rank</text>
  </g>`;

  return `${open}
  <text x="24" y="40" class="title" fill="url(#accent)">${escapeXml(name)}'s GitHub Stats</text>
${rowSvg}
${ring}
${close}`;
}
