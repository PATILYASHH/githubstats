import { colorForLanguage } from "./colors";
import type { GithubStats } from "./types";

// ---------------------------------------------------------------------------
// Profile README generator
//
// Turns the stats we already fetch for a GitHub user into a personalized
// profile README.md — the kind that renders on a `username/username` repo.
//
// Every image in the output is served by OUR OWN endpoints (/api/card/* and
// /api/badge) — no third-party services. This module is the single source of
// truth for option logic and every card/badge URL, so the markdown output and
// the React preview stay in sync.
// ---------------------------------------------------------------------------

// Absolute origin used in the copyable markdown (GitHub fetches images from
// here). The live preview overrides this with "" so it hits the current origin.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://githubstatss.vercel.app";

export interface ReadmeOptions {
  /** Shared theme key, e.g. "tokyonight". */
  theme: string;
  tagline: string;
  animatedHeader: boolean;
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

// ----- URL builders (shared by markdown + preview) -------------------------

function cardUrl(
  base: string,
  type: string,
  params: Record<string, string>
): string {
  return `${base}/api/card/${type}?${new URLSearchParams(params)}`;
}

function badgeUrl(base: string, params: Record<string, string>): string {
  return `${base}/api/badge?${new URLSearchParams(params)}`;
}

export function statsCardUrl(base: string, u: string, theme: string): string {
  return cardUrl(base, "stats", { username: u, theme });
}
export function streakCardUrl(base: string, u: string, theme: string): string {
  return cardUrl(base, "streak", { username: u, theme });
}
export function topLangsUrl(base: string, u: string, theme: string): string {
  return cardUrl(base, "top-langs", { username: u, theme });
}
export function trophyUrl(base: string, u: string, theme: string): string {
  return cardUrl(base, "trophies", { username: u, theme });
}
export function activityGraphUrl(base: string, u: string, theme: string): string {
  return cardUrl(base, "activity", { username: u, theme });
}
export function headerCardUrl(base: string, text: string, theme: string): string {
  return cardUrl(base, "header", { text, theme });
}

// ----- tech-stack badges ---------------------------------------------------

export interface TechBadge {
  name: string;
  url: string;
}

export function techBadges(base: string, stats: GithubStats): TechBadge[] {
  return stats.languages.map((l) => ({
    name: l.name,
    url: badgeUrl(base, {
      message: l.name,
      color: colorForLanguage(l.name).replace(/^#/, ""),
    }),
  }));
}

// ----- social badges -------------------------------------------------------

export interface SocialBadge {
  key: string;
  label: string;
  img: string;
  href: string;
}

export function socialBadges(
  base: string,
  username: string,
  opts: ReadmeOptions
): SocialBadge[] {
  const list: SocialBadge[] = [
    {
      key: "github",
      label: "GitHub",
      img: badgeUrl(base, { message: "GitHub", color: "181717", logo: "github" }),
      href: `https://github.com/${username}`,
    },
  ];
  if (opts.linkedin.trim()) {
    const h = opts.linkedin.trim().replace(/^.*linkedin\.com\/in\//, "");
    list.push({
      key: "linkedin",
      label: "LinkedIn",
      img: badgeUrl(base, { message: "LinkedIn", color: "0A66C2", logo: "linkedin" }),
      href: `https://linkedin.com/in/${h}`,
    });
  }
  if (opts.twitter.trim()) {
    const h = opts.twitter.trim().replace(/^@/, "").replace(/^.*\.com\//, "");
    list.push({
      key: "twitter",
      label: "X",
      img: badgeUrl(base, { message: "X", color: "000000", logo: "x" }),
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
      img: badgeUrl(base, { message: "Website", color: "255E63", logo: "globe" }),
      href,
    });
  }
  if (opts.email.trim()) {
    list.push({
      key: "email",
      label: "Email",
      img: badgeUrl(base, { message: "Email", color: "D14836", logo: "email" }),
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
  base: string,
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
        ? cardUrl(base, "pin", { username: owner, repo, theme })
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

export function buildReadme(
  stats: GithubStats,
  opts: ReadmeOptions,
  base: string = SITE_URL
): string {
  const u = stats.user.login;
  const name = esc(stats.user.name?.trim() || u);
  const out: string[] = [];

  // ---- header (centered) ----
  out.push(`<div align="center">`, ``);
  if (opts.animatedHeader) {
    out.push(`![header](${headerCardUrl(base, `Hi 👋, I'm ${name}`, opts.theme)})`, ``);
  } else {
    out.push(`# Hi 👋, I'm ${name}`, ``);
  }
  if (opts.tagline.trim()) out.push(`### ${esc(opts.tagline)}`, ``);
  const socials = socialBadges(base, u, opts);
  if (socials.length) {
    out.push(socials.map((s) => `[![${s.label}](${s.img})](${s.href})`).join(" "), ``);
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
    const badges = techBadges(base, stats);
    if (badges.length) {
      out.push(`## 🛠️ Tech Stack`, ``);
      out.push(badges.map((b) => `![${b.name}](${b.url})`).join(" "), ``);
    }
  }

  // ---- stats cards ----
  if (opts.showStats || opts.showStreak || opts.showTopLangs) {
    out.push(`## 📊 GitHub Stats`, ``, `<div align="center">`, ``);
    if (opts.showStats) {
      out.push(`![${u}'s GitHub stats](${statsCardUrl(base, u, opts.theme)})`, ``);
    }
    if (opts.showStreak) {
      out.push(`![GitHub Streak](${streakCardUrl(base, u, opts.theme)})`, ``);
    }
    if (opts.showTopLangs) {
      out.push(`![Top Languages](${topLangsUrl(base, u, opts.theme)})`, ``);
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
      `![Trophies](${trophyUrl(base, u, opts.theme)})`,
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
      `[![Activity Graph](${activityGraphUrl(base, u, opts.theme)})](https://github.com/${u})`,
      ``
    );
  }

  // ---- featured projects ----
  if (opts.showFeatured) {
    const repos = featuredRepos(base, stats, opts.theme);
    if (repos.length) {
      out.push(`## 📌 Featured Projects`, ``);
      const pins = repos.filter((r) => r.pinUrl);
      const links = repos.filter((r) => !r.pinUrl);
      if (pins.length) {
        out.push(`<div align="center">`, ``);
        out.push(pins.map((r) => `[![${r.repo}](${r.pinUrl})](${r.url})`).join("\n"));
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
    `<sub>✨ Generated with <a href="${SITE_URL}/readme">GitHubStats</a></sub>`,
    ``,
    `</div>`,
    ``
  );

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
