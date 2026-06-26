import { colorForLanguage } from "./colors";
import type { GithubStats } from "./types";

// ---------------------------------------------------------------------------
// Profile README generator
//
// Turns the stats we already fetch for a GitHub user into a personalized
// profile README.md, in one of several layouts modeled on the most popular
// GitHub profile READMEs (pick a Template).
//
// Every image in the output is served by OUR OWN endpoints (/api/card/* and
// /api/badge) — no third-party services. buildReadme() is the single source of
// truth: the live preview renders its markdown directly, so any template
// previews correctly without a parallel renderer.
// ---------------------------------------------------------------------------

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://githubstatss.vercel.app";

export type SectionKey =
  | "header"
  | "about"
  | "tech"
  | "stats"
  | "trophies"
  | "activity"
  | "featured";

export interface ReadmeOptions {
  template: string;
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

// ----- templates -----------------------------------------------------------

export interface Template {
  id: string;
  name: string;
  blurb: string;
  order: SectionKey[];
  align: "center" | "left"; // alignment for about/tech/featured
  aboutStyle: "bullets" | "line" | "prose";
  statsLayout: "row" | "single";
  defaults: Partial<ReadmeOptions>;
}

const ALL_ON = {
  showAbout: true,
  showTechStack: true,
  showStats: true,
  showStreak: true,
  showTopLangs: true,
  showTrophies: true,
  showActivity: true,
  showFeatured: true,
};

export const TEMPLATES: Template[] = [
  {
    id: "comprehensive",
    name: "Comprehensive",
    blurb: "The full story — about, tech, stat cards, trophies, activity and projects.",
    order: ["header", "about", "tech", "stats", "trophies", "activity", "featured"],
    align: "left",
    aboutStyle: "bullets",
    statsLayout: "row",
    defaults: { ...ALL_ON, theme: "tokyonight", animatedHeader: false },
  },
  {
    id: "minimal",
    name: "Minimal",
    blurb: "Clean and understated — a header, a one-liner, and a single stats card.",
    order: ["header", "about", "stats"],
    align: "center",
    aboutStyle: "line",
    statsLayout: "single",
    defaults: {
      ...ALL_ON,
      showTechStack: false,
      showStreak: false,
      showTopLangs: false,
      showTrophies: false,
      showActivity: false,
      showFeatured: false,
      theme: "github_dark",
      animatedHeader: false,
    },
  },
  {
    id: "data",
    name: "Data-Driven",
    blurb: "Cards everywhere — stats, streak, languages, activity and trophies. Minimal prose.",
    order: ["header", "stats", "activity", "trophies", "tech"],
    align: "center",
    aboutStyle: "line",
    statsLayout: "row",
    defaults: {
      ...ALL_ON,
      showAbout: false,
      showFeatured: false,
      theme: "radical",
      animatedHeader: false,
    },
  },
  {
    id: "professional",
    name: "Professional",
    blurb: "Resume-style — prose intro, tech, featured projects, one stats card. No flair.",
    order: ["header", "about", "tech", "featured", "stats"],
    align: "left",
    aboutStyle: "prose",
    statsLayout: "single",
    defaults: {
      ...ALL_ON,
      showStreak: false,
      showTrophies: false,
      showActivity: false,
      theme: "github_dark",
      animatedHeader: false,
    },
  },
  {
    id: "creative",
    name: "Creative",
    blurb: "Flashy and centered — animated header, badges, cards, trophies and activity.",
    order: ["header", "about", "tech", "stats", "trophies", "activity"],
    align: "center",
    aboutStyle: "line",
    statsLayout: "row",
    defaults: {
      ...ALL_ON,
      showFeatured: false,
      theme: "dracula",
      animatedHeader: true,
    },
  },
];

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

// ----- URL builders (shared by markdown + preview) -------------------------

function cardUrl(base: string, type: string, params: Record<string, string>): string {
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

// ----- badges --------------------------------------------------------------

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

// ----- About data ----------------------------------------------------------

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
  name: string;
  repo: string;
  owner: string;
  url: string;
  stars?: number;
  language?: string | null;
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
      pinUrl: isOwn ? cardUrl(base, "pin", { username: owner, repo, theme }) : undefined,
    };
  });
}

// ----- options helpers -----------------------------------------------------

export function defaultReadmeOptions(stats: GithubStats): ReadmeOptions {
  const base: ReadmeOptions = {
    template: "comprehensive",
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
  return optionsForTemplate(stats, "comprehensive", base);
}

// Build options for a template. Preserves the user-entered fields from `prev`
// (tagline, socials) while applying the template's structure + defaults.
export function optionsForTemplate(
  stats: GithubStats,
  id: string,
  prev: ReadmeOptions
): ReadmeOptions {
  const tpl = getTemplate(id);
  const hasLangs = stats.languages.length > 0;
  const hasRepos = stats.topRepos.items.length > 0;
  return {
    ...prev,
    ...tpl.defaults,
    template: tpl.id,
    // Don't enable sections we have no data for.
    showTechStack: Boolean(tpl.defaults.showTechStack) && hasLangs,
    showTopLangs: Boolean(tpl.defaults.showTopLangs) && hasLangs,
    showFeatured: Boolean(tpl.defaults.showFeatured) && hasRepos,
  };
}

// ----- markdown builder ----------------------------------------------------

function esc(s: string): string {
  return s.replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;")).trim();
}

interface Ctx {
  stats: GithubStats;
  opts: ReadmeOptions;
  base: string;
  u: string;
  name: string;
  tpl: Template;
}

function center(lines: string[]): string[] {
  return [`<div align="center">`, ``, ...lines, ``, `</div>`];
}

function renderHeader(ctx: Ctx): string[] {
  const { opts, base, u, name } = ctx;
  const lines: string[] = [];
  if (opts.animatedHeader) {
    lines.push(`![header](${headerCardUrl(base, `Hi 👋, I'm ${name}`, opts.theme)})`, ``);
  } else {
    lines.push(`# Hi 👋, I'm ${name}`, ``);
  }
  if (opts.tagline.trim()) lines.push(`### ${esc(opts.tagline)}`, ``);
  const socials = socialBadges(base, u, opts);
  if (socials.length) {
    lines.push(socials.map((s) => `[![${s.label}](${s.img})](${s.href})`).join(" "));
  }
  return center(lines);
}

function renderAbout(ctx: Ctx): string[] {
  const { stats, opts, tpl } = ctx;
  if (!opts.showAbout) return [];
  const items = aboutItems(stats, opts);
  const centered = tpl.align === "center";

  if (tpl.aboutStyle === "line") {
    const line = items
      .filter((it) => it.value)
      .map((it) => `${it.emoji} ${esc(it.value!)}`)
      .join(" &nbsp;·&nbsp; ");
    if (!line) return [];
    return centered ? center([line]) : [line];
  }

  if (tpl.aboutStyle === "prose") {
    const langs = stats.languages.slice(0, 3).map((l) => l.name).join(", ");
    const featured = stats.topRepos.items[0]?.name.split("/")[1];
    const bits: string[] = [];
    bits.push(`I'm a **${esc(stats.rank.title)}**`);
    if (stats.user.location) bits.push(`based in ${esc(stats.user.location)}`);
    if (stats.user.company) bits.push(`at ${esc(stats.user.company)}`);
    let para = bits.join(" ") + ".";
    if (langs) para += ` I work mostly with ${esc(langs)}.`;
    if (featured) para += ` Currently building **${esc(featured)}**.`;
    para += ` ${fmt(stats.contributions.total)} contributions and a ${
      stats.contributions.longestStreak
    }-day longest streak so far.`;
    const body = [`## 🚀 About Me`, ``, para];
    return centered ? center(body) : body;
  }

  // bullets
  const out = [`## 🚀 About Me`, ``];
  for (const it of items) {
    const label = it.label ? `${it.label} ` : "";
    out.push(`- ${it.emoji} ${label}${it.value ? `**${esc(it.value)}**` : ""}`);
  }
  return out;
}

function renderTech(ctx: Ctx): string[] {
  const { stats, opts, base, tpl } = ctx;
  if (!opts.showTechStack) return [];
  const badges = techBadges(base, stats);
  if (!badges.length) return [];
  const body = [
    `## 🛠️ Tech Stack`,
    ``,
    badges.map((b) => `![${b.name}](${b.url})`).join(" "),
  ];
  return tpl.align === "center" ? center(body) : body;
}

function renderStats(ctx: Ctx): string[] {
  const { opts, base, u, tpl } = ctx;
  const row = tpl.statsLayout === "row";
  const cards: string[] = [];
  if (opts.showStats) cards.push(`![${u}'s GitHub stats](${statsCardUrl(base, u, opts.theme)})`);
  if (row && opts.showStreak) cards.push(`![GitHub Streak](${streakCardUrl(base, u, opts.theme)})`);
  if (row && opts.showTopLangs) cards.push(`![Top Languages](${topLangsUrl(base, u, opts.theme)})`);
  if (!cards.length) return [];
  // Consecutive lines (no blank between) so the cards sit side by side.
  return [`## 📊 GitHub Stats`, ``, ...center(cards)];
}

function renderTrophies(ctx: Ctx): string[] {
  const { opts, base, u } = ctx;
  if (!opts.showTrophies) return [];
  return [`## 🏆 Trophies`, ``, ...center([`![Trophies](${trophyUrl(base, u, opts.theme)})`])];
}

function renderActivity(ctx: Ctx): string[] {
  const { opts, base, u } = ctx;
  if (!opts.showActivity) return [];
  return [
    `## 📈 Activity Graph`,
    ``,
    ...center([
      `[![Activity Graph](${activityGraphUrl(base, u, opts.theme)})](https://github.com/${u})`,
    ]),
  ];
}

function renderFeatured(ctx: Ctx): string[] {
  const { stats, opts, base, tpl } = ctx;
  if (!opts.showFeatured) return [];
  const repos = featuredRepos(base, stats, opts.theme);
  if (!repos.length) return [];
  const pins = repos.filter((r) => r.pinUrl);
  const links = repos.filter((r) => !r.pinUrl);
  const out = [`## 📌 Featured Projects`, ``];
  if (pins.length) {
    // Consecutive lines so pin cards sit side by side.
    out.push(...center(pins.map((r) => `[![${r.repo}](${r.pinUrl})](${r.url})`)));
  }
  if (links.length) {
    const linkLines = links.map((r) => {
      const meta = [
        r.language ? `\`${r.language}\`` : null,
        typeof r.stars === "number" ? `⭐ ${fmt(r.stars)}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return `- [**${r.name}**](${r.url})${meta ? ` — ${meta}` : ""}`;
    });
    out.push(``, ...(tpl.align === "center" ? linkLines : linkLines));
  }
  return out;
}

function renderFooter(): string[] {
  return [
    `---`,
    ``,
    ...center([`<sub>✨ Generated with <a href="${SITE_URL}/readme">GitHubStats</a></sub>`]),
  ];
}

const RENDERERS: Record<SectionKey, (ctx: Ctx) => string[]> = {
  header: renderHeader,
  about: renderAbout,
  tech: renderTech,
  stats: renderStats,
  trophies: renderTrophies,
  activity: renderActivity,
  featured: renderFeatured,
};

export function buildReadme(
  stats: GithubStats,
  opts: ReadmeOptions,
  base: string = SITE_URL
): string {
  const tpl = getTemplate(opts.template);
  const ctx: Ctx = {
    stats,
    opts,
    base,
    u: stats.user.login,
    name: esc(stats.user.name?.trim() || stats.user.login),
    tpl,
  };

  const blocks: string[] = [];
  for (const key of tpl.order) {
    const lines = RENDERERS[key](ctx);
    if (lines.length) blocks.push(lines.join("\n"));
  }
  blocks.push(renderFooter().join("\n"));

  return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
