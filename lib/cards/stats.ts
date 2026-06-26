import type { GithubStats } from "../types";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, fmt, frame, icon, truncate } from "./svg";

const GRADES = ["C", "C+", "B", "B+", "A", "A+", "S"]; // level 1..7

// Overall stats card: total stars, contributions, followers, repos, longest
// streak — plus a rank ring (level → letter grade).
export function renderStatsCard(
  stats: Omit<GithubStats, "topRepos">,
  themeKey?: string
): string {
  const t: CardTheme = cardTheme(themeKey);
  const W = 480;
  const H = 195;
  const [open, close] = frame(W, H, t);

  const name = truncate(stats.user.name?.trim() || stats.user.login, 18, 250, true);

  const rows: { icon: string; label: string; value: string }[] = [
    { icon: "star", label: "Total Stars Earned", value: fmt(stats.totalStars) },
    { icon: "commit", label: "Total Contributions", value: fmt(stats.contributions.total) },
    { icon: "people", label: "Followers", value: fmt(stats.user.followers) },
    { icon: "repo", label: "Public Repositories", value: fmt(stats.user.publicRepos) },
    { icon: "fire", label: "Longest Streak", value: `${stats.contributions.longestStreak} days` },
  ];

  const rowSvg = rows
    .map((r, i) => {
      const y = 70 + i * 24;
      const cls = i < 2 ? "fade" : i < 4 ? "fade2" : "fade3";
      return `<g class="${cls}">
    ${icon(r.icon, 25, y - 13, t.icon, 16)}
    <text x="50" y="${y}" class="label" fill="${t.text}">${escapeXml(r.label)}</text>
    <text x="300" y="${y}" class="stat" fill="${t.text}" text-anchor="end">${escapeXml(r.value)}</text>
  </g>`;
    })
    .join("\n");

  // Rank ring (right side).
  const cx = 400;
  const cy = 108;
  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, stats.rank.level / 7);
  const offset = circ * (1 - pct);
  const grade = GRADES[Math.min(GRADES.length - 1, stats.rank.level - 1)] ?? "C";

  const ring = `<g class="fade2" transform="translate(${cx} ${cy})">
    <circle r="${r}" fill="none" stroke="${t.border}" stroke-width="7"/>
    <circle r="${r}" fill="none" stroke="${t.title}" stroke-width="7" stroke-linecap="round"
      stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
      transform="rotate(-90)"/>
    <text x="0" y="2" text-anchor="middle" class="big" fill="${t.title}">${grade}</text>
    <text x="0" y="22" text-anchor="middle" class="sub" fill="${t.text}">rank</text>
  </g>`;

  return `${open}
  <text x="25" y="38" class="card-title" fill="${t.title}">${escapeXml(name)}'s GitHub Stats</text>
${rowSvg}
${ring}
${close}`;
}
