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
  totalStars: number;
  generatedAt: string;
}
