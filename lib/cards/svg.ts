// Shared helpers for building SVG stat cards by hand (no third-party services).

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
};

// An inline 16x16 icon glyph positioned at (x, y) with a given fill.
export function icon(name: string, x: number, y: number, fill: string, size = 16): string {
  const d = ICONS[name];
  if (!d) return "";
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 16 16" fill="${fill}"><path d="${d}"/></svg>`;
}

// Outer card frame (rounded rect + border) plus a shared <style> block and a
// soft fade-in. Returns [open, close] so callers fill the body in between.
export function frame(
  width: number,
  height: number,
  theme: { bg: string; border: string },
  extraStyle = ""
): [string, string] {
  const open = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
<style>
  .card-title{font:600 18px ${FONT};}
  .label{font:400 14px ${FONT};}
  .stat{font:700 15px ${FONT};}
  .big{font:800 28px ${FONT};}
  .sub{font:400 11px ${FONT};}
  .fade{opacity:0;animation:fade .8s ease forwards;}
  .fade2{opacity:0;animation:fade .8s ease .15s forwards;}
  .fade3{opacity:0;animation:fade .8s ease .3s forwards;}
  @keyframes fade{to{opacity:1;}}
  ${extraStyle}
</style>
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>`;
  return [open, `</svg>`];
}

// A small standalone error card so a broken username never shows a broken image.
export function errorCard(message: string): string {
  const theme = { bg: "#0d1117", border: "#30363d" };
  const [open, close] = frame(440, 90, theme);
  return `${open}
  <text x="24" y="42" class="card-title" fill="#f85149">Couldn’t build this card</text>
  <text x="24" y="66" class="label" fill="#8b949e">${escapeXml(message)}</text>
  ${close}`;
}
