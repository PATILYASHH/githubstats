import type { RepoCard } from "../github";
import { colorForLanguage } from "../colors";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, fmt, frame, icon, textWidth, truncate } from "./svg";

// Wrap a description into up to `maxLines` lines within a pixel width.
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

  const title = truncate(repo.fullName, 15, W - 80, true);
  const descLines = repo.description
    ? wrap(repo.description, 13, W - 50, 2)
    : [];
  const langColor = repo.language ? colorForLanguage(repo.language) : t.icon;

  const footY = H - 22;
  const metaParts: string[] = [];
  if (repo.language) {
    metaParts.push(
      `<circle cx="31" cy="${footY - 4}" r="6" fill="${langColor}"/>` +
        `<text x="44" y="${footY}" class="sub" fill="${t.text}" font-size="13">${escapeXml(
          repo.language
        )}</text>`
    );
  }
  const langW = repo.language ? 40 + textWidth(repo.language, 13) + 24 : 25;
  const starX = repo.language ? langW : 25;
  metaParts.push(
    `${icon("star", starX, footY - 14, t.text, 14)}` +
      `<text x="${starX + 18}" y="${footY}" class="sub" fill="${t.text}" font-size="13">${fmt(
        repo.stars
      )}</text>`
  );
  const forkX = starX + 18 + textWidth(fmt(repo.stars), 13) + 18;
  metaParts.push(
    `${icon("fork", forkX, footY - 14, t.text, 14)}` +
      `<text x="${forkX + 18}" y="${footY}" class="sub" fill="${t.text}" font-size="13">${fmt(
        repo.forks
      )}</text>`
  );

  const desc = descLines
    .map(
      (l, i) =>
        `<text x="25" y="${64 + i * 20}" class="label" fill="${t.text}">${escapeXml(l)}</text>`
    )
    .join("\n");

  return `${open}
  <g class="fade">
    ${icon("repo", 25, 26, t.icon, 16)}
    <text x="48" y="39" class="card-title" fill="${t.title}">${escapeXml(title)}</text>
  </g>
  <g class="fade2">${desc}</g>
  <g class="fade3">${metaParts.join("\n  ")}</g>
${close}`;
}
