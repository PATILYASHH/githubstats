import type { GithubStats } from "../types";
import { getAchievements, ICON_EMOJI, RARITY_COLORS } from "../achievements";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, frame, truncate } from "./svg";

// Trophy case: our achievements rendered as a row of medallions. Shows unlocked
// achievements first; if none are unlocked yet, shows the closest in progress.
export function renderTrophyCard(
  stats: Omit<GithubStats, "topRepos">,
  themeKey?: string
): string {
  const t: CardTheme = cardTheme(themeKey);

  const all = getAchievements(stats);
  const unlocked = all.filter((a) => a.unlocked);
  const shown = (unlocked.length ? unlocked : all).slice(0, 6);

  const cell = 118;
  const W = Math.max(1, shown.length) * cell + 16;
  const H = 150;
  const [open, close] = frame(W, H, t);

  const items = shown
    .map((a, i) => {
      const cx = 8 + i * cell + cell / 2;
      const ring = RARITY_COLORS[a.rarity].ring;
      const emoji = ICON_EMOJI[a.icon] ?? "🏅";
      const title = truncate(a.title, 11, cell - 14, true);
      const tier = a.unlocked
        ? a.rarity.toUpperCase()
        : `${Math.min(99, Math.round((a.current / a.target) * 100))}%`;
      const cls = ["fade", "fade2", "fade3"][i % 3];
      const dim = a.unlocked ? "" : ` opacity="0.55"`;
      return `<g class="${cls}"${dim}>
    <circle cx="${cx}" cy="56" r="30" fill="${t.bg}" stroke="${ring}" stroke-width="3"/>
    <text x="${cx}" y="66" text-anchor="middle" font-size="26">${emoji}</text>
    <text x="${cx}" y="108" text-anchor="middle" class="stat" fill="${t.text}">${escapeXml(title)}</text>
    <text x="${cx}" y="128" text-anchor="middle" class="sub" fill="${ring}">${escapeXml(tier)}</text>
  </g>`;
    })
    .join("\n");

  return `${open}
${items}
${close}`;
}
