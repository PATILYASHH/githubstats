import type { RepoCard } from "../github";
import { colorForLanguage } from "../colors";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, fmt, frame, icon, textWidth, truncate } from "./svg";

function wrap(text: string, size: number, maxPx: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (textWidth(next, size) > maxPx && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) {
    lines[maxLines - 1] = truncate(lines[maxLines - 1] + " …", size, maxPx);
  }
  return lines;
}

// Featured-project (pin) card: repo name, description, language, stars, forks.
export function renderPinCard(repo: RepoCard, themeKey?: string): string {
  const t: CardTheme = cardTheme(themeKey);
  const W = 400;
  const H = 130;
  const [open, close] = frame(W, H, t);

  const title = truncate(repo.fullName, 15, W - 90, true);
  const descLines = repo.description ? wrap(repo.description, 13, W - 50, 2) : [];
  const langColor = repo.language ? colorForLanguage(repo.language) : t.icon;

  const footY = H - 22;
  const parts: string[] = [];
  let cursorX = 25;
  if (repo.language) {
    parts.push(
      `<circle cx="${cursorX + 6}" cy="${footY - 4}" r="6" fill="${langColor}"/>` +
        `<text x="${cursorX + 19}" y="${footY}" class="sub" fill="${t.text}" font-size="13">${escapeXml(
          repo.language
        )}</text>`
    );
    cursorX += 19 + textWidth(repo.language, 13) + 22;
  }
  parts.push(
    `${icon("star", cursorX, footY - 14, t.text, 14)}` +
      `<text x="${cursorX + 18}" y="${footY}" class="sub" fill="${t.text}" font-size="13">${fmt(
        repo.stars
      )}</text>`
  );
  cursorX += 18 + textWidth(fmt(repo.stars), 13) + 20;
  parts.push(
    `${icon("fork", cursorX, footY - 14, t.text, 14)}` +
      `<text x="${cursorX + 18}" y="${footY}" class="sub" fill="${t.text}" font-size="13">${fmt(
        repo.forks
      )}</text>`
  );

  const desc = descLines
    .map(
      (l, i) =>
        `<text x="25" y="${66 + i * 20}" class="label" fill="${t.text}">${escapeXml(l)}</text>`
    )
    .join("\n");

  return `${open}
  <g class="r1">
    <circle cx="33" cy="34" r="14" fill="${t.icon}" fill-opacity="0.16"/>
    ${icon("repo", 25, 26, t.icon, 16)}
    <text x="54" y="39" class="title" fill="url(#accent)">${escapeXml(title)}</text>
  </g>
  <g class="r2">${desc}</g>
  <g class="r3">${parts.join("\n  ")}</g>
${close}`;
}
