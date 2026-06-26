import type { GithubStats } from "./types";

// ---------------------------------------------------------------------------
// Profile README generator
//
// Turns the stats we already fetch for a GitHub user into a personalized
// profile README.md — the kind that renders on a `username/username` repo.
//
// Two layers of personalization:
//   1. Real data  → About section, tech-stack badges (from actual top
//      languages), Featured Projects (from real top repos), social links.
//   2. Live widgets → the de-facto-standard image cards every profile README
//      uses (github-readme-stats, streak-stats, trophies, activity graph).
//
// This module is the single source of truth for the option logic and every
// widget/badge URL, so the markdown output and the React preview stay in sync.
// ---------------------------------------------------------------------------

export interface ReadmeOptions {
  /** Shared theme key, e.g. "tokyonight" (maps per-service where needed). */
  theme: string;
  tagline: string;
  animatedHeader: boolean;
  showVisitors: boolean;
  showAbout: boolean;
  showTechStack: boolean;
  showStats: boolean;
  showStreak: boolean;
  showTopLangs: boolean;
  showTrophies: boolean;
  showActivity: boolean;
  showFeatured: boolean;
  twitter: string;
  linkedin: string;
  email: string;
  website: string;
}

export interface ThemeOption {
  key: string;
  label: string;
}

// Themes that exist across github-readme-stats, streak-stats and (mapped
// below) the trophy + activity-graph services.
export const THEMES: ThemeOption[] = [
  { key: "tokyonight", label: "Tokyo Night" },
  { key: "github_dark", label: "GitHub Dark" },
  { key: "radical", label: "Radical" },
  { key: "dracula", label: "Dracula" },
  { key: "gruvbox", label: "Gruvbox" },
  { key: "onedark", label: "One Dark" },
  { key: "merko", label: "Merko" },
  { key: "nord", label: "Nord" },
];

// ----- per-service theme mapping ------------------------------------------

// github-profile-trophy uses its own theme set.
function trophyTheme(theme: string): string {
  const ok = new Set([
    "tokyonight",
    "radical",
    "dracula",
    "gruvbox",
    "onedark",
    "nord",
  ]);
  if (theme === "github_dark") return "darkhub";
  if (theme === "merko") return "gruvbox";
  return ok.has(theme) ? theme : "onedark";
}

// github-readme-activity-graph uses dashed theme keys.
function activityTheme(theme: string): string {
  const map: Record<string, string> = {
    tokyonight: "tokyo-night",
    github_dark: "github-compact",
    radical: "react-dark",
    dracula: "dracula",
    gruvbox: "gruvbox",
    onedark: "react-dark",
    merko: "merko",
    nord: "nord",
  };
  return map[theme] ?? "github-compact";
}

// ----- widget URL builders (shared by markdown + preview) ------------------

export function statsCardUrl(u: string, theme: string): string {
  const q = new URLSearchParams({
    username: u,
    show_icons: "true",
    count_private: "true",
    include_all_commits: "true",
    hide_border: "true",
    theme,
  });
  return `https://github-readme-stats.vercel.app/api?${q}`;
}

export function streakCardUrl(u: string, theme: string): string {
  const q = new URLSearchParams({
    user: u,
    hide_border: "true",
    theme,
  });
  return `https://github-readme-streak-stats.herokuapp.com/?${q}`;
}

export function topLangsUrl(u: string, theme: string): string {
  const q = new URLSearchParams({
    username: u,
    layout: "compact",
    hide_border: "true",
    langs_count: "8",
    theme,
  });
  return `https://github-readme-stats.vercel.app/api/top-langs/?${q}`;
}

export function trophyUrl(u: string, theme: string): string {
  const q = new URLSearchParams({
    username: u,
    theme: trophyTheme(theme),
    column: "7",
    margin_w: "8",
    margin_h: "8",
    "no-frame": "true",
  });
  return `https://github-profile-trophy.vercel.app/?${q}`;
}

export function activityGraphUrl(u: string, theme: string): string {
  const q = new URLSearchParams({
    username: u,
    theme: activityTheme(theme),
    hide_border: "true",
    area: "true",
  });
  return `https://github-readme-activity-graph.vercel.app/graph?${q}`;
}

export function visitorBadgeUrl(u: string): string {
  const q = new URLSearchParams({
    username: u,
    label: "Profile views",
    color: "0e75b6",
    style: "flat",
  });
  return `https://komarev.com/ghpvc/?${q}`;
}

export function typingHeaderUrl(lines: string[]): string {
  const q = new URLSearchParams({
    font: "Fira+Code",
    weight: "600",
    size: "26",
    pause: "1000",
    color: "2F81F7",
    center: "true",
    vCenter: "true",
    width: "600",
    height: "60",
    lines: lines.join(";"),
  });
  // URLSearchParams encodes "+" in the font as %2B; the service wants a literal +.
  return `https://readme-typing-svg.demolab.com?${q.toString().replace(
    "Fira%2BCode",
    "Fira+Code"
  )}`;
}

// ----- tech-stack badges (shields.io) --------------------------------------

interface BadgeSpec {
  color: string;
  logo: string;
  logoColor?: string;
}

// Known languages → branded shields badges. Anything else falls back to a
// neutral badge using the language's own name.
const LANG_BADGES: Record<string, BadgeSpec> = {
  JavaScript: { color: "F7DF1E", logo: "javascript", logoColor: "black" },
  TypeScript: { color: "3178C6", logo: "typescript", logoColor: "white" },
  Python: { color: "3776AB", logo: "python", logoColor: "white" },
  Java: { color: "ED8B00", logo: "openjdk", logoColor: "white" },
  "C++": { color: "00599C", logo: "cplusplus", logoColor: "white" },
  C: { color: "A8B9CC", logo: "c", logoColor: "black" },
  Go: { color: "00ADD8", logo: "go", logoColor: "white" },
  Rust: { color: "000000", logo: "rust", logoColor: "white" },
  Ruby: { color: "CC342D", logo: "ruby", logoColor: "white" },
  PHP: { color: "777BB4", logo: "php", logoColor: "white" },
  Swift: { color: "F05138", logo: "swift", logoColor: "white" },
  Kotlin: { color: "7F52FF", logo: "kotlin", logoColor: "white" },
  Dart: { color: "0175C2", logo: "dart", logoColor: "white" },
  HTML: { color: "E34F26", logo: "html5", logoColor: "white" },
  CSS: { color: "1572B6", logo: "css3", logoColor: "white" },
  Shell: { color: "4EAA25", logo: "gnubash", logoColor: "white" },
  Vue: { color: "4FC08D", logo: "vuedotjs", logoColor: "white" },
  "Jupyter Notebook": { color: "F37626", logo: "jupyter", logoColor: "white" },
  Dockerfile: { color: "2496ED", logo: "docker", logoColor: "white" },
  Lua: { color: "2C2D72", logo: "lua", logoColor: "white" },
  Scala: { color: "DC322F", logo: "scala", logoColor: "white" },
  Elixir: { color: "4B275F", logo: "elixir", logoColor: "white" },
  Haskell: { color: "5D4F85", logo: "haskell", logoColor: "white" },
  R: { color: "276DC3", logo: "r", logoColor: "white" },
  "C#": { color: "512BD4", logo: "dotnet", logoColor: "white" },
};

function encodeBadgeLabel(label: string): string {
  // shields path-style: escape dashes/underscores, spaces → underscore.
  return encodeURIComponent(
    label.replace(/-/g, "--").replace(/_/g, "__").replace(/ /g, "_")
  );
}

export interface TechBadge {
  name: string;
  url: string;
}

export function techBadges(stats: GithubStats): TechBadge[] {
  return stats.languages.map((l) => {
    const spec = LANG_BADGES[l.name] ?? { color: "555555", logo: "" };
    const q = new URLSearchParams({ style: "for-the-badge" });
    if (spec.logo) {
      q.set("logo", spec.logo);
      q.set("logoColor", spec.logoColor ?? "white");
    }
    return {
      name: l.name,
      url: `https://img.shields.io/badge/${encodeBadgeLabel(l.name)}-${
        spec.color
      }?${q}`,
    };
  });
}

// ----- social badges -------------------------------------------------------

export interface SocialBadge {
  key: string;
  label: string;
  img: string;
  href: string;
}

function shieldBadge(
  label: string,
  color: string,
  logo: string,
  logoColor = "white"
): string {
  const q = new URLSearchParams({
    style: "for-the-badge",
    logo,
    logoColor,
  });
  return `https://img.shields.io/badge/${encodeBadgeLabel(
    label
  )}-${color}?${q}`;
}

export function socialBadges(
  username: string,
  opts: ReadmeOptions
): SocialBadge[] {
  const list: SocialBadge[] = [
    {
      key: "github",
      label: "GitHub",
      img: shieldBadge("GitHub", "181717", "github"),
      href: `https://github.com/${username}`,
    },
  ];
  if (opts.linkedin.trim()) {
    const h = opts.linkedin.trim().replace(/^.*linkedin\.com\/in\//, "");
    list.push({
      key: "linkedin",
      label: "LinkedIn",
      img: shieldBadge("LinkedIn", "0A66C2", "linkedin"),
      href: `https://linkedin.com/in/${h}`,
    });
  }
  if (opts.twitter.trim()) {
    const h = opts.twitter.trim().replace(/^@/, "").replace(/^.*\.com\//, "");
    list.push({
      key: "twitter",
      label: "X",
      img: shieldBadge("X", "000000", "x"),
      href: `https://x.com/${h}`,
    });
  }
  if (opts.website.trim()) {
    const href = /^https?:\/\//.test(opts.website.trim())
      ? opts.website.trim()
      : `https://${opts.website.trim()}`;
    list.push({
      key: "website",
      label: "Website",
      img: shieldBadge("Website", "255E63", "googlechrome"),
      href,
    });
  }
  if (opts.email.trim()) {
    list.push({
      key: "email",
      label: "Email",
      img: shieldBadge("Email", "D14836", "gmail"),
      href: `mailto:${opts.email.trim()}`,
    });
  }
  return list;
}

// ----- About section -------------------------------------------------------

export interface AboutItem {
  emoji: string;
  label: string;
  value?: string;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

export function aboutItems(stats: GithubStats, opts: ReadmeOptions): AboutItem[] {
  const items: AboutItem[] = [];
  const featured = stats.topRepos.items[0];
  if (featured) {
    items.push({
      emoji: "🔭",
      label: "I'm currently working on",
      value: featured.name.split("/")[1] ?? featured.name,
    });
  }
  const langs = stats.languages.slice(0, 3).map((l) => l.name);
  if (langs.length) {
    items.push({ emoji: "🌱", label: "I work mostly with", value: langs.join(", ") });
  }
  if (stats.user.location) {
    items.push({ emoji: "📍", label: "Based in", value: stats.user.location });
  }
  if (stats.user.company) {
    items.push({ emoji: "🏢", label: "At", value: stats.user.company });
  }
  items.push({
    emoji: "⚡",
    label: "",
    value: `${fmt(stats.contributions.total)} contributions · ${
      stats.contributions.longestStreak
    }-day longest streak · ${fmt(stats.totalStars)} stars earned`,
  });
  if (opts.email.trim()) {
    items.push({ emoji: "📫", label: "Reach me at", value: opts.email.trim() });
  }
  return items;
}

// ----- Featured repositories ----------------------------------------------

export interface FeaturedRepo {
  name: string; // owner/repo
  repo: string;
  owner: string;
  url: string;
  stars?: number;
  language?: string | null;
  /** Pinnable only when the repo is owned by this profile's user. */
  pinUrl?: string;
}

export function featuredRepos(
  stats: GithubStats,
  theme: string
): FeaturedRepo[] {
  const u = stats.user.login.toLowerCase();
  return stats.topRepos.items.slice(0, 4).map((r) => {
    const [owner, repo] = r.name.split("/");
    const isOwn = (owner ?? "").toLowerCase() === u;
    return {
      name: r.name,
      owner: owner ?? "",
      repo: repo ?? r.name,
      url: r.url,
      stars: r.stars,
      language: r.language,
      pinUrl: isOwn
        ? `https://github-readme-stats.vercel.app/api/pin/?${new URLSearchParams(
            {
              username: owner,
              repo,
              theme,
              hide_border: "true",
            }
          )}`
        : undefined,
    };
  });
}

// ----- defaults ------------------------------------------------------------

export function defaultReadmeOptions(stats: GithubStats): ReadmeOptions {
  return {
    theme: "tokyonight",
    tagline: stats.user.bio?.trim() || `${stats.rank.title} · ${stats.rank.blurb}`,
    animatedHeader: false,
    showVisitors: true,
    showAbout: true,
    showTechStack: stats.languages.length > 0,
    showStats: true,
    showStreak: true,
    showTopLangs: stats.languages.length > 0,
    showTrophies: true,
    showActivity: true,
    showFeatured: stats.topRepos.items.length > 0,
    twitter: "",
    linkedin: "",
    email: "",
    website: stats.user.blog?.trim() || "",
  };
}

// ----- markdown builder ----------------------------------------------------

// Neutralize characters in user-derived strings that would break the layout
// or inject markup when interpolated into markdown.
function esc(s: string): string {
  return s.replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;")).trim();
}

export function buildReadme(stats: GithubStats, opts: ReadmeOptions): string {
  const u = stats.user.login;
  const name = esc(stats.user.name?.trim() || u);
  const out: string[] = [];

  // ---- header (centered) ----
  out.push(`<div align="center">`, ``);
  if (opts.animatedHeader) {
    out.push(
      `![header](${typingHeaderUrl([`Hi 👋, I'm ${name}`, opts.tagline.slice(0, 40) || u])})`,
      ``
    );
  } else {
    out.push(`# Hi 👋, I'm ${name}`, ``);
  }
  if (opts.tagline.trim()) out.push(`### ${esc(opts.tagline)}`, ``);
  if (opts.showVisitors) {
    out.push(`![Profile views](${visitorBadgeUrl(u)})`, ``);
  }
  const socials = socialBadges(u, opts);
  if (socials.length) {
    out.push(
      socials
        .map((s) => `[![${s.label}](${s.img})](${s.href})`)
        .join(" "),
      ``
    );
  }
  out.push(`</div>`, ``);

  // ---- about ----
  if (opts.showAbout) {
    out.push(`## 🚀 About Me`, ``);
    for (const it of aboutItems(stats, opts)) {
      // Labels are hardcoded (safe); only the value is user-derived, so only it
      // is escaped. Keep the label's trailing space — esc() would trim it.
      const label = it.label ? `${it.label} ` : "";
      out.push(`- ${it.emoji} ${label}${it.value ? `**${esc(it.value)}**` : ""}`);
    }
    out.push(``);
  }

  // ---- tech stack ----
  if (opts.showTechStack) {
    const badges = techBadges(stats);
    if (badges.length) {
      out.push(`## 🛠️ Tech Stack`, ``);
      out.push(
        badges.map((b) => `![${b.name}](${b.url})`).join(" "),
        ``
      );
    }
  }

  // ---- stats cards ----
  if (opts.showStats || opts.showStreak || opts.showTopLangs) {
    out.push(`## 📊 GitHub Stats`, ``, `<div align="center">`, ``);
    if (opts.showStats) {
      out.push(`![${u}'s GitHub stats](${statsCardUrl(u, opts.theme)})`, ``);
    }
    if (opts.showStreak) {
      out.push(`![GitHub Streak](${streakCardUrl(u, opts.theme)})`, ``);
    }
    if (opts.showTopLangs) {
      out.push(`![Top Languages](${topLangsUrl(u, opts.theme)})`, ``);
    }
    out.push(`</div>`, ``);
  }

  // ---- trophies ----
  if (opts.showTrophies) {
    out.push(
      `## 🏆 Trophies`,
      ``,
      `<div align="center">`,
      ``,
      `![Trophies](${trophyUrl(u, opts.theme)})`,
      ``,
      `</div>`,
      ``
    );
  }

  // ---- activity graph ----
  if (opts.showActivity) {
    out.push(
      `## 📈 Activity Graph`,
      ``,
      `[![Activity Graph](${activityGraphUrl(u, opts.theme)})](https://github.com/${u})`,
      ``
    );
  }

  // ---- featured projects ----
  if (opts.showFeatured) {
    const repos = featuredRepos(stats, opts.theme);
    if (repos.length) {
      out.push(`## 📌 Featured Projects`, ``);
      const pins = repos.filter((r) => r.pinUrl);
      const links = repos.filter((r) => !r.pinUrl);
      if (pins.length) {
        out.push(`<div align="center">`, ``);
        out.push(
          pins
            .map((r) => `[![${r.repo}](${r.pinUrl})](${r.url})`)
            .join("\n")
        );
        out.push(``, `</div>`, ``);
      }
      for (const r of links) {
        const meta = [
          r.language ? `\`${r.language}\`` : null,
          typeof r.stars === "number" ? `⭐ ${fmt(r.stars)}` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        out.push(`- [**${r.name}**](${r.url})${meta ? ` — ${meta}` : ""}`);
      }
      if (links.length) out.push(``);
    }
  }

  // ---- footer ----
  out.push(
    `---`,
    ``,
    `<div align="center">`,
    ``,
    `<sub>✨ Generated with <a href="https://githubstatss.vercel.app/readme">GitHubStats</a></sub>`,
    ``,
    `</div>`,
    ``
  );

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
