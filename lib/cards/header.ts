import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, FONT, textWidth } from "./svg";

// Animated "typing" header — our own replacement for readme-typing-svg.
// Types the line in, holds, erases, and loops; a caret blinks throughout.
// SVG SMIL animations play when the image is loaded via <img>, as GitHub does.
export function renderHeader(line: string, themeKey?: string): string {
  const t: CardTheme = cardTheme(themeKey);
  const W = 600;
  const H = 70;
  const size = 26;
  const text = line.slice(0, 60);
  const tw = Math.min(W - 40, textWidth(text, size, true));
  const startX = (W - tw) / 2;
  const baseY = H / 2 + 9;
  const chars = Math.max(1, text.length);
  const dur = Math.max(4, chars * 0.18 + 2.5);

  const keyTimes = "0;0.45;0.85;1";
  const widthValues = `0;${tw.toFixed(1)};${tw.toFixed(1)};0`;
  const caretValues = `${startX.toFixed(1)};${(startX + tw).toFixed(1)};${(
    startX + tw
  ).toFixed(1)};${startX.toFixed(1)}`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(
    text
  )}">
  <defs>
    <clipPath id="reveal">
      <!-- Base width = full text so it stays visible if SMIL is ever stripped. -->
      <rect x="${startX.toFixed(1)}" y="0" height="${H}" width="${tw.toFixed(1)}">
        <animate attributeName="width" values="${widthValues}" keyTimes="${keyTimes}" dur="${dur}s" repeatCount="indefinite"/>
      </rect>
    </clipPath>
  </defs>
  <text x="${startX.toFixed(
    1
  )}" y="${baseY}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${t.title}" clip-path="url(#reveal)">${escapeXml(
    text
  )}</text>
  <rect x="${(startX + tw).toFixed(1)}" y="${baseY - size + 4}" width="2.5" height="${size}" fill="${t.accent}">
    <animate attributeName="x" values="${caretValues}" keyTimes="${keyTimes}" dur="${dur}s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="1;1;0;1" dur="1s" repeatCount="indefinite"/>
  </rect>
</svg>`;
}
