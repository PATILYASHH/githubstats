import type { ContribDay, GithubStats } from "../types";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, fmt, frame } from "./svg";

// Activity graph: contributions over the last ~30 days as an animated area chart
// (the line draws itself in; static fallback shows the full line).
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

  const padL = 34;
  const padR = 22;
  const top = 62;
  const bottom = H - 32;
  const plotW = W - padL - padR;
  const plotH = bottom - top;

  if (recent.length < 2) {
    return `${open}
  <text x="24" y="40" class="title" fill="url(#accent)">Contribution Activity</text>
  <text x="24" y="82" class="label" fill="${t.text}">Not enough recent activity to chart.</text>
${close}`;
  }

  const max = Math.max(1, ...recent.map((d) => d.count));
  const n = recent.length;
  const x = (i: number) => padL + (i / (n - 1)) * plotW;
  const y = (c: number) => bottom - (c / max) * plotH;

  const pts = recent.map((d, i) => `${x(i).toFixed(1)},${y(d.count).toFixed(1)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `M ${x(0).toFixed(1)},${bottom} L ${pts.join(" L ")} L ${x(n - 1).toFixed(1)},${bottom} Z`;

  const grid = [0, 0.5, 1]
    .map((f) => {
      const gy = bottom - f * plotH;
      const val = Math.round(f * max);
      return `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="${t.border}" stroke-dasharray="3 5"/>
    <text x="${padL - 8}" y="${gy + 4}" text-anchor="end" class="sub" fill="${t.text}">${val}</text>`;
    })
    .join("\n");

  const labelIdx = [0, Math.floor((n - 1) / 2), n - 1];
  const xLabels = labelIdx
    .map((i) => {
      const d = new Date(recent[i].date + "T00:00:00");
      const lbl = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return `<text x="${x(i).toFixed(1)}" y="${bottom + 20}" text-anchor="middle" class="sub" fill="${t.text}">${escapeXml(
        lbl
      )}</text>`;
    })
    .join("\n");

  // Highlight the peak day.
  let peakI = 0;
  recent.forEach((d, i) => {
    if (d.count > recent[peakI].count) peakI = i;
  });

  const sumRecent = recent.reduce((a, d) => a + d.count, 0);

  return `${open}
  <defs>
    <linearGradient id="afill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${t.accent}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <text x="24" y="40" class="title" fill="url(#accent)">Contribution Activity — last 30 days</text>
  <text x="${W - padR}" y="40" text-anchor="end" class="stat" fill="${t.text}">${fmt(
    sumRecent
  )} contributions</text>
  ${grid}
  <path d="${area}" fill="url(#afill)" opacity="0" >
    <animate attributeName="opacity" from="0" to="1" dur="1s" begin="0.3s" fill="freeze"/>
  </path>
  <path d="${line}" fill="none" stroke="url(#accent)" stroke-width="3" stroke-linejoin="round"
    stroke-linecap="round" filter="url(#glow)" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0">
    <animate attributeName="stroke-dashoffset" from="1" to="0" dur="1.5s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.3 0.7 0.3 1"/>
  </path>
  <circle cx="${x(peakI).toFixed(1)}" cy="${y(recent[peakI].count).toFixed(1)}" r="4.5" fill="${t.accent}" filter="url(#glow)" class="pop"/>
  ${xLabels}
${close}`;
}
