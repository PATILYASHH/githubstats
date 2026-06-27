import type { GithubStats } from "../types";
import { getAchievements, ICON_EMOJI, RARITY_COLORS, type Rarity } from "../achievements";
import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, frame, truncate } from "./svg";

const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary"];

// Trophy case: our achievements as glowing medallions. Unlocked first, then the
// closest-to-complete (dimmed, with a lock + progress %) fill the grid out.
// Each medallion: a rarity-tinted disc with a gloss highlight, a pulsing glow,
// a floating emoji, a sequential light shimmer, a tier ribbon and its title.
export function renderTrophyCard(
  stats: Omit<GithubStats, "topRepos">,
  themeKey?: string
): string {
  const t: CardTheme = cardTheme(themeKey);

  const all = getAchievements(stats);
  const shown = all.slice(0, 8);
  const unlockedCount = all.filter((a) => a.unlocked).length;

  // Balanced grid: 1 row up to 4, otherwise two roughly-even rows.
  const cols = shown.length <= 4 ? Math.max(1, shown.length) : Math.ceil(shown.length / 2);
  const rows = Math.ceil(shown.length / cols);
  const cellW = 150;
  const cellH = 140;
  const PADX = 16;
  const titleH = 52;
  const W = cols * cellW + PADX * 2;
  const H = titleH + rows * cellH + 8;
  const lx = cellW / 2; // medallion centre x within a cell
  const cy = 48; // medallion centre y within a cell

  const [open, close] = frame(W, H, t);

  // A radial inner-glow gradient + a gloss gradient per rarity, plus one disc
  // clip reused by every (translated) medallion.
  const grads = RARITIES.map((r) => {
    const ring = RARITY_COLORS[r].ring;
    return `<radialGradient id="d-${r}" cx="0.5" cy="0.34" r="0.72">
      <stop offset="0" stop-color="${ring}" stop-opacity="0.5"/>
      <stop offset="0.62" stop-color="${ring}" stop-opacity="0.13"/>
      <stop offset="1" stop-color="${ring}" stop-opacity="0"/>
    </radialGradient>`;
  }).join("\n");

  const cardDefs = `<defs>
  ${grads}
  <clipPath id="discClip"><circle cx="${lx}" cy="${cy}" r="33"/></clipPath>
  </defs>`;

  const medals = shown
    .map((a, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const gx = PADX + col * cellW;
      const gy = titleH + row * cellH;

      const ring = RARITY_COLORS[a.rarity].ring;
      const glow = RARITY_COLORS[a.rarity].glow;
      const emoji = ICON_EMOJI[a.icon] ?? "🏅";
      const title = truncate(a.title, 11, cellW - 20, true);
      const pct = Math.min(99, Math.round((a.current / a.target) * 100));
      const tier = a.unlocked ? a.rarity.toUpperCase() : `${pct}%`;

      const popDelay = (i * 0.09).toFixed(2);
      const shineDelay = (0.6 + i * 0.25).toFixed(2);
      const ribW = Math.max(44, tier.length * 8 + 16);

      // Unlocked extras: floating emoji + a sweeping shimmer. Locked: a padlock.
      const emojiCls = a.unlocked ? ' class="float"' : "";
      const shimmer = a.unlocked
        ? `<g clip-path="url(#discClip)"><g style="animation:shine 3.2s ease-in-out ${shineDelay}s infinite"><rect x="${
            lx - 56
          }" y="${cy - 36}" width="16" height="72" fill="#ffffff" opacity="0.3" transform="skewX(-20)"/></g></g>`
        : "";
      const lock = a.unlocked
        ? ""
        : `<text x="${lx + 19}" y="${cy + 23}" text-anchor="middle" font-size="14">🔒</text>`;

      return `<g transform="translate(${gx} ${gy})" opacity="${a.unlocked ? 1 : 0.5}">
    <g class="pop" style="animation-delay:${popDelay}s">
      <circle cx="${lx}" cy="${cy}" r="40" fill="${ring}" opacity="0.32" class="pulse" style="filter:blur(3px)"/>
      <circle cx="${lx}" cy="${cy}" r="34" fill="${t.bg}" stroke="${ring}" stroke-width="2.5" style="filter:drop-shadow(0 0 7px ${glow})"/>
      <circle cx="${lx}" cy="${cy}" r="33" fill="url(#d-${a.rarity})"/>
      <ellipse cx="${lx}" cy="${cy - 15}" rx="22" ry="10" fill="#ffffff" opacity="0.10"/>
      <text x="${lx}" y="${cy + 10}" text-anchor="middle" font-size="30"${emojiCls}>${emoji}</text>
      ${lock}
      ${shimmer}
      <rect x="${lx - ribW / 2}" y="${cy + 30}" width="${ribW}" height="19" rx="9.5" fill="${ring}" fill-opacity="${
        a.unlocked ? 0.92 : 0.22
      }" stroke="${ring}" stroke-width="1"/>
      <text x="${lx}" y="${cy + 43}" text-anchor="middle" class="sub" font-weight="800" fill="${
        a.unlocked ? t.bg : ring
      }">${escapeXml(tier)}</text>
      <text x="${lx}" y="${cy + 66}" text-anchor="middle" class="stat" fill="${t.text}">${escapeXml(title)}</text>
    </g>
  </g>`;
    })
    .join("\n");

  return `${open}
  ${cardDefs}
  <text x="20" y="33" class="title" fill="url(#accent)">🏆 Trophy Case</text>
  <text x="${W - 20}" y="33" text-anchor="end" class="stat" fill="${t.text}">${unlockedCount} unlocked</text>
  ${medals}
${close}`;
}
