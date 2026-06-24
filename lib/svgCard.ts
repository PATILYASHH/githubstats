import type { GithubStats } from "./types";
import { LEVEL_COLORS } from "./colors";

type CoreStats = Omit<GithubStats, "topRepos">;

interface Theme {
  bg: string;
  bg2: string;
  text: string;
  muted: string;
  border: string;
  title: string;
}

export const CARD_THEMES: Record<string, Theme> = {
  dark: { bg: "#0d1117", bg2: "#161b22", text: "#e6edf3", muted: "#8b949e", border: "#30363d", title: "#58a6ff" },
  light: { bg: "#ffffff", bg2: "#f6f8fa", text: "#1f2328", muted: "#636c76", border: "#d0d7de", title: "#0969da" },
  midnight: { bg: "#0d1117", bg2: "#161b2e", text: "#e6edf3", muted: "#8b949e", border: "#2a3352", title: "#7aa2ff" },
  dracula: { bg: "#282a36", bg2: "#343746", text: "#f8f8f2", muted: "#a3a6b8", border: "#44475a", title: "#bd93f9" },
  forest: { bg: "#0d1f17", bg2: "#123524", text: "#e6f3ea", muted: "#8bb59c", border: "#1d4730", title: "#56d364" },
  sunset: { bg: "#2a1726", bg2: "#3d1f1f", text: "#ffeede", muted: "#c79a96", border: "#5a2e2e", title: "#ff9e64" },
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export function renderCardSVG(stats: CoreStats, themeName: string): string {
  const t = CARD_THEMES[themeName] ?? CARD_THEMES.dark;
  const { user, contributions: c, rank, languages } = stats;
  const W = 480;
  const H = 195;

  const name = esc(user.name || user.login);
  const handle = esc(user.login);

  const statItems = [
    { label: "Contributions", value: fmt(c.total) },
    { label: "Stars", value: fmt(stats.totalStars) },
    { label: "Longest streak", value: `${c.longestStreak}d` },
    { label: "Followers", value: fmt(user.followers) },
  ];

  const statsSvg = statItems
    .map((s, i) => {
      const x = 24 + (i % 2) * 230;
      const y = 96 + Math.floor(i / 2) * 40;
      return `
        <text x="${x}" y="${y}" class="val">${s.value}</text>
        <text x="${x}" y="${y + 16}" class="lbl">${esc(s.label)}</text>`;
    })
    .join("");

  // last ~30 days sparkline
  const recent = c.days.slice(-30);
  const cellsSvg = recent
    .map((d, i) => {
      const x = 24 + i * 9.2;
      return `<rect x="${x.toFixed(1)}" y="172" width="7" height="7" rx="1.5" fill="${LEVEL_COLORS[d.level]}" />`;
    })
    .join("");

  const topLang = languages[0];
  const langSvg = topLang
    ? `<circle cx="350" cy="176" r="5" fill="${topLang.color}" />
       <text x="360" y="180" class="lbl">${esc(topLang.name)} ${topLang.percentage}%</text>`
    : "";

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${handle}'s GitHub stats">
  <style>
    .name { font: 700 20px -apple-system, Segoe UI, Helvetica, Arial, sans-serif; fill: ${t.title}; }
    .handle { font: 400 13px -apple-system, Segoe UI, Helvetica, Arial, sans-serif; fill: ${t.muted}; }
    .rank { font: 700 13px -apple-system, Segoe UI, Helvetica, Arial, sans-serif; fill: ${rank.color}; }
    .val { font: 800 22px -apple-system, Segoe UI, Helvetica, Arial, sans-serif; fill: ${t.text}; }
    .lbl { font: 400 12px -apple-system, Segoe UI, Helvetica, Arial, sans-serif; fill: ${t.muted}; }
    .fade { opacity: 0; animation: fadein 0.8s ease forwards; }
    .d1 { animation-delay: 0.1s; } .d2 { animation-delay: 0.25s; } .d3 { animation-delay: 0.4s; }
    @keyframes fadein { to { opacity: 1; } }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="${t.bg}" stroke="${t.border}" />
  <rect x="0.5" y="0.5" width="${W - 1}" height="56" rx="14" fill="${t.bg2}" />
  <rect x="0.5" y="40" width="${W - 1}" height="17" fill="${t.bg2}" />
  <g class="fade d1">
    <text x="24" y="30" class="name">${name}</text>
    <text x="24" y="48" class="handle">@${handle}</text>
    <text x="${W - 24}" y="34" text-anchor="end" class="rank">${esc(rank.emoji)} ${esc(rank.title)}</text>
  </g>
  <g class="fade d2">${statsSvg}</g>
  <g class="fade d3">${cellsSvg}${langSvg}</g>
</svg>`;
}

export function errorCardSVG(handle: string): string {
  const t = CARD_THEMES.dark;
  return `<svg width="480" height="120" viewBox="0 0 480 120" xmlns="http://www.w3.org/2000/svg" role="img">
  <rect x="0.5" y="0.5" width="479" height="119" rx="14" fill="${t.bg}" stroke="${t.border}" />
  <text x="240" y="56" text-anchor="middle" font="700 18px sans-serif" fill="${t.text}" font-family="sans-serif" font-size="18" font-weight="700">Couldn't load @${esc(handle)}</text>
  <text x="240" y="80" text-anchor="middle" fill="${t.muted}" font-family="sans-serif" font-size="13">githubstatss.vercel.app</text>
</svg>`;
}
