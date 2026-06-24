export interface ContribDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface LanguageStat {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RepoContribution {
  name: string; // owner/repo
  url: string;
  contributions: number;
  stars?: number;
  language?: string | null;
}

export interface TopRepos {
  // "all-time" = accurate commit counts via GraphQL (needs GITHUB_TOKEN).
  // "recent"   = approximation from the public Events API (~last 90 days).
  source: "all-time" | "recent";
  items: RepoContribution[];
}

export interface Rank {
  title: string;
  emoji: string;
  level: number; // 1..7
  score: number;
  color: string;
  blurb: string;
}

export interface FunFacts {
  bestWeekday: string | null; // e.g. "Tuesday"
  busiestMonth: string | null; // e.g. "November 2025"
}

export interface GithubStats {
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    htmlUrl: string;
    company: string | null;
    location: string | null;
    blog: string | null;
    followers: number;
    following: number;
    publicRepos: number;
    publicGists: number;
    createdAt: string;
  };
  contributions: {
    total: number; // total contributions across all tracked history
    days: ContribDay[]; // flat list, chronological
    activeDays: number; // days with count > 0 ("green")
    trackedDays: number; // total days in the calendar history
    accountAgeDays: number; // days since account creation
    longestStreak: number;
    currentStreak: number;
    busiestDay: ContribDay | null;
  };
  languages: LanguageStat[];
  topRepos: TopRepos;
  totalStars: number;
  rank: Rank;
  funFacts: FunFacts;
  generatedAt: string;
}
