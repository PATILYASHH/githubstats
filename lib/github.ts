import { colorForLanguage } from "./colors";
import type { ContribDay, GithubStats, LanguageStat } from "./types";

const GH_API = "https://api.github.com";
// Free, no-auth contribution calendar API (covers full account history).
const CONTRIB_API = "https://github-contributions-api.jogruber.de/v4";

export class GithubError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function ghHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "githubstats-app",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

interface GhUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  html_url: string;
  company: string | null;
  location: string | null;
  blog: string | null;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  created_at: string;
}

interface GhRepo {
  fork: boolean;
  language: string | null;
  stargazers_count: number;
}

async function fetchUser(username: string): Promise<GhUser> {
  const res = await fetch(`${GH_API}/users/${encodeURIComponent(username)}`, {
    headers: ghHeaders(),
    next: { revalidate: 60 * 30 },
  });
  if (res.status === 404) {
    throw new GithubError(`GitHub user "${username}" not found.`, 404);
  }
  if (res.status === 403) {
    throw new GithubError(
      "GitHub API rate limit reached. Try again later (or set a GITHUB_TOKEN).",
      403
    );
  }
  if (!res.ok) {
    throw new GithubError(`GitHub returned ${res.status}.`, res.status);
  }
  return res.json();
}

async function fetchRepos(username: string): Promise<GhRepo[]> {
  const repos: GhRepo[] = [];
  // Up to 3 pages (300 most recently updated repos) keeps it fast and bounded.
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(
      `${GH_API}/users/${encodeURIComponent(
        username
      )}/repos?per_page=100&page=${page}&sort=updated`,
      { headers: ghHeaders(), next: { revalidate: 60 * 30 } }
    );
    if (!res.ok) break;
    const batch: GhRepo[] = await res.json();
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

interface ContribResponse {
  total: Record<string, number>;
  contributions: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[];
}

async function fetchContributions(username: string): Promise<ContribResponse> {
  const res = await fetch(
    `${CONTRIB_API}/${encodeURIComponent(username)}?y=all`,
    { next: { revalidate: 60 * 30 } }
  );
  if (!res.ok) {
    throw new GithubError("Could not load contribution graph.", res.status);
  }
  return res.json();
}

function buildLanguageStats(repos: GhRepo[]): LanguageStat[] {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (repo.fork) continue;
    if (!repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
      color: colorForLanguage(name),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function computeStreaks(days: ContribDay[]): {
  longest: number;
  current: number;
} {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.count > 0) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }
  // Current streak: walk backwards from the most recent day. Allow today to be
  // empty (the user may simply not have committed yet today).
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) {
      current++;
    } else if (i === days.length - 1) {
      continue; // today empty — keep counting from yesterday
    } else {
      break;
    }
  }
  return { longest, current };
}

export async function getGithubStats(username: string): Promise<GithubStats> {
  const clean = username.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(clean)) {
    throw new GithubError("Please enter a valid GitHub username.", 400);
  }

  const [user, repos, contrib] = await Promise.all([
    fetchUser(clean),
    fetchRepos(clean),
    fetchContributions(clean),
  ]);

  const days: ContribDay[] = contrib.contributions.map((c) => ({
    date: c.date,
    count: c.count,
    level: c.level,
  }));

  const total = Object.values(contrib.total).reduce((a, b) => a + b, 0);
  const activeDays = days.filter((d) => d.count > 0).length;
  const trackedDays = days.length;
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / 86_400_000
  );
  const { longest, current } = computeStreaks(days);
  const busiestDay =
    days.length > 0
      ? days.reduce((a, b) => (b.count > a.count ? b : a))
      : null;

  const totalStars = repos
    .filter((r) => !r.fork)
    .reduce((a, r) => a + r.stargazers_count, 0);

  return {
    user: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      htmlUrl: user.html_url,
      company: user.company,
      location: user.location,
      blog: user.blog,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
      publicGists: user.public_gists,
      createdAt: user.created_at,
    },
    contributions: {
      total,
      days,
      activeDays,
      trackedDays,
      accountAgeDays,
      longestStreak: longest,
      currentStreak: current,
      busiestDay,
    },
    languages: buildLanguageStats(repos),
    totalStars,
    generatedAt: new Date().toISOString(),
  };
}
