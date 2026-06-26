import type { GithubStats } from "../types";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, frame, truncate } from "./svg";

// Top languages card (compact): an animated stacked bar + two-column legend.
export function renderTopLangsCard(
  stats: Omit<GithubStats, "topRepos">,
  themeKey?: string
): string {
  const t: CardTheme = cardTheme(themeKey);
  const langs = stats.languages.slice(0, 8);

  const W = 360;
  const barY = 58;
  const legendTop = 92;
  const rowCount = Math.ceil(langs.length / 2);
  const H = legendTop + rowCount * 26 + 8;
  const [open, close] = frame(W, H, t);

  if (langs.length === 0) {
    return `${open}
  <text x="24" y="40" class="title" fill="url(#accent)">Most Used Languages</text>
  <text x="24" y="74" class="label" fill="${t.text}">No public language data yet.</text>
${close}`;
  }

  const sum = langs.reduce((a, l) => a + l.percentage, 0) || 1;
  const barX = 24;
  const barW = W - 48;
  let cursor = barX;
  const segments = langs
    .map((l) => {
      const w = (l.percentage / sum) * barW;
      const seg = `<rect x="${cursor.toFixed(2)}" y="${barY}" width="${Math.max(
        0,
        w
      ).toFixed(2)}" height="11" fill="${l.color}"/>`;
      cursor += w;
      return seg;
    })
    .join("");

  const colW = (W - 48) / 2;
  const legend = langs
    .map((l, i) => {
      const colIdx = i % 2;
      const rowIdx = Math.floor(i / 2);
      const x = 24 + colIdx * colW;
      const y = legendTop + rowIdx * 26;
      const label = truncate(`${l.name}`, 13, colW - 74);
      const cls = ["r1", "r2", "r3", "r4"][rowIdx % 4];
      return `<g class="${cls}">
    <circle cx="${x + 6}" cy="${y - 4}" r="6" fill="${l.color}"/>
    <text x="${x + 20}" y="${y}" class="label" fill="${t.text}">${escapeXml(label)}</text>
    <text x="${x + colW - 12}" y="${y}" class="stat" fill="${t.text}" text-anchor="end" font-size="13">${l.percentage.toFixed(
      1
    )}%</text>
  </g>`;
    })
    .join("\n");

  return `${open}
  <text x="24" y="40" class="title" fill="url(#accent)">Most Used Languages</text>
  <defs><clipPath id="barclip"><rect x="${barX}" y="${barY}" width="${barW}" height="11" rx="5.5">
    <animate attributeName="width" from="0" to="${barW}" dur="1.1s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.8 0.2 1"/>
  </rect></clipPath></defs>
  <rect x="${barX}" y="${barY}" width="${barW}" height="11" rx="5.5" fill="${t.border}" opacity="0.5"/>
  <g clip-path="url(#barclip)">${segments}</g>
${legend}
${close}`;
}
