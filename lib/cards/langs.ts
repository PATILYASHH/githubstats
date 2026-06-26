import type { GithubStats } from "../types";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, frame, truncate } from "./svg";

// Top languages card (compact layout): one stacked bar + a two-column legend.
export function renderTopLangsCard(
  stats: Omit<GithubStats, "topRepos">,
  themeKey?: string
): string {
  const t: CardTheme = cardTheme(themeKey);
  const langs = stats.languages.slice(0, 8);

  const W = 360;
  const barY = 56;
  const legendTop = 86;
  const rows = Math.ceil(langs.length / 2);
  const H = legendTop + rows * 24 + 8;
  const [open, close] = frame(W, H, t);

  if (langs.length === 0) {
    return `${open}
  <text x="25" y="38" class="card-title" fill="${t.title}">Most Used Languages</text>
  <text x="25" y="72" class="label" fill="${t.text}">No public language data yet.</text>
${close}`;
  }

  // Normalize percentages so the bar always fills the full width.
  const sum = langs.reduce((a, l) => a + l.percentage, 0) || 1;
  const barX = 25;
  const barW = W - 50;
  let cursor = barX;
  const segments = langs
    .map((l) => {
      const w = (l.percentage / sum) * barW;
      const seg = `<rect x="${cursor.toFixed(2)}" y="${barY}" width="${Math.max(
        0,
        w - 1
      ).toFixed(2)}" height="10" rx="2" fill="${l.color}"/>`;
      cursor += w;
      return seg;
    })
    .join("");

  const colW = (W - 50) / 2;
  const legend = langs
    .map((l, i) => {
      const colIdx = i % 2;
      const rowIdx = Math.floor(i / 2);
      const x = 25 + colIdx * colW;
      const y = legendTop + rowIdx * 24;
      const label = truncate(`${l.name}`, 13, colW - 70);
      const cls = ["fade", "fade2", "fade3"][rowIdx % 3];
      return `<g class="${cls}">
    <circle cx="${x + 6}" cy="${y - 4}" r="6" fill="${l.color}"/>
    <text x="${x + 20}" y="${y}" class="label" fill="${t.text}">${escapeXml(label)}</text>
    <text x="${x + colW - 12}" y="${y}" class="sub" fill="${t.text}" text-anchor="end">${l.percentage.toFixed(
      1
    )}%</text>
  </g>`;
    })
    .join("\n");

  return `${open}
  <text x="25" y="38" class="card-title" fill="${t.title}">Most Used Languages</text>
  <g class="fade">${segments}</g>
${legend}
${close}`;
}
