// Shared helpers for building SVG stat cards by hand (no third-party services).

import type { CardTheme } from "./theme";

export const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

export function escapeXml(s: string): string {
  return String(s).replace(
    /[<>&'"]/g,
    (c) =>
      (({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      }) as Record<string, string>)[c]
  );
}

export function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

// Compact number, e.g. 12345 -> "12.3k".
export function kFormat(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const v = n / 1000;
    return (v >= 100 ? Math.round(v) : Math.round(v * 10) / 10) + "k";
  }
  const v = n / 1_000_000;
  return (v >= 100 ? Math.round(v) : Math.round(v * 10) / 10) + "m";
}

// Rough text-width estimate (px) for layout. Tuned for the Segoe UI / system
// sans stack. Good enough for badge sizing and truncation — not pixel perfect.
const NARROW = new Set("iIl.,:;'|!ftj()[]{}".split(""));
const WIDE = new Set("mwMW@".split(""));
export function textWidth(s: string, size: number, bold = false): number {
  let units = 0;
  for (const ch of s) {
    if (NARROW.has(ch)) units += 0.33;
    else if (WIDE.has(ch)) units += 0.85;
    else if (ch >= "A" && ch <= "Z") units += 0.68;
    else if (ch === " ") units += 0.3;
    else units += 0.55;
  }
  return units * size * (bold ? 1.04 : 1);
}

// Truncate to a pixel budget, adding an ellipsis if needed.
export function truncate(s: string, size: number, maxPx: number, bold = false): string {
  if (textWidth(s, size, bold) <= maxPx) return s;
  let out = s;
  while (out.length > 1 && textWidth(out + "…", size, bold) > maxPx) {
    out = out.slice(0, -1);
  }
  return out + "…";
}

// 16x16 bootstrap-icons paths, reused as inline glyphs inside cards.
export const ICONS: Record<string, string> = {
  star: "M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z",
  commit:
    "M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.5a.5.5 0 0 1 0-1h3.57a4.002 4.002 0 0 1 7.86 0h3.57a.5.5 0 0 1 0 1zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  people:
    "M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1A.261.261 0 0 1 7 13c.001-.275.154-1.078.832-1.946.456-.583 1.113-1.063 2.027-1.32C9.526 9.793 8.83 9.5 8 9.5c-4 0-5 3-5 4 0 1 1 1 1 1zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4",
  repo: "M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783",
  fire: "M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16m0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15",
  graph:
    "M0 0h1v15h15v1H0zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07",
  calendar:
    "M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z",
  fork: "M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 4.5 6.25zm6.75-.872a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5m-3 8.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0",
  trophy:
    "M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5q0 .807-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.183.046.348.158.468.346l.011.013q.046.066.077.142a1 1 0 0 1 .057.487l-.002.024a1 1 0 0 1-.013.083c0 .002 0 .003-.002.004l-.005.02-.001.005-.003.012H3.456l-.003-.012-.005-.02-.002-.009a1 1 0 0 1-.013-.083l-.002-.024a1 1 0 0 1 .057-.487q.03-.076.077-.142l.011-.013c.12-.188.285-.3.468-.346L5.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33 33 0 0 1 1.5.5zm.099 2.54a2 2 0 0 0 .72 3.935c-.333-1.05-.588-2.346-.72-3.935m10.083 3.935a2 2 0 0 0 .72-3.935c-.133 1.59-.388 2.885-.72 3.935",
  rocket:
    "M12.17 9.53c2.307-2.592 3.278-4.684 3.641-6.218.21-.887.214-1.58.16-2.065a3.6 3.6 0 0 0-.108-.563 2 2 0 0 0-.078-.23V.453c-.073-.164-.168-.234-.352-.295a2 2 0 0 0-.16-.045 4 4 0 0 0-.57-.093c-.49-.044-1.19-.03-2.08.188-1.536.374-3.618 1.343-6.161 3.604l-2.4.238h-.006a2.55 2.55 0 0 0-1.524.734L.15 7.17a.512.512 0 0 0 .433.868l1.896-.271c.28-.04.592.013.955.132.232.076.437.16.655.248l.203.083c.196.816.66 1.58 1.275 2.195.613.614 1.376 1.08 2.191 1.277l.082.202c.089.218.173.424.249.657.118.363.172.676.132.956l-.271 1.9a.512.512 0 0 0 .867.433l2.382-2.386c.41-.41.668-.949.732-1.526zm.11-3.699c-.797.8-1.93.961-2.528.362-.598-.6-.436-1.733.361-2.532.798-.799 1.93-.96 2.528-.361s.437 1.732-.36 2.531Z M5.205 10.787a7.6 7.6 0 0 0 1.804 1.352c-1.118 1.007-4.929 2.028-5.054 1.903-.126-.127.737-4.189 1.839-5.18.346.69.837 1.35 1.411 1.925",
  lightning:
    "M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z",
  gem: "M3.1.7a.5.5 0 0 1 .4-.2h9a.5.5 0 0 1 .4.2l2.976 3.974c.149.185.156.45.01.644L8.4 15.3a.5.5 0 0 1-.8 0L.1 5.3a.5.5 0 0 1 0-.6zm11.386 3.785-1.806-2.41-.776 2.413zm-3.633.004.961-2.989H4.186l.963 2.995zM5.47 5.495 8 13.366l2.532-7.876zm-1.371-.999-.78-2.422-1.818 2.425zM1.499 5.5l5.113 6.817-2.192-6.82zm7.889 6.817 5.123-6.83-2.928.002z",
  award:
    "m8 0 1.669.864 1.858.282.842 1.68 1.337 1.32L13.4 6l.306 1.854-1.337 1.32-.842 1.68-1.858.282L8 12l-1.669-.864-1.858-.282-.842-1.68-1.337-1.32L2.6 6l-.306-1.854 1.337-1.32.842-1.68L6.331.864z M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1z",
  code: "M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0m6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0",
  heart:
    "M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314",
  bookmark:
    "M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2",
  bullseye:
    "M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16 M8 13A5 5 0 1 1 8 3a5 5 0 0 1 0 10m0 1A6 6 0 1 0 8 2a6 6 0 0 0 0 12 M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0",
  lock: "M8 0a4 4 0 0 1 4 4v2.05a2.5 2.5 0 0 1 2 2.45v5a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 2 13.5v-5a2.5 2.5 0 0 1 2-2.45V4a4 4 0 0 1 4-4m0 1a3 3 0 0 0-3 3v2h6V4a3 3 0 0 0-3-3",
};

// An inline 16x16 icon glyph positioned at (x, y) with a given fill.
export function icon(name: string, x: number, y: number, fill: string, size = 16): string {
  const d = ICONS[name];
  if (!d) return "";
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 16 16" fill="${fill}"><path d="${d}"/></svg>`;
}

// Shared <defs>: an accent gradient (title→accent), a soft glow filter, and a
// subtle corner glow used as a background wash. IDs are document-scoped — each
// card is its own SVG document (loaded via <img>), so fixed IDs never clash.
export function defs(t: CardTheme): string {
  return `<defs>
  <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${t.title}"/>
    <stop offset="1" stop-color="${t.accent}"/>
  </linearGradient>
  <radialGradient id="wash" cx="0.85" cy="0.1" r="0.9">
    <stop offset="0" stop-color="${t.accent}" stop-opacity="0.14"/>
    <stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
  </radialGradient>
  <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="3" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`;
}

// Shared style block: fonts + staggered reveal animations. Animations run when
// the SVG is loaded via <img> (as on GitHub); static fallback is the end state.
//
// NOTE: scale/rotate animations on SVG elements MUST set
// `transform-box:fill-box;transform-origin:center` or the browser scales them
// from the SVG's (0,0) origin — they'd fly in from the top-left corner instead
// of popping in place. Translate-only animations (rise/float/sweep) are origin-
// independent and don't need it.
function styleBlock(extra = ""): string {
  return `<style>
  .title{font:700 18px ${FONT};}
  .label{font:400 14px ${FONT};}
  .stat{font:700 15px ${FONT};}
  .big{font:800 28px ${FONT};}
  .huge{font:800 38px ${FONT};}
  .sub{font:400 11px ${FONT};}
  .r1{animation:rise .6s ease both;}
  .r2{animation:rise .6s ease .12s both;}
  .r3{animation:rise .6s ease .24s both;}
  .r4{animation:rise .6s ease .36s both;}
  .r5{animation:rise .6s ease .48s both;}
  .pop{animation:pop .55s cubic-bezier(.2,.8,.3,1.25) both;transform-box:fill-box;transform-origin:center;}
  .float{animation:float 3s ease-in-out infinite;}
  .pulse{animation:pulse 2.6s ease-in-out infinite;}
  .cardshine{animation:sweep 1.6s ease-out .25s both;}
  @keyframes rise{from{opacity:0;transform:translateY(7px);}to{opacity:1;transform:none;}}
  @keyframes pop{from{opacity:0;transform:scale(.55);}to{opacity:1;transform:scale(1);}}
  @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-3px);}}
  @keyframes pulse{0%,100%{opacity:.35;}50%{opacity:.8;}}
  @keyframes shine{0%{transform:translateX(0);}45%{transform:translateX(92px);}100%{transform:translateX(92px);}}
  @keyframes sweep{from{transform:translateX(0);}to{transform:translateX(1100px);}}
  ${extra}
</style>`;
}

// Outer card frame: background, corner wash, top accent bar, border, defs +
// style. Returns [open, close] so callers fill the body in between.
export function frame(
  width: number,
  height: number,
  t: CardTheme,
  extraStyle = ""
): [string, string] {
  const open = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
${defs(t)}
${styleBlock(extraStyle)}
<clipPath id="cardClip"><rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12"/></clipPath>
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="${t.bg}" stroke="${t.border}"/>
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="url(#wash)"/>
<rect x="14" y="0" width="${width - 28}" height="3" rx="1.5" fill="url(#accent)"/>
<g clip-path="url(#cardClip)"><g class="cardshine"><rect x="-170" y="0" width="110" height="${height}" fill="#ffffff" opacity="0.07" transform="skewX(-18)"/></g></g>`;
  return [open, `</svg>`];
}

// A small standalone error card so a broken username never shows a broken image.
export function errorCard(message: string): string {
  const t: CardTheme = {
    title: "#f85149",
    icon: "#f85149",
    text: "#8b949e",
    bg: "#0d1117",
    border: "#30363d",
    accent: "#f85149",
  };
  const [open, close] = frame(440, 90, t);
  return `${open}
  <text x="24" y="44" class="title" fill="#f85149">Couldn’t build this card</text>
  <text x="24" y="68" class="label" fill="#8b949e">${escapeXml(message)}</text>
  ${close}`;
}
