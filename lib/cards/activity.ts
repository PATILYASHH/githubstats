import type { ContribDay, GithubStats } from "../types";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, fmt, frame } from "./svg";

// Activity graph: contributions over the last ~30 days as a smooth area chart.
export function renderActivityCard(
  stats: Omit<GithubStats, "topRepos">,
  themeKey?: string
): string {
  const t: CardTheme = cardTheme(themeKey);
  const W = 800;
  const H = 220;
  const [open, close] = frame(W, H, t);

  const todayStr = new Date().toISOString().slice(0, 10);
  const recent: ContribDay[] = stats.contributions.days
    .filter((d) => d.date <= todayStr)
    .slice(-30);

  const padL = 30;
  const padR = 20;
  const top = 60;
  const bottom = H - 30;
  const plotW = W - padL - padR;
  const plotH = bottom - top;

  if (recent.length < 2) {
    return `${open}
  <text x="25" y="38" class="card-title" fill="${t.title}">Contribution Activity</text>
  <text x="25" y="80" class="label" fill="${t.text}">Not enough recent activity to chart.</text>
${close}`;
  }

  const max = Math.max(1, ...recent.map((d) => d.count));
  const n = recent.length;
  const x = (i: number) => padL + (i / (n - 1)) * plotW;
  const y = (c: number) => bottom - (c / max) * plotH;

  const pts = recent.map((d, i) => `${x(i).toFixed(1)},${y(d.count).toFixed(1)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `M ${x(0).toFixed(1)},${bottom} L ${pts.join(" L ")} L ${x(
    n - 1
  ).toFixed(1)},${bottom} Z`;

  // Y gridlines (0, mid, max).
  const grid = [0, 0.5, 1]
    .map((f) => {
      const gy = bottom - f * plotH;
      const val = Math.round(f * max);
      return `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="${t.border}" stroke-dasharray="3 4"/>
    <text x="${padL - 6}" y="${gy + 4}" text-anchor="end" class="sub" fill="${t.text}">${val}</text>`;
    })
    .join("\n");

  // Sparse X labels (first, middle, last dates).
  const labelIdx = [0, Math.floor((n - 1) / 2), n - 1];
  const xLabels = labelIdx
    .map((i) => {
      const d = new Date(recent[i].date + "T00:00:00");
      const lbl = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `<text x="${x(i).toFixed(1)}" y="${bottom + 18}" text-anchor="middle" class="sub" fill="${t.text}">${escapeXml(
        lbl
      )}</text>`;
    })
    .join("\n");

  const sumRecent = recent.reduce((a, d) => a + d.count, 0);

  return `${open}
  <defs>
    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${t.accent}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <text x="25" y="38" class="card-title" fill="${t.title}">Contribution Activity — last 30 days</text>
  <text x="${W - padR}" y="38" text-anchor="end" class="label" fill="${t.text}">${fmt(
    sumRecent
  )} contributions</text>
  ${grid}
  <path class="fade" d="${area}" fill="url(#fill)"/>
  <path class="fade2" d="${line}" fill="none" stroke="${t.accent}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
  ${xLabels}
${close}`;
}
