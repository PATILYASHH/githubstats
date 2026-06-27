// Shapes of the game database rows (mirrors supabase/schema.sql).

export interface Profile {
  id: string;
  github_login: string | null;
  github_id: number | null;
  avatar_url: string | null;
  name: string | null;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  github_login: string;
  avatar_url: string | null;
  name: string | null;
  contributions_total: number;
  contributions_year: number;
  streak_current: number;
  streak_longest: number;
  city: string | null;
  country: string | null;
  updated_at: string;
}

// Leaderboard dimensions (mirrors the leaderboard() SQL function).
export type LeaderPeriod = "month" | "year" | "all";
export type LeaderScope = "global" | "country" | "city";

// A row returned by the leaderboard() RPC.
export interface LeaderboardRow {
  user_id: string;
  github_login: string;
  avatar_url: string | null;
  city: string | null;
  country: string | null;
  score: number;
  all_time: number;
  streak_current: number;
  streak_longest: number;
}

export type DuelStatus =
  | "pending"
  | "active"
  | "finished"
  | "declined"
  | "cancelled";

export interface Duel {
  id: string;
  challenger_id: string;
  challenger_login: string;
  opponent_id: string | null;
  opponent_login: string | null;
  start_date: string;
  end_date: string;
  status: DuelStatus;
  created_at: string;
}
