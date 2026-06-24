import { colorForLanguage } from "./colors";
import { computeRank, computeFunFacts, computeWeekdayHistogram } from "./rank";
import type {
  ContribDay,
  GithubStats,
  LanguageStat,
  RepoContribution,
  TopRepos,
} from "./types";

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

// --- Top repositories by commits ---------------------------------------

// Accurate, all-time commit counts per repository via the GraphQL API.
// Requires GITHUB_TOKEN. One request: a year-aliased query covering the whole
// account lifetime, aggregated client-side.
async function fetchTopReposGraphQL(
  username: string,
  createdAt: string
): Promise<RepoContribution[]> {
  const startYear = new Date(createdAt).getFullYear();
  const endYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  const aliases = years
    .map(
      (y) => `y${y}: contributionsCollection(
        from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
        commitContributionsByRepository(maxRepositories: 100) {
          repository { nameWithOwner url stargazerCount primaryLanguage { name } }
          contributions { totalCount }
        }
      }`
    )
    .join("\n");

  const query = `query { user(login: "${username}") { ${aliases} } }`;

  const res = await fetch(`${GH_API}/graphql`, {
    method: "POST",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    next: { revalidate: 60 * 30 },
  });
  if (!res.ok) throw new GithubError("GraphQL request failed.", res.status);

  const json = await res.json();
  const user = json?.data?.user;
  if (!user) throw new GithubError("GraphQL returned no data.", 502);

  const agg = new Map<string, RepoContribution>();
  for (const y of years) {
    const block = user[`y${y}`];
    const list = block?.commitContributionsByRepository ?? [];
    for (const entry of list) {
      const repo = entry.repository;
      if (!repo) continue;
      const name = repo.nameWithOwner as string;
      const count = entry.contributions?.totalCount ?? 0;
      const existing = agg.get(name);
      if (existing) {
        existing.contributions += count;
      } else {
        agg.set(name, {
          name,
          url: repo.url,
          contributions: count,
          stars: repo.stargazerCount,
          language: repo.primaryLanguage?.name ?? null,
        });
      }
    }
  }

  return [...agg.values()]
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 5);
}

// No-token fallback: approximate top repos from recent public push activity.
async function fetchTopReposEvents(
  username: string
): Promise<RepoContribution[]> {
  const agg = new Map<string, RepoContribution>();
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(
      `${GH_API}/users/${encodeURIComponent(
        username
      )}/events/public?per_page=100&page=${page}`,
      { headers: ghHeaders(), next: { revalidate: 60 * 15 } }
    );
    if (!res.ok) break;
    const events: any[] = await res.json();
    for (const ev of events) {
      if (ev.type !== "PushEvent") continue;
      const name: string = ev.repo?.name;
      if (!name) continue;
      // The public events feed strips commit counts from the payload, so each
      // PushEvent counts as at least one push (a lower bound on commits).
      const inc = ev.payload?.distinct_size ?? ev.payload?.size ?? 1;
      const existing = agg.get(name);
      if (existing) {
        existing.contributions += inc;
      } else {
        agg.set(name, {
          name,
          url: `https://github.com/${name}`,
          contributions: inc,
        });
      }
    }
    if (events.length < 100) break;
  }

  return [...agg.values()]
    .filter((r) => r.contributions > 0)
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 5);
}

async function getTopRepos(
  username: string,
  createdAt: string
): Promise<TopRepos> {
  if (process.env.GITHUB_TOKEN) {
    try {
      const items = await fetchTopReposGraphQL(username, createdAt);
      if (items.length > 0) return { source: "all-time", items };
    } catch {
      // fall through to the public approximation
    }
  }
  const items = await fetchTopReposEvents(username).catch(() => []);
  return { source: "recent", items };
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
  // Current streak: the calendar includes future dates for the rest of the
  // year (all empty), so start from today, not the end of the array.
  const todayStr = new Date().toISOString().slice(0, 10);
  let start = days.length - 1;
  while (start >= 0 && days[start].date > todayStr) start--;

  let current = 0;
  for (let i = start; i >= 0; i--) {
    if (days[i].count > 0) {
      current++;
    } else if (i === start) {
      continue; // today empty — keep counting from yesterday
    } else {
      break;
    }
  }
  return { longest, current };
}

function cleanUsername(username: string): string {
  const clean = username.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(clean)) {
    throw new GithubError("Please enter a valid GitHub username.", 400);
  }
  return clean;
}

// Everything except top repositories — cheap enough for OG image generation.
export async function getCoreStats(
  username: string
): Promise<Omit<GithubStats, "topRepos">> {
  const clean = cleanUsername(username);

  const [user, repos, contrib] = await Promise.all([
    fetchUser(clean),
    fetchRepos(clean),
    fetchContributions(clean),
  ]);

  // The source API groups days by year in descending order and includes future
  // dates for the rest of the current year. Sort ascending and drop the future
  // so the heatmap, breakdown and streaks all end at today.
  const todayStr = new Date().toISOString().slice(0, 10);
  const days: ContribDay[] = contrib.contributions
    .map((c) => ({ date: c.date, count: c.count, level: c.level }))
    .filter((d) => d.date <= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

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

  const rank = computeRank({
    totalContributions: total,
    totalStars,
    followers: user.followers,
    longestStreak: longest,
    activeDays,
  });

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
    rank,
    funFacts: computeFunFacts(days),
    weekdayHistogram: computeWeekdayHistogram(days),
    generatedAt: new Date().toISOString(),
  };
}

export async function getGithubStats(username: string): Promise<GithubStats> {
  const core = await getCoreStats(username);
  const topRepos = await getTopRepos(core.user.login, core.user.createdAt);
  return { ...core, topRepos };
}
