import type { GithubStats } from "../types";
import { getAchievements, ICON_EMOJI, RARITY_COLORS } from "../achievements";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, frame, truncate } from "./svg";

// Trophy case: our achievements as glowing medallions. Unlocked first; if none
// are unlocked yet, the closest-to-complete ones (dimmed) fill in.
export function renderTrophyCard(
  stats: Omit<GithubStats, "topRepos">,
  themeKey?: string
): string {
  const t: CardTheme = cardTheme(themeKey);

  const all = getAchievements(stats);
  const unlocked = all.filter((a) => a.unlocked);
  const shown = (unlocked.length ? unlocked : all).slice(0, 6);

  const cell = 120;
  const W = Math.max(1, shown.length) * cell + 16;
  const H = 160;
  const [open, close] = frame(W, H, t);

  const items = shown
    .map((a, i) => {
      const cx = 8 + i * cell + cell / 2;
      const ring = RARITY_COLORS[a.rarity].ring;
      const glow = RARITY_COLORS[a.rarity].glow;
      const emoji = ICON_EMOJI[a.icon] ?? "🏅";
      const title = truncate(a.title, 11, cell - 12, true);
      const tier = a.unlocked
        ? a.rarity.toUpperCase()
        : `${Math.min(99, Math.round((a.current / a.target) * 100))}%`;
      const delay = (i * 0.1).toFixed(2);
      const dim = a.unlocked ? "" : ` opacity="0.5"`;
      return `<g${dim} style="animation:pop .55s cubic-bezier(.2,.8,.3,1.2) ${delay}s both">
    <circle cx="${cx}" cy="62" r="33" fill="${ring}" fill-opacity="0.12"/>
    <circle cx="${cx}" cy="62" r="31" fill="${t.bg}" stroke="${ring}" stroke-width="3"
      style="filter:drop-shadow(0 0 6px ${glow})"/>
    <text x="${cx}" y="73" text-anchor="middle" font-size="28">${emoji}</text>
    <text x="${cx}" y="118" text-anchor="middle" class="stat" fill="${t.text}">${escapeXml(title)}</text>
    <text x="${cx}" y="138" text-anchor="middle" class="sub" fill="${ring}" font-weight="700">${escapeXml(tier)}</text>
  </g>`;
    })
    .join("\n");

  return `${open}
${items}
${close}`;
}
