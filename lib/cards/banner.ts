import { cardTheme, type CardTheme } from "./theme";
import { escapeXml, FONT, truncate } from "./svg";

// Build a seamless horizontal wave band (filled to the bottom) that can be
// drifted with translateX for a flowing effect. Drawn twice the width so a
// translate of one wavelength loops without a seam.
function wave(baseY: number, amp: number, wl: number, totalW: number, h: number): string {
  let d = `M 0 ${baseY}`;
  let x = 0;
  let up = true;
  while (x < totalW) {
    const nx = x + wl;
    const cy = baseY + (up ? -amp : amp);
    d += ` Q ${(x + wl / 2).toFixed(1)} ${cy.toFixed(1)} ${nx.toFixed(1)} ${baseY}`;
    x = nx;
    up = !up;
  }
  d += ` L ${totalW} ${h} L 0 ${h} Z`;
  return d;
}

// Animated gradient banner with name + role. Our own replacement for the
// capsule-render header — flowing gradient, drifting waves, fade-in text.
export function renderBanner(
  name: string,
  subtitle: string,
  themeKey?: string
): string {
  const t: CardTheme = cardTheme(themeKey);
  const W = 850;
  const H = 200;
  const nm = truncate(name || "Hello", 40, W - 80, true);
  const sub = truncate(subtitle || "", 20, W - 120);

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(
    name
  )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.title}"/>
      <stop offset="0.5" stop-color="${t.accent}"/>
      <stop offset="1" stop-color="${t.icon}"/>
      <animateTransform attributeName="gradientTransform" type="rotate"
        from="0 0.5 0.5" to="360 0.5 0.5" dur="16s" repeatCount="indefinite"/>
    </linearGradient>
    <clipPath id="round"><rect width="${W}" height="${H}" rx="16"/></clipPath>
    <style>
      .nm{font:800 44px ${FONT};fill:#fff;}
      .sub{font:600 20px ${FONT};fill:#fff;}
      /* 'both' (not a hidden base) so text stays visible if styles are stripped */
      .fade{animation:fi .9s ease .2s both;}
      .fade2{animation:fi .9s ease .45s both;}
      @keyframes fi{from{opacity:0;}to{opacity:1;}}
    </style>
  </defs>
  <g clip-path="url(#round)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <g opacity="0.18" fill="#ffffff">
      <path d="${wave(150, 16, 180, W * 2, H)}">
        <animateTransform attributeName="transform" type="translate" from="0 0" to="-180 0" dur="7s" repeatCount="indefinite"/>
      </path>
    </g>
    <g opacity="0.12" fill="#ffffff">
      <path d="${wave(168, 12, 140, W * 2, H)}">
        <animateTransform attributeName="transform" type="translate" from="-140 0" to="0 0" dur="9s" repeatCount="indefinite"/>
      </path>
    </g>
    <text x="${W / 2}" y="${sub ? 96 : 112}" text-anchor="middle" class="nm fade"
      stroke="rgba(0,0,0,0.16)" stroke-width="0.7" paint-order="stroke">${escapeXml(nm)}</text>
    ${
      sub
        ? `<text x="${W / 2}" y="132" text-anchor="middle" class="sub fade2" opacity="0.95">${escapeXml(
            sub
          )}</text>`
        : ""
    }
  </g>
</svg>`;
}
